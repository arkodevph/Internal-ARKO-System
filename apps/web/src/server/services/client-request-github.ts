import { PrismaClient } from "@arko/db";

const GITHUB_API = "https://api.github.com";
const MAX_PROGRESS_BYTES = 100_000;

export type ProgressItem = { title: string; completed: boolean };

export function parseProgressMarkdown(markdown: string) {
  const items: ProgressItem[] = [];
  let fenced = false;
  for (const line of markdown.split(/\r?\n/)) {
    if (/^\s*(```|~~~)/.test(line)) {
      fenced = !fenced;
      continue;
    }
    if (fenced) continue;
    const match = line.match(
      /^\s*(?:[-*+]\s+|\d+\.\s+)\[([ xX])\]\s+(.+?)\s*$/,
    );
    if (match)
      items.push({
        title: match[2].slice(0, 240),
        completed: match[1].toLowerCase() === "x",
      });
  }
  const completed = items.filter((item) => item.completed).length;
  return {
    items,
    completed,
    total: items.length,
    percentage: items.length
      ? Math.round((completed / items.length) * 100)
      : null,
  };
}

export function parseGitHubRepositoryUrl(value: string) {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(
      "Enter a GitHub repository URL, such as https://github.com/owner/repo.",
    );
  }
  const parts = url.pathname
    .replace(/\/$/, "")
    .replace(/\.git$/, "")
    .split("/")
    .filter(Boolean);
  if (
    url.protocol !== "https:" ||
    url.hostname.toLowerCase() !== "github.com" ||
    url.username ||
    url.password ||
    url.port ||
    url.search ||
    url.hash ||
    parts.length !== 2 ||
    parts.some((part) => !/^[a-zA-Z0-9_.-]+$/.test(part))
  ) {
    throw new Error("Enter a direct https://github.com/owner/repo URL.");
  }
  return { owner: parts[0], repo: parts[1] };
}

async function githubJson(path: string): Promise<unknown> {
  const token = process.env.GITHUB_TOKEN;
  const response = await fetch(`${GITHUB_API}${path}`, {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "arko-client-portal",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    cache: "no-store",
    signal: AbortSignal.timeout(12_000),
  });
  if (response.status === 404)
    throw new Error(
      "Repository or PROGRESS.md was not found. Check the URL, branch, and GitHub token for a private repo.",
    );
  if (response.status === 403 || response.status === 429)
    throw new Error(
      "GitHub rate limit reached. Add a server-side GITHUB_TOKEN or retry later.",
    );
  if (!response.ok)
    throw new Error(`GitHub request failed (${response.status}).`);
  return response.json();
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Unexpected GitHub response.");
  return value as Record<string, unknown>;
}

export async function fetchRepositorySnapshot(
  owner: string,
  repo: string,
  requestedBranch?: string,
  lastSha?: string | null,
) {
  const base = `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;
  const repository = asRecord(await githubJson(base));
  const branch = requestedBranch || repository.default_branch;
  if (typeof branch !== "string" || !branch || branch.length > 200)
    throw new Error("Repository has no valid default branch.");

  const file = asRecord(
    await githubJson(
      `${base}/contents/PROGRESS.md?ref=${encodeURIComponent(branch)}`,
    ),
  );
  if (
    file.type !== "file" ||
    file.encoding !== "base64" ||
    typeof file.content !== "string" ||
    typeof file.size !== "number" ||
    file.size > MAX_PROGRESS_BYTES
  ) {
    throw new Error(
      "PROGRESS.md must be a text file under 100 KB in the repository root.",
    );
  }
  const progress = parseProgressMarkdown(
    Buffer.from(file.content, "base64").toString("utf8"),
  );
  const commits: { sha: string; subject: string; committedAt: Date }[] = [];
  const maxPages = lastSha ? 5 : 1;
  for (let page = 1; page <= maxPages; page++) {
    const pageSize = lastSha ? 100 : 10;
    const rawCommits = await githubJson(
      `${base}/commits?sha=${encodeURIComponent(branch)}&per_page=${pageSize}&page=${page}`,
    );
    if (!Array.isArray(rawCommits))
      throw new Error("Unexpected GitHub commit response.");
    commits.push(...rawCommits.map(parseCommit));
    if (
      !lastSha ||
      commits.some((commit) => commit.sha === lastSha) ||
      rawCommits.length < pageSize
    )
      break;
    if (page === maxPages)
      throw new Error(
        "Over 500 commits arrived since the last sync. Sync stopped to avoid skipping client updates.",
      );
  }
  const lastIndex = lastSha
    ? commits.findIndex((commit) => commit.sha === lastSha)
    : -1;
  const fresh =
    lastSha && lastIndex >= 0 ? commits.slice(0, lastIndex) : commits;
  return {
    branch,
    progress,
    commits: fresh.filter((commit) => commit.subject),
    headSha: commits[0]?.sha ?? null,
  };
}

function parseCommit(raw: unknown) {
  const entry = asRecord(raw);
  const commit = asRecord(entry.commit);
  const committer = asRecord(commit.committer);
  if (
    typeof entry.sha !== "string" ||
    !/^[0-9a-f]{40}$/.test(entry.sha) ||
    typeof commit.message !== "string" ||
    typeof committer.date !== "string" ||
    Number.isNaN(Date.parse(committer.date))
  ) {
    throw new Error("Unexpected GitHub commit data.");
  }
  return {
    sha: entry.sha,
    subject: commit.message
      .split(/\r?\n/, 1)[0]
      .replace(/[\x00-\x1f\x7f]/g, " ")
      .trim()
      .slice(0, 240),
    committedAt: new Date(committer.date),
  };
}

export async function syncClientRequestRepository(
  db: PrismaClient,
  requestId: string,
  connection?: { owner: string; repo: string; branch?: string },
) {
  const request = await db.clientRequest.findUnique({
    where: { id: requestId },
  });
  if (!request) throw new Error("Client request not found.");
  const owner = connection?.owner ?? request.githubOwner;
  const repo = connection?.repo ?? request.githubRepo;
  if (!owner || !repo) throw new Error("Connect a repository first.");
  if (
    connection &&
    request.githubOwner &&
    (request.githubOwner.toLowerCase() !== owner.toLowerCase() ||
      request.githubRepo?.toLowerCase() !== repo.toLowerCase())
  ) {
    throw new Error("This request is already connected to another repository.");
  }
  if (
    connection?.branch &&
    request.githubBranch &&
    connection.branch !== request.githubBranch
  ) {
    throw new Error("This request is already connected to another branch.");
  }
  const snapshot = await fetchRepositorySnapshot(
    owner,
    repo,
    connection?.branch ?? request.githubBranch ?? undefined,
    request.githubLastSha,
  );
  const result = await db.$transaction(async (tx) => {
    const created = snapshot.commits.length
      ? await tx.clientRequestCommitUpdate.createMany({
          data: snapshot.commits.map((commit) => ({ ...commit, requestId })),
          skipDuplicates: true,
        })
      : { count: 0 };
    await tx.clientRequest.update({
      where: { id: requestId },
      data: {
        githubOwner: owner,
        githubRepo: repo,
        githubBranch: snapshot.branch,
        githubLastSha: snapshot.headSha,
        githubSyncedAt: new Date(),
        progressCompleted: snapshot.progress.completed,
        progressTotal: snapshot.progress.total,
        progressItems: snapshot.progress.items,
      },
    });
    if (created.count > 0)
      await tx.notification.create({
        data: {
          userId: request.clientId,
          notifType: "CLIENT_REQUEST_UPDATE",
          title: `${created.count} new update${created.count === 1 ? "" : "s"} for ${request.title}`,
          message: "Your request progress has been updated.",
          link: "/dashboard/client-portal",
        },
      });
    return created.count;
  });
  return {
    newUpdates: result,
    progress: snapshot.progress.percentage,
    completed: snapshot.progress.completed,
    total: snapshot.progress.total,
  };
}

export async function syncConnectedClientRequestRepositories(db: PrismaClient) {
  const requests = await db.clientRequest.findMany({
    where: { githubOwner: { not: null }, githubRepo: { not: null } },
    select: { id: true },
    take: 100,
    orderBy: [{ githubSyncedAt: "asc" }, { id: "asc" }],
  });
  const failures: { id: string; error: string }[] = [];
  let newUpdates = 0;
  for (let index = 0; index < requests.length; index += 5) {
    const batch = await Promise.allSettled(
      requests
        .slice(index, index + 5)
        .map((request) => syncClientRequestRepository(db, request.id)),
    );
    batch.forEach((result, offset) => {
      if (result.status === "fulfilled") newUpdates += result.value.newUpdates;
      else
        failures.push({
          id: requests[index + offset].id,
          error:
            result.reason instanceof Error
              ? result.reason.message
              : "Unknown error",
        });
    });
  }
  return { checked: requests.length, newUpdates, failures };
}
