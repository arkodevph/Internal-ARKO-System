"use client";

import { useState, type DragEvent } from "react";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/server/api/root";
import { api } from "@/lib/trpc/client";
import { REVIEW_GATE_MESSAGE } from "@/server/services/review-gate";

type RouterOutput = inferRouterOutputs<AppRouter>;
type Task = RouterOutput["pmTasks"]["list"][number];

const COLUMNS = [
  { key: "TODO", label: "To Do" },
  { key: "IN_PROGRESS", label: "In Progress" },
  { key: "REVIEW", label: "Review" },
  { key: "DONE", label: "Done" },
] as const;

type ColumnKey = (typeof COLUMNS)[number]["key"];

function isStalled(task: Task): boolean {
  return Date.now() - new Date(task.updatedAt).getTime() > 48 * 3600 * 1000;
}

function isOverdue(task: Task): boolean {
  return (
    task.status !== "DONE" && new Date(task.dueDate).getTime() < Date.now()
  );
}

export function Board() {
  const utils = api.useUtils();
  const tasks = api.pmTasks.list.useQuery();
  const createTask = api.pmTasks.create.useMutation({
    onSuccess: () => utils.pmTasks.list.invalidate(),
  });
  const moveTask = api.pmTasks.move.useMutation({
    onSuccess: () => utils.pmTasks.list.invalidate(),
  });
  const recordReview = api.pmTasks.recordReview.useMutation({
    onSuccess: () => utils.pmTasks.list.invalidate(),
  });

  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [gateError, setGateError] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [reviewLinks, setReviewLinks] = useState<Record<string, string>>({});

  const data = tasks.data ?? [];
  const byStatus = (status: ColumnKey) =>
    data.filter((t) => t.status === status);

  function onDrop(e: DragEvent, status: ColumnKey) {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    const task = data.find((t) => t.id === id);
    if (!task || task.status === status) return;
    setGateError(null);
    moveTask.mutate(
      { id, status },
      {
        onError: (err) => {
          if (status === "DONE") {
            setGateError(
              `${task.title}: ${err.message || REVIEW_GATE_MESSAGE}`,
            );
          }
        },
      },
    );
  }

  function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreateError(null);
    if (!title.trim() || !dueDate) {
      setCreateError("Title and deadline are both required.");
      return;
    }
    createTask.mutate(
      { title: title.trim(), dueDate: new Date(`${dueDate}T23:59:59`) },
      {
        onSuccess: () => {
          setTitle("");
          setDueDate("");
        },
        onError: (err) => setCreateError(err.message),
      },
    );
  }

  function onRecordReview(task: Task) {
    const link = reviewLinks[task.id]?.trim();
    if (!link) return;
    setGateError(null);
    recordReview.mutate(
      { taskId: task.id, prLink: link },
      {
        onSuccess: () => {
          setReviewLinks((m) => ({ ...m, [task.id]: "" }));
          moveTask.mutate(
            { id: task.id, status: "DONE" },
            {
              onError: (err) =>
                setGateError(`${task.title}: ${err.message}`),
            },
          );
        },
        onError: (err) => setGateError(`${task.title}: ${err.message}`),
      },
    );
  }

  return (
    <div>
      <form
        onSubmit={onCreate}
        className="mb-4 flex flex-wrap items-end gap-3 rounded-lg border border-neutral-800 bg-neutral-900 p-4"
      >
        <label className="flex flex-col gap-1 text-xs text-neutral-400">
          Task
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ship client feature X"
            className="w-72 rounded border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-neutral-500"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-neutral-400">
          Deadline <span className="text-red-400">*</span>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="rounded border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-neutral-500"
          />
        </label>
        <button
          type="submit"
          disabled={createTask.isPending}
          className="rounded bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-950 hover:bg-white disabled:opacity-50"
        >
          {createTask.isPending ? "Adding…" : "Add task"}
        </button>
        {createError && (
          <span className="text-sm text-red-400">{createError}</span>
        )}
      </form>

      {gateError && (
        <div className="mb-4 rounded border border-red-900 bg-red-950/60 px-4 py-2 text-sm text-red-300">
          {gateError}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {COLUMNS.map((col) => {
          const items = byStatus(col.key);
          return (
            <section
              key={col.key}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => onDrop(e, col.key)}
              className="min-h-40 rounded-lg border border-neutral-800 bg-neutral-900/60 p-3"
            >
              <header className="mb-3 flex items-center justify-between">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                  {col.label}
                </h2>
                <span className="rounded-full bg-neutral-800 px-2 py-0.5 text-xs text-neutral-300">
                  {items.length}
                </span>
              </header>

              <div className="flex flex-col gap-2">
                {items.map((task) => (
                  <article
                    key={task.id}
                    draggable
                    onDragStart={(e) =>
                      e.dataTransfer.setData("text/plain", task.id)
                    }
                    className={`cursor-grab rounded border bg-neutral-950 p-3 text-sm active:cursor-grabbing ${
                      isOverdue(task)
                        ? "border-red-800"
                        : "border-neutral-800"
                    }`}
                  >
                    <p className="font-medium text-neutral-100">
                      {task.title}
                    </p>
                    <p className="mt-1 text-xs text-neutral-500">
                      due {new Date(task.dueDate).toLocaleDateString()}
                      {task.assignee?.name
                        ? ` · ${task.assignee.name}`
                        : ""}
                    </p>

                    <div className="mt-2 flex flex-wrap gap-1">
                      {isOverdue(task) && (
                        <span className="rounded bg-red-950 px-1.5 py-0.5 text-[10px] text-red-300">
                          overdue
                        </span>
                      )}
                      {isStalled(task) && task.status !== "DONE" && (
                        <span className="rounded bg-amber-950 px-1.5 py-0.5 text-[10px] text-amber-300">
                          stalled 48h+
                        </span>
                      )}
                      {task.reviews.length > 0 && (
                        <span className="rounded bg-emerald-950 px-1.5 py-0.5 text-[10px] text-emerald-300">
                          reviewed ×{task.reviews.length}
                        </span>
                      )}
                    </div>

                    {task.status === "REVIEW" && (
                      <div className="mt-2 flex gap-1">
                        <input
                          type="url"
                          required
                          placeholder="https://github.com/…/pull/N"
                          value={reviewLinks[task.id] ?? ""}
                          onChange={(e) =>
                            setReviewLinks((m) => ({
                              ...m,
                              [task.id]: e.target.value,
                            }))
                          }
                          className="min-w-0 flex-1 rounded border border-neutral-700 bg-neutral-900 px-2 py-1 text-xs outline-none focus:border-neutral-500"
                        />
                        <button
                          onClick={() => onRecordReview(task)}
                          disabled={recordReview.isPending}
                          className="rounded bg-neutral-100 px-2 py-1 text-xs font-medium text-neutral-950 disabled:opacity-50"
                        >
                          Approve
                        </button>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
