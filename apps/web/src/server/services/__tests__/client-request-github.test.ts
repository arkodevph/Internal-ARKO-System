import { afterEach, describe, expect, it, jest } from "@jest/globals";
import {
  fetchRepositorySnapshot,
  parseGitHubRepositoryUrl,
  parseProgressMarkdown,
} from "../client-request-github";

afterEach(() => jest.restoreAllMocks());

describe("client request GitHub progress", () => {
  it("counts checked and remaining Markdown items", () => {
    expect(
      parseProgressMarkdown(
        "# Delivery\n- [x] Wireframes\n- [ ] Client review\n1. [X] API\n",
      ),
    ).toEqual({
      items: [
        { title: "Wireframes", completed: true },
        { title: "Client review", completed: false },
        { title: "API", completed: true },
      ],
      completed: 2,
      total: 3,
      percentage: 67,
    });
  });

  it("does not count examples inside fenced code blocks", () => {
    expect(
      parseProgressMarkdown("```md\n- [x] Example\n```\n- [ ] Real work").total,
    ).toBe(1);
  });

  it("does not claim zero percent when there are no checklist items", () => {
    expect(parseProgressMarkdown("# Coming soon").percentage).toBeNull();
  });

  it("accepts direct GitHub repository URLs and rejects other hosts", () => {
    expect(
      parseGitHubRepositoryUrl("https://github.com/arko/project.git"),
    ).toEqual({ owner: "arko", repo: "project" });
    expect(() =>
      parseGitHubRepositoryUrl("https://github.com.evil.example/arko/project"),
    ).toThrow();
    expect(() =>
      parseGitHubRepositoryUrl("http://github.com/arko/project"),
    ).toThrow();
    expect(() =>
      parseGitHubRepositoryUrl("https://github.com/arko/project/extra"),
    ).toThrow();
  });

  it("reads PROGRESS.md and publishes only commits since the last SHA", async () => {
    const oldSha = "a".repeat(40);
    const newSha = "b".repeat(40);
    const commit = (sha: string, message: string) => ({
      sha,
      commit: { message, committer: { date: "2026-09-27T10:00:00Z" } },
    });
    const fetchMock = jest
      .spyOn(globalThis, "fetch")
      .mockImplementation(async (input) => {
        const url = String(input);
        if (url.endsWith("/repos/arko/project"))
          return Response.json({ default_branch: "main" });
        if (url.includes("/contents/PROGRESS.md"))
          return Response.json({
            type: "file",
            encoding: "base64",
            size: 22,
            content: Buffer.from("- [x] Done\n- [ ] Next").toString("base64"),
          });
        return Response.json([
          commit(newSha, "Client-safe update\ninternal detail"),
          commit(oldSha, "Old update"),
        ]);
      });

    const snapshot = await fetchRepositorySnapshot(
      "arko",
      "project",
      undefined,
      oldSha,
    );
    expect(snapshot.progress).toMatchObject({
      completed: 1,
      total: 2,
      percentage: 50,
    });
    expect(snapshot.commits).toEqual([
      {
        sha: newSha,
        subject: "Client-safe update",
        committedAt: new Date("2026-09-27T10:00:00Z"),
      },
    ]);
    expect(snapshot.headSha).toBe(newSha);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});
