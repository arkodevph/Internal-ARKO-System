"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ChevronDown, Search, Send, ArrowUpRight } from "lucide-react";
import type { RouterOutputs } from "../../../../lib/trpc/types";
import { api } from "../../../../lib/trpc/client";
import {
  dateLabel,
  Empty,
  LinkedText,
  PageHeading,
  Pagination,
  QueryState,
  safeWebUrl,
  Status,
  statusLabels,
} from "../_components/common";
import s from "../_components/intern.module.css";

type TaskStatus = "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE";
type Task = RouterOutputs["intern"]["tasks"]["items"][number];

function TaskDetail({ task }: { task: Task }) {
  const comments = api.intern.taskComments.useQuery({ taskId: task.id });
  const [note, setNote] = useState("");
  const [workLink, setWorkLink] = useState("");
  const [feedback, setFeedback] = useState("");
  const utils = api.useUtils();
  const update = api.intern.updateTask.useMutation({
    onSuccess: (_result, input) => {
      setNote("");
      setWorkLink("");
      setFeedback(
        input.status === "REVIEW"
          ? "Submitted for review. Your team can now review your work."
          : "Your update was saved.",
      );
      void utils.intern.tasks.invalidate();
      void utils.intern.overview.invalidate();
      void comments.refetch();
    },
  });
  return (
    <div className={s.detail}>
      <p>
        {task.description ||
          "Your team hasn’t added a description yet. Ask for context below if you need it."}
      </p>
      <div className={s.actions}>
        <span className={s.status}>{task.priority.toLowerCase()} priority</span>
        <span className={s.status}>Due {dateLabel(task.dueDate)}</span>
      </div>
      {task.reviews.length > 0 && (
        <>
          <h3>Team reviews</h3>
          {task.reviews.map((review) => (
            <div className={s.comment} key={review.id}>
              <div>
                <strong>{review.reviewer.name || "ARKO reviewer"}</strong>
                <span>{dateLabel(review.createdAt)}</span>
              </div>
              {safeWebUrl(review.prLink) && (
                <a
                  href={safeWebUrl(review.prLink)!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={s.textLink}
                >
                  View reviewed work <ArrowUpRight size={15} />
                </a>
              )}
            </div>
          ))}
        </>
      )}
      <h3>Updates & feedback</h3>
      <QueryState
        loading={comments.isLoading}
        error={comments.error}
        retry={comments.refetch}
      />
      {comments.data?.length === 0 && (
        <p className={s.feedback}>
          Add a question, progress update or work link to start the
          conversation.
        </p>
      )}
      {comments.data?.map((comment) => (
        <article className={s.comment} key={comment.id}>
          <div>
            <strong>{comment.user.name || "ARKO member"}</strong>
            <time dateTime={new Date(comment.createdAt).toISOString()}>
              {dateLabel(comment.createdAt)}
            </time>
          </div>
          <p>
            <LinkedText value={comment.content} />
          </p>
        </article>
      ))}
      {task.status !== "DONE" && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (note.trim())
              update.mutate({ id: task.id, comment: note.trim() });
          }}
        >
          <label htmlFor={`note-${task.id}`}>
            Add an update or ask a question
          </label>
          <textarea
            id={`note-${task.id}`}
            className={s.input}
            value={note}
            maxLength={2000}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What changed? What do you need help with?"
          />
          <label htmlFor={`work-${task.id}`}>Work link (optional)</label>
          <input
            type="url"
            id={`work-${task.id}`}
            className={s.input}
            value={workLink}
            maxLength={1200}
            onChange={(e) => setWorkLink(e.target.value)}
            placeholder="https://github.com/… or a design link"
          />
          <div className={s.actions}>
            {task.status === "TODO" && (
              <button
                type="button"
                className={`${s.button} ${s.primary}`}
                disabled={update.isPending}
                onClick={() =>
                  update.mutate({ id: task.id, status: "IN_PROGRESS" })
                }
              >
                Start task
              </button>
            )}
            {task.status !== "REVIEW" && (
              <button
                type="button"
                className={`${s.button} ${s.primary}`}
                disabled={update.isPending}
                onClick={() => {
                  if (workLink && !safeWebUrl(workLink)) {
                    setFeedback("Enter a complete http or https work link.");
                    return;
                  }
                  const comment = [
                    workLink ? `Work submitted: ${workLink}` : "",
                    note.trim(),
                  ]
                    .filter(Boolean)
                    .join("\n");
                  if (comment.length > 2000) {
                    setFeedback(
                      "Keep your submission and work link under 2,000 characters.",
                    );
                    return;
                  }
                  update.mutate({
                    id: task.id,
                    status: "REVIEW",
                    comment: comment || undefined,
                  });
                }}
              >
                <Send size={16} />
                {update.isPending ? "Saving…" : "Submit for review"}
              </button>
            )}
            {task.status === "REVIEW" && (
              <button
                type="button"
                className={s.button}
                disabled={update.isPending}
                onClick={() =>
                  update.mutate({ id: task.id, status: "IN_PROGRESS" })
                }
              >
                Continue working
              </button>
            )}
            <button
              type="submit"
              className={s.button}
              disabled={!note.trim() || update.isPending}
            >
              Post update
            </button>
          </div>
          <p className={s.feedback}>
            Your team marks the task complete after review.
          </p>
        </form>
      )}
      {feedback && (
        <p role="status" className={s.feedback}>
          {feedback}
        </p>
      )}
      {update.error && (
        <p role="alert" className={s.error}>
          {update.error.message}
        </p>
      )}
    </div>
  );
}

export default function InternTasks() {
  const params = useSearchParams();
  const [selected, setSelected] = useState<string | null>(params.get("task"));
  const [status, setStatus] = useState<TaskStatus | "">("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const query = api.intern.tasks.useQuery({
    page,
    status: status || undefined,
    search,
    focusId: params.get("task") || undefined,
  });
  useEffect(() => {
    setSelected(params.get("task"));
  }, [params]);
  return (
    <>
      <PageHeading title="My Tasks">
        Know what’s next, share your progress and get feedback from your team.
      </PageHeading>
      {params.get("task") && (
        <div className={s.toolbar}>
          <Link className={s.button} href="/intern/tasks">
            Show all tasks
          </Link>
        </div>
      )}
      <div className={s.toolbar}>
        <div className={s.search}>
          <Search size={18} />
          <input
            aria-label="Search your tasks"
            className={s.input}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search your tasks…"
          />
        </div>
        <select
          aria-label="Filter task status"
          className={s.input}
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as TaskStatus | "");
            setPage(1);
          }}
        >
          <option value="">All statuses</option>
          {Object.entries(statusLabels).map(([value, label]) => (
            <option value={value} key={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <QueryState
        loading={query.isLoading}
        error={query.error}
        retry={query.refetch}
      />
      {query.data && (
        <section className={s.panel} aria-label="Assigned tasks">
          {query.data.items.length ? (
            query.data.items.map((task) => (
              <div key={task.id}>
                <button
                  type="button"
                  className={`${s.taskRow} ${s.taskButton}`}
                  aria-expanded={selected === task.id}
                  aria-controls={`task-detail-${task.id}`}
                  onClick={() =>
                    setSelected(selected === task.id ? null : task.id)
                  }
                >
                  <span className={s.taskCheck} />
                  <span className={s.grow}>
                    <strong>{task.title}</strong>
                    <small>
                      {task.project?.name || "ARKO"} · Due{" "}
                      {dateLabel(task.dueDate)}
                    </small>
                  </span>
                  <Status status={task.status} />
                  <ChevronDown size={17} />
                </button>
                {selected === task.id && (
                  <div id={`task-detail-${task.id}`}>
                    <TaskDetail task={task} />
                  </div>
                )}
              </div>
            ))
          ) : (
            <Empty
              title={
                search || status
                  ? "No matching tasks"
                  : "Your next assignment starts here"
              }
            >
              {search || status
                ? "Try another search or choose All statuses."
                : "When your team assigns work to you, it will appear here with a deadline and space for feedback."}
            </Empty>
          )}
        </section>
      )}
      <Pagination
        page={page}
        pages={query.data?.pages || 1}
        onChange={setPage}
      />
    </>
  );
}
