"use client";

import { useState } from "react";
import type { inferRouterOutputs } from "@trpc/server";
import {
  CheckCircle2,
  Circle,
  GitCommitHorizontal,
  Github,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { Button } from "@arko/ui";
import { api } from "../../../lib/trpc/client";
import type { AppRouter } from "../../../server/api/root";

type Request =
  inferRouterOutputs<AppRouter>["clientPortal"]["requests"][number];
type Item = { title: string; completed: boolean };

function progressItems(value: unknown): Item[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is Item =>
      Boolean(item) &&
      typeof item === "object" &&
      typeof item.title === "string" &&
      typeof item.completed === "boolean",
  );
}

export function RequestRepositoryProgress({
  request,
  isAdmin,
}: {
  request: Request;
  isAdmin: boolean;
}) {
  const [repositoryUrl, setRepositoryUrl] = useState("");
  const [branch, setBranch] = useState("");
  const [message, setMessage] = useState("");
  const utils = api.useUtils();
  const onSuccess = (result: {
    newUpdates: number;
    completed: number;
    total: number;
  }) => {
    setMessage(
      `Synced. ${result.newUpdates} new commit ${result.newUpdates === 1 ? "update" : "updates"} published; ${result.completed} of ${result.total} checklist items done.`,
    );
    void utils.clientPortal.requests.invalidate();
  };
  const connect = api.clientPortal.connectRequestRepository.useMutation({
    onSuccess,
    onError: (error) => setMessage(error.message),
  });
  const sync = api.clientPortal.syncRequestRepository.useMutation({
    onSuccess,
    onError: (error) => setMessage(error.message),
  });
  const connected = Boolean(request.githubOwner && request.githubRepo);
  const items = progressItems(request.progressItems);
  const total = request.progressTotal ?? 0;
  const completed = request.progressCompleted ?? 0;
  const percentage = total ? Math.round((completed / total) * 100) : null;
  const pending = connect.isPending || sync.isPending;

  return (
    <div className="border-t border-border-subtle px-4 py-4 sm:px-5">
      {connected ? (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-text-tertiary">
                <Github
                  className="h-4 w-4 text-primary-400"
                  aria-hidden="true"
                />
                Checklist progress
              </div>
              <p className="mt-2 text-sm text-text-secondary">
                {total ? (
                  <>
                    <span className="font-semibold tabular-nums text-text-primary">
                      {percentage}%
                    </span>{" "}
                    · {completed} of {total} items done
                  </>
                ) : (
                  "PROGRESS.md has no checklist items yet"
                )}
              </p>
              {total > 0 && (
                <div
                  className="mt-2 h-2 overflow-hidden rounded-full bg-primary-500/10"
                  role="progressbar"
                  aria-label={`Progress for ${request.title}`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={percentage ?? 0}
                >
                  <div
                    className="h-full rounded-full bg-primary-500 transition-[width]"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              )}
              <p className="mt-2 text-xs text-text-tertiary">
                Based on PROGRESS.md
                {request.githubSyncedAt
                  ? ` · Updated ${new Date(request.githubSyncedAt).toLocaleString()}`
                  : ""}
              </p>
            </div>
            {isAdmin && (
              <Button
                size="sm"
                variant="outline"
                disabled={pending}
                onClick={() => {
                  setMessage("");
                  sync.mutate({ id: request.id });
                }}
              >
                {pending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Sync now
              </Button>
            )}
          </div>

          {items.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-border-subtle bg-primary-500/[0.04] p-3">
                <p className="text-xs font-semibold text-text-primary">
                  Done · {completed}
                </p>
                <ul className="mt-2 space-y-1.5">
                  {items
                    .filter((item) => item.completed)
                    .slice(0, 8)
                    .map((item, index) => (
                      <li
                        key={`${item.title}-${index}`}
                        className="flex gap-2 text-xs leading-5 text-text-secondary"
                      >
                        <CheckCircle2
                          className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary-400"
                          aria-hidden="true"
                        />
                        {item.title}
                      </li>
                    ))}
                  {completed === 0 && (
                    <li className="text-xs text-text-tertiary">
                      Nothing checked off yet.
                    </li>
                  )}
                  {completed > 8 && (
                    <li className="text-xs text-text-tertiary">
                      +{completed - 8} more
                    </li>
                  )}
                </ul>
              </div>
              <div className="rounded-xl border border-border-subtle bg-card p-3">
                <p className="text-xs font-semibold text-text-primary">
                  Still to do · {total - completed}
                </p>
                <ul className="mt-2 space-y-1.5">
                  {items
                    .filter((item) => !item.completed)
                    .slice(0, 8)
                    .map((item, index) => (
                      <li
                        key={`${item.title}-${index}`}
                        className="flex gap-2 text-xs leading-5 text-text-secondary"
                      >
                        <Circle
                          className="mt-0.5 h-3.5 w-3.5 shrink-0 text-text-tertiary"
                          aria-hidden="true"
                        />
                        {item.title}
                      </li>
                    ))}
                  {completed === total && (
                    <li className="text-xs text-text-tertiary">
                      All checklist items are done.
                    </li>
                  )}
                  {total - completed > 8 && (
                    <li className="text-xs text-text-tertiary">
                      +{total - completed - 8} more
                    </li>
                  )}
                </ul>
              </div>
            </div>
          )}

          {request.commitUpdates.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">
                Development updates
              </p>
              <ol className="mt-2 space-y-2">
                {request.commitUpdates.map((update) => (
                  <li
                    key={update.id}
                    className="flex gap-2 rounded-lg border border-border-subtle px-3 py-2.5"
                  >
                    <GitCommitHorizontal
                      className="mt-0.5 h-4 w-4 shrink-0 text-primary-400"
                      aria-hidden="true"
                    />
                    <div className="min-w-0">
                      <p className="break-words text-sm text-text-primary">
                        {update.subject}
                      </p>
                      <p className="mt-1 text-xs text-text-tertiary">
                        {new Date(update.committedAt).toLocaleString()}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          )}
          {isAdmin && (
            <p className="text-xs text-text-tertiary">
              Connected to {request.githubOwner}/{request.githubRepo} ·{" "}
              {request.githubBranch}
            </p>
          )}
        </div>
      ) : isAdmin ? (
        <div className="space-y-3">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold text-text-primary">
              <Github className="h-4 w-4 text-primary-400" aria-hidden="true" />
              Connect a GitHub repo
            </p>
            <p className="mt-1 text-xs leading-5 text-text-tertiary">
              Commits and the root PROGRESS.md checklist will become visible to
              this client automatically. Use a client-safe commit subject.
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_12rem_auto]">
            <input
              type="url"
              aria-label="GitHub repository URL"
              value={repositoryUrl}
              onChange={(event) => setRepositoryUrl(event.target.value)}
              placeholder="https://github.com/owner/repo"
              className="min-h-11 min-w-0 rounded-lg border border-border-subtle bg-card px-3 text-sm text-text-primary placeholder:text-text-tertiary focus:border-primary-500 focus:outline-none"
            />
            <input
              aria-label="Branch (optional)"
              value={branch}
              onChange={(event) => setBranch(event.target.value)}
              placeholder="Default branch"
              className="min-h-11 min-w-0 rounded-lg border border-border-subtle bg-card px-3 text-sm text-text-primary placeholder:text-text-tertiary focus:border-primary-500 focus:outline-none"
            />
            <Button
              size="sm"
              disabled={!repositoryUrl.trim() || pending}
              onClick={() => {
                setMessage("");
                connect.mutate({
                  id: request.id,
                  repositoryUrl: repositoryUrl.trim(),
                  branch: branch.trim() || undefined,
                });
              }}
            >
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}Connect
            </Button>
          </div>
          <p className="text-xs text-text-tertiary">
            Private repos require a server-side GITHUB_TOKEN with repository
            Contents read permission.
          </p>
        </div>
      ) : (
        <p className="text-xs text-text-tertiary">
          Your team has not connected delivery progress for this request yet.
        </p>
      )}
      {message && (
        <p
          role="status"
          aria-live="polite"
          className="mt-3 rounded-lg border border-border-subtle px-3 py-2 text-xs text-text-secondary"
        >
          {message}
        </p>
      )}
    </div>
  );
}
