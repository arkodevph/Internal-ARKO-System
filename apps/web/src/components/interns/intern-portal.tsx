"use client";

import Link from "next/link";
import type { Role } from "@arko/db";
import { useState, type FormEvent } from "react";
import { useSession } from "next-auth/react";
import {
  BookOpen,
  CalendarDays,
  Circle,
  Check,
  CheckCircle2,
  ClipboardList,
  Download,
  ExternalLink,
  GraduationCap,
  Loader2,
  Pencil,
  Plus,
  Search,
  Table2,
  Trash2,
  UserRound,
} from "lucide-react";
import { api } from "../../lib/trpc/client";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "../../server/api/root";
type RouterOutputs = inferRouterOutputs<AppRouter>;
import { hasPermission } from "../../lib/rbac";
import "./intern-portal.css";
import { internErrorMessage } from "../../lib/intern-errors";

type Overview = RouterOutputs["interns"]["overview"];
type Log = Overview["logs"][number];
type Activity = Overview["activities"][number];
const today = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};
const dateKey = (date: Date) => new Date(date).toISOString().slice(0, 10);
const displayDate = (date: Date | string) =>
  new Date(
    typeof date === "string" ? `${date}T00:00:00Z` : date,
  ).toLocaleDateString("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
const statusLabel = (status: string) =>
  ({
    IN_PROGRESS: "In progress",
    SUBMITTED: "Awaiting review",
    COMPLETED: "Completed",
    CHANGES_REQUESTED: "Changes requested",
    TODO: "To do",
    REVIEW: "In review",
    DONE: "Done",
  })[status] ?? status;

function Feedback({ error, message }: { error?: string; message?: string }) {
  return (
    <>
      {error && (
        <p className="ip-feedback ip-error" role="alert">
          {internErrorMessage(error)}
        </p>
      )}
      <p className="ip-feedback" role="status">
        {message}
      </p>
    </>
  );
}
function Empty({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="ip-empty">
      <BookOpen size={25} aria-hidden="true" />
      <h3>{title}</h3>
      <p>{children}</p>
    </div>
  );
}

export function InternPortal({ section }: { section: string }) {
  const { data: session } = useSession();
  const overview = api.interns.overview.useQuery();
  const data = overview.data;
  const hours = data?.logs.reduce((total, log) => total + log.hours, 0);
  const completed = data?.submissions.filter(
    (item) => item.status === "COMPLETED" && !item.activity.archived,
  ).length;
  const tabs = [
    { key: "log", label: "Learning log", icon: Table2 },
    { key: "studies", label: "Exercises & studies", icon: BookOpen },
    { key: "tasks", label: "My tasks", icon: ClipboardList },
    { key: "profile", label: "Profile", icon: UserRound },
  ];
  return (
    <div className="intern-portal ip-workspace">
      <header className="ip-header">
        <div>
          <div className="ip-kicker">
            <GraduationCap size={17} aria-hidden="true" /> ARKO · Intern
            workspace
          </div>
          <h1>{section === "tasks" ? "My tasks" : "Intern portal"}</h1>
          <p>
            {section === "tasks"
              ? "A clear view of what’s next. Make progress, one task at a time."
              : "A place for your daily discoveries, practice, and progress."}
          </p>
        </div>
        <div className="ip-header-date">
          <span>
            {new Date().toLocaleDateString("en", { weekday: "long" })}
          </span>
          <strong>
            {new Date().toLocaleDateString("en", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </strong>
        </div>
      </header>
      <div className="ip-summary" aria-label="Your internship progress">
        <div>
          <span>Hours logged</span>
          <strong>
            {hours === undefined ? "—" : Number(hours.toFixed(2))}
            <small>
              {data?.profile?.requiredHours
                ? ` / ${data.profile.requiredHours} hrs`
                : " hrs"}
            </small>
          </strong>
        </div>
        <div>
          <span>Days documented</span>
          <strong>
            {data?.logs.length ?? "—"}
            <small> learning days</small>
          </strong>
        </div>
        <div>
          <span>Activities completed</span>
          <strong>
            {completed ?? "—"}
            <small>{data ? ` / ${data.activities.length}` : ""}</small>
          </strong>
        </div>
        <div className="ip-summary-note">
          {data?.profile?.requiredHours && hours !== undefined ? (
            <div className="ip-hours-progress">
              <span>
                Internship progress{" "}
                <strong>
                  {Math.round((hours / data.profile.requiredHours) * 100)}%
                </strong>
              </span>
              <progress
                aria-label="Internship hours completed"
                max={data.profile.requiredHours}
                value={Math.min(hours, data.profile.requiredHours)}
              />
            </div>
          ) : (
            <span>Keep your learning and work in one place.</span>
          )}
        </div>
      </div>
      <nav className="ip-tabs" aria-label="Intern portal">
        {tabs.map(({ key, label, icon: Icon }) => (
          <Link
            key={key}
            href={`/intern/${key}`}
            aria-current={section === key ? "page" : undefined}
          >
            <Icon size={17} aria-hidden="true" />
            {label}
          </Link>
        ))}
      </nav>
      {overview.isLoading ? (
        <div className="ip-loading" role="status">
          <Loader2 className="ip-spin" size={20} /> Loading your workspace…
        </div>
      ) : overview.error ? (
        <div className="ip-empty">
          <h2>Your workspace couldn’t load</h2>
          <p role="alert">{internErrorMessage(overview.error.message)}</p>
          <button className="ip-button" onClick={() => overview.refetch()}>
            Try again
          </button>
        </div>
      ) : (
        data && (
          <>
            {section === "log" && (
              <LearningLog
                logs={data.logs}
                name={session?.user?.name ?? "Intern"}
              />
            )}
            {section === "studies" && (
              <Studies
                activities={data.activities}
                submissions={data.submissions}
                isAdmin={false}
              />
            )}
            {section === "tasks" && (
              <InternTasks
                userId={session?.user?.id}
                role={session?.user?.role}
                permissions={session?.user?.permissions}
              />
            )}
            {section === "profile" && (
              <InternProfile profile={data.profile} hours={hours ?? 0} />
            )}
          </>
        )
      )}
    </div>
  );
}

function LearningLog({ logs, name }: { logs: Log[]; name: string }) {
  const [query, setQuery] = useState("");
  const [month, setMonth] = useState("");
  const [draft, setDraft] = useState<{
    id?: string;
    date: string;
    learned: string;
    workedOn: string;
    blockers: string;
    hours: string;
  } | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const utils = api.useUtils();
  const save = api.interns.saveLog.useMutation({
    onSuccess: async () => {
      await utils.interns.overview.invalidate();
      setDraft(null);
      setMessage("Daily entry saved.");
      setError("");
    },
  });
  const remove = api.interns.deleteLog.useMutation({
    onSuccess: async () => {
      await utils.interns.overview.invalidate();
      setDeleteId(null);
      setMessage("Entry deleted.");
      setError("");
    },
  });
  const filtered = logs.filter(
    (log) =>
      (!month || dateKey(log.date).startsWith(month)) &&
      `${log.learned} ${log.workedOn} ${log.blockers}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  function edit(log?: Log) {
    if (
      draft &&
      !window.confirm("Discard the entry you are currently editing?")
    )
      return;
    setMessage("");
    setError("");
    setDeleteId(null);
    setDraft(
      log
        ? {
            id: log.id,
            date: dateKey(log.date),
            learned: log.learned,
            workedOn: log.workedOn,
            blockers: log.blockers,
            hours: String(log.hours),
          }
        : { date: today(), learned: "", workedOn: "", blockers: "", hours: "" },
    );
  }
  async function saveEntry(event: FormEvent) {
    event.preventDefault();
    if (!draft) return;
    if (
      logs.some(
        (log) => dateKey(log.date) === draft.date && log.id !== draft.id,
      )
    ) {
      setError(
        "There is already an entry for this date. Cancel and edit that row to keep one record per day.",
      );
      return;
    }
    try {
      await save.mutateAsync({ ...draft, hours: Number(draft.hours) });
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not save. Your entry is still here; try again.",
      );
    }
  }
  function exportCsv() {
    const cell = (value: string | number) =>
      `"${String(value)
        .replace(/^[=+@\-\t\r]/, "'$&")
        .replaceAll('"', '""')}"`;
    const csv = [
      [
        "Date",
        "What I learned",
        "What I worked on",
        "Blockers",
        "Hours",
        "Review feedback",
      ],
      ...filtered.map((log) => [
        dateKey(log.date),
        log.learned,
        log.workedOn,
        log.blockers,
        log.hours,
        log.feedback,
      ]),
    ]
      .map((row) => row.map(cell).join(","))
      .join("\r\n");
    const url = URL.createObjectURL(
      new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8;" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `${name.replace(/[^a-z0-9]/gi, "-")}-learning-log.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setMessage(
      `Exported ${filtered.length} ${filtered.length === 1 ? "entry" : "entries"}.`,
    );
  }
  return (
    <section>
      <div className="ip-section-heading">
        <div>
          <h2>Your daily learning log</h2>
          <p>
            One row per day. Capture what you learned while it’s still fresh.
          </p>
        </div>
        <button
          className="ip-button ip-primary"
          disabled={save.isPending || !!draft}
          onClick={() =>
            edit(logs.find((log) => dateKey(log.date) === today()))
          }
        >
          <Plus size={17} />
          Log today
        </button>
      </div>
      <div className="ip-toolbar">
        <label className="ip-search">
          <Search size={16} aria-hidden="true" />
          <span className="ip-sr-only">Search learning log</span>
          <input
            placeholder="Find a learning or activity…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <label className="ip-month">
          Month
          <input
            aria-label="Filter by month"
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          />
        </label>
        {(month || query) && (
          <button
            className="ip-text-button"
            onClick={() => {
              setMonth("");
              setQuery("");
            }}
          >
            Clear filters
          </button>
        )}
        <button
          className="ip-button"
          onClick={exportCsv}
          disabled={!filtered.length}
        >
          <Download size={16} />
          Export CSV
        </button>
      </div>
      <Feedback message={message} error={error} />
      {draft && (
        <form onSubmit={saveEntry} className="ip-editor">
          <div className="ip-editor-heading">
            <strong>{draft.id ? "Edit daily entry" : "New daily entry"}</strong>
            <span>Required: date, learning, and hours</span>
          </div>
          <div className="ip-form-grid">
            <label>
              Date
              <input
                autoFocus
                type="date"
                required
                value={draft.date}
                onChange={(e) => setDraft({ ...draft, date: e.target.value })}
              />
            </label>
            <label>
              Hours spent
              <input
                type="number"
                required
                min="0"
                max="24"
                step="0.25"
                placeholder="e.g. 8"
                value={draft.hours}
                onChange={(e) => setDraft({ ...draft, hours: e.target.value })}
              />
            </label>
            <label className="ip-wide">
              What did you learn?
              <textarea
                required
                maxLength={12000}
                rows={3}
                placeholder="Explain a concept, discovery, or skill in your own words."
                value={draft.learned}
                onChange={(e) =>
                  setDraft({ ...draft, learned: e.target.value })
                }
              />
            </label>
            <label>
              What did you work on? <span>Optional</span>
              <textarea
                rows={2}
                maxLength={12000}
                value={draft.workedOn}
                onChange={(e) =>
                  setDraft({ ...draft, workedOn: e.target.value })
                }
              />
            </label>
            <label>
              Blockers or questions <span>Optional</span>
              <textarea
                rows={2}
                maxLength={6000}
                value={draft.blockers}
                onChange={(e) =>
                  setDraft({ ...draft, blockers: e.target.value })
                }
              />
            </label>
          </div>
          {draft.id && logs.find((log) => log.id === draft.id)?.reviewedAt && (
            <p className="ip-help">
              Saving changes will send this entry back for a fresh admin review.
            </p>
          )}
          <div className="ip-actions">
            <button
              className="ip-button"
              type="button"
              disabled={save.isPending}
              onClick={() => {
                setDraft(null);
                setError("");
              }}
            >
              Cancel
            </button>
            <button className="ip-button ip-primary" disabled={save.isPending}>
              {save.isPending ? "Saving…" : "Save entry"}
            </button>
          </div>
        </form>
      )}
      <div
        className="ip-table-wrap"
        tabIndex={0}
        role="region"
        aria-label="Daily learning spreadsheet; scroll horizontally for more columns"
      >
        <table className="ip-table">
          <caption className="ip-sr-only">Your dated learning entries</caption>
          <thead>
            <tr>
              <th scope="col" className="ip-row-number">
                #
              </th>
              <th scope="col">Date</th>
              <th scope="col" className="ip-learning-column">
                What I learned
              </th>
              <th scope="col">Worked on</th>
              <th scope="col">Blockers / questions</th>
              <th scope="col" className="ip-number">
                Hours
              </th>
              <th scope="col">Review</th>
              <th scope="col">
                <span className="ip-sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((log, index) => (
              <tr key={log.id}>
                <td className="ip-row-number">{index + 1}</td>
                <th scope="row">
                  <time dateTime={dateKey(log.date)}>
                    {displayDate(log.date)}
                  </time>
                  {dateKey(log.date) === today() && (
                    <span className="ip-today">Today</span>
                  )}
                </th>
                <td className="ip-learning-cell">{log.learned}</td>
                <td>{log.workedOn || "—"}</td>
                <td>{log.blockers || "—"}</td>
                <td className="ip-number">{log.hours}</td>
                <td>
                  <span
                    className={`ip-badge ${log.reviewedAt ? "ip-complete" : ""}`}
                  >
                    {log.reviewedAt ? "Reviewed" : "Awaiting review"}
                  </span>
                  {log.feedback && (
                    <p className="ip-review-copy">{log.feedback}</p>
                  )}
                </td>
                <td>
                  <button
                    className="ip-icon-button"
                    aria-label={`Edit entry for ${displayDate(log.date)}`}
                    disabled={save.isPending || remove.isPending}
                    onClick={() => edit(log)}
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    className="ip-icon-button"
                    aria-label={`Delete entry for ${displayDate(log.date)}`}
                    disabled={remove.isPending || !!draft}
                    onClick={() => {
                      setDeleteId(log.id);
                      setError("");
                    }}
                  >
                    <Trash2 size={15} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!filtered.length && (
          <Empty
            title={
              logs.length ? "No matching entries" : "Your first day starts here"
            }
          >
            {logs.length
              ? "Try another search or clear your month filter."
              : "Use “Log today” to record your first learning. Your entries will appear here, one day at a time."}
          </Empty>
        )}
        <button
          className="ip-add-row"
          disabled={!!draft}
          onClick={() => edit()}
        >
          <Plus size={16} />
          Add a dated entry
        </button>
      </div>
      {deleteId && (
        <div
          className="ip-delete-confirm"
          role="group"
          aria-label="Confirm deletion"
        >
          <p>
            Delete the entry for{" "}
            {displayDate(logs.find((log) => log.id === deleteId)!.date)}? This
            cannot be undone.
          </p>
          <button
            className="ip-button"
            disabled={remove.isPending}
            onClick={() => setDeleteId(null)}
          >
            Keep entry
          </button>
          <button
            className="ip-button ip-danger"
            disabled={remove.isPending}
            onClick={async () => {
              try {
                await remove.mutateAsync({ id: deleteId });
              } catch (cause) {
                setError(
                  cause instanceof Error
                    ? cause.message
                    : "Could not delete entry.",
                );
              }
            }}
          >
            {remove.isPending ? "Deleting…" : "Delete entry"}
          </button>
        </div>
      )}
      <div className="ip-table-footer">
        <span>
          {filtered.length} {filtered.length === 1 ? "entry" : "entries"}
          {month || query ? " matching your filters" : " in your journal"}
        </span>
        <span>
          {Number(filtered.reduce((sum, log) => sum + log.hours, 0).toFixed(2))}{" "}
          hours in view
        </span>
      </div>
    </section>
  );
}

function Studies({
  activities,
  submissions,
  isAdmin,
}: {
  activities: Activity[];
  submissions: Overview["submissions"];
  isAdmin: boolean;
}) {
  const [kind, setKind] = useState("ALL");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [response, setResponse] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const utils = api.useUtils();
  const save = api.interns.saveSubmission.useMutation({
    onSuccess: () => utils.interns.overview.invalidate(),
  });
  const selected = activities.find((item) => item.id === selectedId);
  const submission = submissions.find((item) => item.activityId === selectedId);
  function openActivity(activity: Activity) {
    if (
      selectedId &&
      response !==
        (submissions.find((item) => item.activityId === selectedId)?.response ??
          "") &&
      !window.confirm("Discard your unsaved response?")
    )
      return;
    setSelectedId(activity.id);
    setResponse(
      submissions.find((item) => item.activityId === activity.id)?.response ??
        "",
    );
    setError("");
    setMessage("");
  }
  async function saveResponse(submit: boolean) {
    if (!selected) return;
    setError("");
    try {
      await save.mutateAsync({ activityId: selected.id, response, submit });
      setMessage(submit ? "Submitted for admin review." : "Draft saved.");
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not save. Your response is still here.",
      );
    }
  }
  return (
    <section>
      <div className="ip-section-heading">
        <div>
          <h2>Learn it. Put it into practice.</h2>
          <p>Study material and hands-on exercises from your Arko admins.</p>
        </div>
        {isAdmin && (
          <Link className="ip-button" href="/dashboard/interns/admin">
            <Plus size={16} />
            Manage activities
          </Link>
        )}
      </div>
      <div className="ip-filter-buttons" aria-label="Activity type">
        {["ALL", "STUDY", "EXERCISE"].map((value) => (
          <button
            key={value}
            aria-pressed={kind === value}
            onClick={() => setKind(value)}
          >
            {value === "ALL"
              ? "All activities"
              : value === "STUDY"
                ? "Studies"
                : "Exercises"}
          </button>
        ))}
      </div>
      <div className={`ip-study-layout ${selected ? "ip-has-selection" : ""}`}>
        <div className="ip-activity-list">
          {activities
            .filter((item) => kind === "ALL" || item.kind === kind)
            .map((activity, index) => {
              const progress = submissions.find(
                (item) => item.activityId === activity.id,
              );
              return (
                <button
                  key={activity.id}
                  className="ip-activity"
                  aria-pressed={selectedId === activity.id}
                  onClick={() => openActivity(activity)}
                >
                  <span className="ip-activity-number">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span>
                    <span className="ip-activity-kind">
                      {activity.kind === "STUDY" ? "Study" : "Exercise"}
                    </span>
                    <strong>{activity.title}</strong>
                    <span className="ip-activity-preview">
                      {activity.description}
                    </span>
                  </span>
                  <span
                    className={`ip-badge ${progress?.status === "COMPLETED" ? "ip-complete" : ""}`}
                  >
                    {progress ? statusLabel(progress.status) : "Not started"}
                  </span>
                </button>
              );
            })}
          {!activities.filter((item) => kind === "ALL" || item.kind === kind)
            .length && (
            <Empty title="No activities here yet">
              {isAdmin
                ? "Open the Admin desk to publish your first study or exercise."
                : "Your admins will publish learning material here. You can keep documenting your learning in the meantime."}
            </Empty>
          )}
        </div>
        {selected && (
          <div className="ip-study-detail">
            <div className="ip-detail-heading">
              <span className="ip-activity-kind">
                {selected.kind === "STUDY"
                  ? "Study material"
                  : "Practical exercise"}
              </span>
              <h3>{selected.title}</h3>
            </div>
            <p className="ip-prose">{selected.description}</p>
            {selected.resourceUrl && (
              <a
                href={selected.resourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ip-resource-link"
              >
                Open learning resource <ExternalLink size={14} />
                <span className="ip-sr-only"> (opens in a new tab)</span>
              </a>
            )}
            {submission?.feedback && (
              <div className="ip-admin-feedback">
                <strong>
                  Admin feedback · {statusLabel(submission.status)}
                </strong>
                <p>{submission.feedback}</p>
              </div>
            )}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                saveResponse(true);
              }}
            >
              <label>
                {selected.kind === "STUDY" ? "Your takeaway" : "Your solution"}
                <textarea
                  rows={7}
                  maxLength={20000}
                  placeholder="Write your response, and include a link to your work if relevant."
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  required
                />
              </label>
              <p className="ip-help">
                Submitting sends your response to an Arko admin for review.
                Editing a reviewed response starts a fresh review.
              </p>
              <Feedback error={error} message={message} />
              <div className="ip-actions">
                <button
                  className="ip-button"
                  type="button"
                  disabled={save.isPending}
                  onClick={() => saveResponse(false)}
                >
                  Save draft
                </button>
                <button
                  className="ip-button ip-primary"
                  disabled={save.isPending}
                >
                  {save.isPending ? "Saving…" : "Submit for review"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </section>
  );
}

function InternTasks({
  userId,
  role,
  permissions,
}: {
  userId?: string;
  role?: Role;
  permissions: unknown;
}) {
  const canRead = hasPermission(role, "tasks:read", permissions);
  const canUpdate = hasPermission(role, "tasks:update", permissions);
  const tasks = api.interns.tasks.useQuery(undefined, { enabled: canRead });
  const utils = api.useUtils();
  const [filter, setFilter] = useState("ACTIVE");
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const update = api.tasks.updateStatus.useMutation({
    onSuccess: () => utils.interns.tasks.invalidate(),
  });
  const assigned =
    tasks.data?.filter((task) => task.assigneeId === userId) ?? [];
  const counts = {
    ACTIVE: assigned.filter((task) => task.status !== "DONE").length,
    DONE: assigned.filter((task) => task.status === "DONE").length,
    ALL: assigned.length,
  };
  const visible = assigned.filter(
    (task) =>
      (filter === "ALL" ||
        (filter === "DONE"
          ? task.status === "DONE"
          : task.status !== "DONE")) &&
      `${task.title} ${task.description ?? ""}`
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
  );
  return (
    <section className="ip-tasks-section" aria-labelledby="ip-tasks-title">
      <div className="ip-section-heading">
        <div>
          <h2 id="ip-tasks-title">Assigned to you</h2>
          <p>Everything you need to move your work forward.</p>
        </div>
      </div>
      {!canRead ? (
        <Empty title="Task access is not enabled">
          Ask an Arko admin to enable task access on your account.
        </Empty>
      ) : (
        <>
          <div className="ip-task-toolbar">
            <div className="ip-filter-buttons" aria-label="Filter tasks">
              {(["ACTIVE", "DONE", "ALL"] as const).map((value) => (
                <button
                  key={value}
                  aria-pressed={filter === value}
                  onClick={() => setFilter(value)}
                >
                  {value === "ACTIVE"
                    ? "Active tasks"
                    : value === "DONE"
                      ? "Completed"
                      : "All tasks"}
                  <span className="ip-filter-count">
                    {tasks.data ? counts[value] : "—"}
                  </span>
                </button>
              ))}
            </div>
            <label className="ip-search ip-task-search">
              <Search size={16} aria-hidden="true" />
              <span className="ip-sr-only">Search assigned tasks</span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search tasks…"
                type="search"
              />
            </label>
          </div>
          <Feedback error={error} message={message} />
          {tasks.isLoading ? (
            <p role="status">Loading your tasks…</p>
          ) : tasks.error ? (
            <div>
              <p role="alert">{internErrorMessage(tasks.error.message)}</p>
              <button className="ip-button" onClick={() => tasks.refetch()}>
                Try again
              </button>
            </div>
          ) : (
            <div className="ip-task-list">
              <div className="ip-task-list-heading">
                <span>Task</span>
                <span>Status</span>
              </div>
              {visible.map((task) => (
                <article
                  key={task.id}
                  className="ip-task"
                  data-status={task.status}
                >
                  <span className="ip-task-symbol">
                    {task.status === "DONE" ? (
                      <CheckCircle2 size={21} />
                    ) : (
                      <Circle size={21} aria-hidden="true" />
                    )}
                  </span>
                  <div>
                    <h3>{task.title}</h3>
                    {task.description && (
                      <p className="ip-prose">{task.description}</p>
                    )}
                    <div className="ip-task-meta">
                      <span>{task.priority.toLowerCase()} priority</span>
                      <span>
                        <CalendarDays size={14} aria-hidden="true" />
                        Due {displayDate(task.dueDate)}
                      </span>
                    </div>
                  </div>
                  <label className="ip-task-status">
                    <span className="ip-sr-only">Status for {task.title}</span>
                    <select
                      value={task.status}
                      disabled={!canUpdate || update.isPending}
                      onChange={async (e) => {
                        setError("");
                        setMessage("");
                        try {
                          await update.mutateAsync({
                            id: task.id,
                            status: e.target.value as
                              "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE",
                          });
                          setMessage(`Updated “${task.title}”.`);
                        } catch (cause) {
                          setError(
                            cause instanceof Error
                              ? cause.message
                              : "Could not update task.",
                          );
                        }
                      }}
                    >
                      {["TODO", "IN_PROGRESS", "REVIEW", "DONE"].map(
                        (status) => (
                          <option value={status} key={status}>
                            {statusLabel(status)}
                          </option>
                        ),
                      )}
                    </select>
                  </label>
                </article>
              ))}
              {!visible.length && (
                <Empty
                  title={
                    query.trim()
                      ? "No matching tasks"
                      : assigned.length
                        ? "No tasks in this view"
                        : "You’re ready for your first task"
                  }
                >
                  {query.trim()
                    ? "Try another search or clear it to see your tasks."
                    : assigned.length
                      ? "Switch views to see your other assigned tasks."
                      : "Tasks will appear here when an Arko admin assigns work to you."}
                </Empty>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
}

function InternProfile({
  profile,
  hours,
}: {
  profile: Overview["profile"];
  hours: number;
}) {
  const user = api.users.getProfile.useQuery();
  const [fields, setFields] = useState({
    school: profile?.school ?? "",
    course: profile?.course ?? "",
    track: profile?.track ?? "",
    bio: profile?.bio ?? "",
    startDate: profile?.startDate ? dateKey(profile.startDate) : "",
    requiredHours: profile?.requiredHours ? String(profile.requiredHours) : "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const utils = api.useUtils();
  const save = api.interns.saveProfile.useMutation({
    onSuccess: () => utils.interns.overview.invalidate(),
  });
  const required = profile?.requiredHours ?? 0;
  return (
    <section>
      <div className="ip-section-heading">
        <div>
          <h2>Your internship profile</h2>
          <p>
            Your background, learning direction, and internship hours in one
            place.
          </p>
        </div>
      </div>
      <div className="ip-profile-layout">
        <aside className="ip-profile-summary">
          <div className="ip-initials">
            {(user.data?.name ?? "I")
              .split(" ")
              .map((part) => part[0])
              .slice(0, 2)
              .join("")}
          </div>
          <h3>{user.data?.name ?? "Your profile"}</h3>
          <p>{user.data?.email}</p>
          <span className="ip-badge">{profile?.track || "Intern at Arko"}</span>
          <div className="ip-profile-hours">
            <strong>
              {Number(hours.toFixed(2))}
              <small> hours logged</small>
            </strong>
            {required > 0 ? (
              <>
                <progress
                  value={Math.min(hours, required)}
                  max={required}
                  aria-label="Internship hours completed"
                />
                <p>
                  {Math.max(0, Number((required - hours).toFixed(2)))} of{" "}
                  {required} hours remaining
                </p>
              </>
            ) : (
              <p>Add your required hours to track your progress.</p>
            )}
          </div>
          <p className="ip-help">
            Hours come from your daily learning log. They are self-reported, not
            verified attendance.
          </p>
        </aside>
        <form
          className="ip-profile-form"
          onSubmit={async (e) => {
            e.preventDefault();
            setError("");
            try {
              await save.mutateAsync({
                ...fields,
                startDate: fields.startDate || null,
                requiredHours: Number(fields.requiredHours),
              });
              setMessage("Internship profile saved.");
            } catch (cause) {
              setError(
                cause instanceof Error
                  ? cause.message
                  : "Could not save profile.",
              );
            }
          }}
        >
          <div className="ip-form-grid">
            <label>
              School / university
              <input
                maxLength={180}
                value={fields.school}
                onChange={(e) =>
                  setFields({ ...fields, school: e.target.value })
                }
                placeholder="Your school"
              />
            </label>
            <label>
              Course / program
              <input
                maxLength={180}
                value={fields.course}
                onChange={(e) =>
                  setFields({ ...fields, course: e.target.value })
                }
                placeholder="e.g. BS Information Technology"
              />
            </label>
            <label>
              Learning track
              <input
                maxLength={180}
                value={fields.track}
                onChange={(e) =>
                  setFields({ ...fields, track: e.target.value })
                }
                placeholder="e.g. Frontend development"
              />
            </label>
            <label>
              Start date
              <input
                type="date"
                value={fields.startDate}
                onChange={(e) =>
                  setFields({ ...fields, startDate: e.target.value })
                }
              />
            </label>
            <label>
              Required internship hours
              <input
                type="number"
                min="0"
                max="10000"
                step="1"
                value={fields.requiredHours}
                onChange={(e) =>
                  setFields({ ...fields, requiredHours: e.target.value })
                }
                placeholder="e.g. 500"
              />
            </label>
            <label className="ip-wide">
              About you & your goals
              <textarea
                rows={4}
                maxLength={2000}
                value={fields.bio}
                onChange={(e) => setFields({ ...fields, bio: e.target.value })}
                placeholder="What would you like to learn during your internship?"
              />
            </label>
          </div>
          <Feedback error={error} message={message} />
          <div className="ip-actions">
            <button className="ip-button ip-primary" disabled={save.isPending}>
              {save.isPending ? "Saving…" : "Save profile"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

export function InternManagement() {
  const [view, setView] = useState("interns");
  return (
    <div className="intern-portal ip-admin">
      <header className="ip-header">
        <div>
          <div className="ip-kicker">People & learning</div>
          <h1>Intern management</h1>
          <p>
            Support your interns, assign meaningful work, and review their
            progress.
          </p>
        </div>
        <Link className="ip-button" href="/dashboard/users">
          Manage accounts
        </Link>
      </header>
      <nav
        className="ip-tabs"
        aria-label="Intern management"
        role="tablist"
        onKeyDown={(event) => {
          if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key))
            return;
          event.preventDefault();
          const next =
            event.key === "Home"
              ? "interns"
              : event.key === "End"
                ? "activities"
                : view === "interns"
                  ? "activities"
                  : "interns";
          setView(next);
          document.getElementById(`${next}-tab`)?.focus();
        }}
      >
        <button
          id="interns-tab"
          tabIndex={view === "interns" ? 0 : -1}
          role="tab"
          aria-selected={view === "interns"}
          aria-controls="interns-panel"
          onClick={() => setView("interns")}
        >
          Interns
        </button>
        <button
          id="activities-tab"
          tabIndex={view === "activities" ? 0 : -1}
          role="tab"
          aria-selected={view === "activities"}
          aria-controls="activities-panel"
          onClick={() => setView("activities")}
        >
          Activities & reviews
        </button>
      </nav>
      <div
        id="interns-panel"
        role="tabpanel"
        aria-labelledby="interns-tab"
        hidden={view !== "interns"}
      >
        <InternRoster />
      </div>
      <div
        id="activities-panel"
        role="tabpanel"
        aria-labelledby="activities-tab"
        hidden={view !== "activities"}
      >
        <AdminDesk />
      </div>
    </div>
  );
}

function InternLoadError({
  title,
  retry,
}: {
  title: string;
  retry: () => unknown;
}) {
  return (
    <div className="ip-load-error" role="alert">
      <div>
        <h3>{title}</h3>
        <p>
          Please try again. If this continues, contact your system
          administrator.
        </p>
      </div>
      <button className="ip-button" onClick={() => retry()}>
        Try again
      </button>
    </div>
  );
}

function InternRoster() {
  const roster = api.interns.roster.useQuery();
  const [userId, setUserId] = useState("");
  const record = api.interns.internRecord.useQuery(
    { userId },
    { enabled: !!userId },
  );
  const assign = api.tasks.create.useMutation();
  const [message, setMessage] = useState("");
  return (
    <section>
      <div className="ip-section-heading">
        <div>
          <h2>Your interns</h2>
          <p>
            Select an intern to view their learning history and assign work.
          </p>
        </div>
      </div>
      {roster.isLoading ? (
        <p role="status">Loading interns…</p>
      ) : roster.error ? (
        <InternLoadError
          title="We couldn’t load your interns"
          retry={() => roster.refetch()}
        />
      ) : !roster.data?.length ? (
        <Empty title="No intern accounts yet">
          Create an account with the Intern role in Manage accounts.
        </Empty>
      ) : (
        <>
          <div className="ip-table-scroll">
            <table className="ip-roster-table">
              <thead>
                <tr>
                  <th>Intern</th>
                  <th>Learning track</th>
                  <th>Tasks</th>
                  <th>Learning logs</th>
                  <th>
                    <span className="ip-sr-only">View record</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {roster.data.map((user) => (
                  <tr key={user.id} aria-selected={userId === user.id}>
                    <td>
                      <strong>{user.name ?? "Unnamed intern"}</strong>
                      <span>{user.email}</span>
                    </td>
                    <td>
                      {user.internProfile?.track || "Not set yet"}
                      <span>
                        {user.status === "ACTIVE"
                          ? "Active"
                          : "Access restricted"}
                      </span>
                    </td>
                    <td>{user._count.tasks}</td>
                    <td>{user._count.internLearningLogs}</td>
                    <td>
                      <button
                        className="ip-button"
                        aria-label={`View ${user.name ?? user.email}`}
                        aria-expanded={userId === user.id}
                        onClick={() => {
                          setUserId(userId === user.id ? "" : user.id);
                          setMessage("");
                          assign.reset();
                        }}
                      >
                        {userId === user.id ? "Close" : "View intern"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {userId && (
            <>
              <form
                className="ip-editor"
                onSubmit={async (e) => {
                  e.preventDefault();
                  const form = e.currentTarget;
                  const values = new FormData(form);
                  setMessage("");
                  try {
                    await assign.mutateAsync({
                      title: String(values.get("title")),
                      description: String(values.get("description")),
                      dueDate: new Date(`${values.get("dueDate")}T00:00:00Z`),
                      assigneeId: userId,
                    });
                    form.reset();
                    setMessage("Task assigned.");
                    await record.refetch();
                  } catch {
                    /* Show mutation error beside the form. */
                  }
                }}
              >
                <h3>
                  Assign a task to{" "}
                  {roster.data.find((user) => user.id === userId)?.name ??
                    "this intern"}
                </h3>
                <div className="ip-form-grid">
                  <label>
                    Title
                    <input name="title" required />
                  </label>
                  <label>
                    Due date
                    <input name="dueDate" type="date" required />
                  </label>
                  <label className="ip-wide">
                    Instructions
                    <textarea name="description" rows={3} />
                  </label>
                </div>
                <Feedback error={assign.error?.message} message={message} />
                <button
                  className="ip-button ip-primary"
                  disabled={assign.isPending}
                >
                  {assign.isPending ? "Assigning…" : "Assign task"}
                </button>
              </form>
              {record.isLoading ? (
                <p role="status">Loading intern record…</p>
              ) : record.error ? (
                <InternLoadError
                  title="We couldn’t load this intern’s record"
                  retry={() => record.refetch()}
                />
              ) : (
                record.data && (
                  <>
                    <h3 className="ip-subheading">Assigned tasks</h3>
                    <div className="ip-library">
                      {record.data.tasks.map((task) => (
                        <div key={task.id}>
                          <strong>{task.title}</strong>
                          <span>
                            {statusLabel(task.status)} ·{" "}
                            {displayDate(task.dueDate)}
                          </span>
                        </div>
                      ))}
                    </div>
                    <h3 className="ip-subheading">Learning history</h3>
                    {record.data.logs.map((log) => (
                      <details className="ip-review-item" key={log.id}>
                        <summary>
                          {displayDate(log.date)} · {log.hours} hours
                        </summary>
                        <div className="ip-review-body">
                          <p className="ip-prose">{log.learned}</p>
                          <p>{log.workedOn}</p>
                          <p>{log.blockers}</p>
                          <p>{log.feedback}</p>
                        </div>
                      </details>
                    ))}
                    <h3 className="ip-subheading">Submissions</h3>
                    {record.data.submissions.map((item) => (
                      <details className="ip-review-item" key={item.id}>
                        <summary>
                          {item.activity.title} · {statusLabel(item.status)}
                        </summary>
                        <div className="ip-review-body">
                          <p className="ip-prose">{item.response}</p>
                          <p>{item.feedback}</p>
                        </div>
                      </details>
                    ))}
                  </>
                )
              )}
            </>
          )}
        </>
      )}
    </section>
  );
}

function AdminDesk() {
  const queue = api.interns.reviewQueue.useQuery();
  const roster = api.interns.roster.useQuery();
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [editing, setEditing] = useState<
    RouterOutputs["interns"]["reviewQueue"]["activities"][number] | null
  >(null);
  const [showForm, setShowForm] = useState(false);
  const [fields, setFields] = useState({
    title: "",
    kind: "STUDY" as "STUDY" | "EXERCISE",
    description: "",
    resourceUrl: "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const utils = api.useUtils();
  async function refresh() {
    await Promise.all([
      utils.interns.reviewQueue.invalidate(),
      utils.interns.overview.invalidate(),
    ]);
  }
  const create = api.interns.createActivity.useMutation();
  const update = api.interns.updateActivity.useMutation();
  const pending = create.isPending || update.isPending;
  function edit(
    activity?: RouterOutputs["interns"]["reviewQueue"]["activities"][number],
  ) {
    if (showForm && !window.confirm("Discard the activity you are editing?"))
      return;
    setEditing(activity ?? null);
    setAssigneeIds(activity?.assignments.map((item) => item.userId) ?? []);
    setFields(
      activity
        ? {
            title: activity.title,
            kind: activity.kind as "STUDY" | "EXERCISE",
            description: activity.description,
            resourceUrl: activity.resourceUrl,
          }
        : { title: "", kind: "STUDY", description: "", resourceUrl: "" },
    );
    setShowForm(true);
    setError("");
    setMessage("");
  }
  return (
    <section>
      <div className="ip-section-heading">
        <div>
          <h2>Activities & reviews</h2>
          <p>
            Assign studies and exercises, then give feedback on your interns’
            work.
          </p>
        </div>
        {!showForm && (
          <button
            className="ip-button ip-primary"
            disabled={
              showForm ||
              pending ||
              roster.isLoading ||
              !!roster.error ||
              !roster.data?.some((user) => user.status === "ACTIVE")
            }
            onClick={() => edit()}
          >
            <Plus size={16} />
            New activity
          </button>
        )}
      </div>
      <Feedback error={showForm ? undefined : error} message={message} />
      {roster.error && (
        <InternLoadError
          title="Intern assignments are temporarily unavailable"
          retry={() => roster.refetch()}
        />
      )}
      {showForm && (
        <form
          className="ip-editor"
          onSubmit={async (e) => {
            e.preventDefault();
            setError("");
            if (!assigneeIds.length) {
              setError("Select at least one intern before publishing.");
              document.getElementById("activity-assignees")?.focus();
              return;
            }
            try {
              if (editing)
                await update.mutateAsync({
                  ...fields,
                  assigneeIds,
                  id: editing.id,
                  archived: editing.archived,
                });
              else await create.mutateAsync({ ...fields, assigneeIds });
              await refresh();
              setShowForm(false);
              setMessage(
                editing
                  ? "Activity updated."
                  : "Activity published for the selected interns.",
              );
            } catch (cause) {
              setError(
                cause instanceof Error
                  ? cause.message
                  : "Could not publish activity.",
              );
            }
          }}
        >
          <div className="ip-editor-title">
            <h3>{editing ? "Edit activity" : "New activity"}</h3>
            <p>Give your interns a clear goal and choose who it’s for.</p>
          </div>
          <div className="ip-form-grid">
            <label>
              Title
              <input
                required
                maxLength={180}
                value={fields.title}
                onChange={(e) =>
                  setFields({ ...fields, title: e.target.value })
                }
              />
            </label>
            <label>
              Type
              <select
                value={fields.kind}
                onChange={(e) =>
                  setFields({
                    ...fields,
                    kind: e.target.value as "STUDY" | "EXERCISE",
                  })
                }
              >
                <option value="STUDY">Study</option>
                <option value="EXERCISE">Exercise</option>
              </select>
            </label>
            <label className="ip-wide">
              Instructions & expected outcome
              <textarea
                required
                rows={5}
                maxLength={12000}
                value={fields.description}
                onChange={(e) =>
                  setFields({ ...fields, description: e.target.value })
                }
              />
            </label>
            <label className="ip-wide">
              Resource link <span>Optional · http or https</span>
              <input
                type="url"
                value={fields.resourceUrl}
                onChange={(e) =>
                  setFields({ ...fields, resourceUrl: e.target.value })
                }
              />
            </label>
          </div>
          <fieldset
            className="ip-assignees"
            id="activity-assignees"
            tabIndex={-1}
          >
            <legend>
              Assign to interns <span>{assigneeIds.length} selected</span>
            </legend>
            <p>Only selected interns can view and submit this activity.</p>
            <div className="ip-assignee-list">
              {roster.data
                ?.filter(
                  (user) =>
                    user.status === "ACTIVE" || assigneeIds.includes(user.id),
                )
                .map((user) => (
                  <label className="ip-assignee" key={user.id}>
                    <input
                      type="checkbox"
                      checked={assigneeIds.includes(user.id)}
                      onChange={(event) => {
                        setError("");
                        setAssigneeIds((ids) =>
                          event.target.checked
                            ? [...ids, user.id]
                            : ids.filter((id) => id !== user.id),
                        );
                      }}
                    />
                    <span>
                      <strong>{user.name ?? user.email}</strong>
                      <small>{user.email}</small>
                    </span>
                  </label>
                ))}
            </div>
            {!roster.data?.length && (
              <p>No interns available. Create an intern account first.</p>
            )}
          </fieldset>
          <Feedback error={error} />
          <div className="ip-actions">
            <button
              className="ip-button"
              type="button"
              disabled={pending}
              onClick={() => setShowForm(false)}
            >
              Cancel
            </button>
            <button className="ip-button ip-primary" disabled={pending}>
              {pending
                ? "Saving…"
                : editing
                  ? "Save changes"
                  : "Publish activity"}
            </button>
          </div>
        </form>
      )}
      {queue.isLoading ? (
        <p role="status">Loading the admin desk…</p>
      ) : queue.error ? (
        <div>
          <InternLoadError
            title="We couldn’t load activities and reviews"
            retry={() => queue.refetch()}
          />
        </div>
      ) : (
        queue.data && (
          <>
            <h3 className="ip-subheading">
              Review queue{" "}
              <span>
                {queue.data.logs.length + queue.data.submissions.length}
              </span>
            </h3>
            {!queue.data.logs.length && !queue.data.submissions.length && (
              <Empty title="All caught up">
                New learning logs and submitted activities will appear here for
                your review.
              </Empty>
            )}
            {queue.data.logs.map((log) => (
              <ReviewItem
                key={log.id}
                id={log.id}
                kind="LOG"
                updatedAt={log.updatedAt}
                title={`${log.user.name ?? log.user.email} · ${displayDate(log.date)}`}
                content={`Learning: ${log.learned}\n\nWorked on: ${log.workedOn || "—"}\n\nBlockers: ${log.blockers || "—"}\n\nHours: ${log.hours}`}
                onReviewed={refresh}
              />
            ))}
            {queue.data.submissions.map((item) => (
              <ReviewItem
                key={item.id}
                id={item.id}
                kind="SUBMISSION"
                updatedAt={item.updatedAt}
                title={`${item.user.name ?? item.user.email} · ${item.activity.title}`}
                content={item.response}
                onReviewed={refresh}
              />
            ))}
            <h3 className="ip-subheading">
              Learning library <span>{queue.data.activities.length}</span>
            </h3>
            {!queue.data.activities.length && (
              <Empty title="No activities yet">
                Create a study or exercise and assign it to the interns who need
                it.
              </Empty>
            )}
            <div className="ip-library">
              {queue.data.activities.map((activity) => (
                <div key={activity.id}>
                  <span>
                    <strong>{activity.title}</strong>
                    <small>
                      {activity.kind === "STUDY" ? "Study" : "Exercise"} ·{" "}
                      {activity.archived ? "Archived" : "Published"}
                    </small>
                  </span>
                  <button
                    className="ip-button"
                    disabled={pending}
                    onClick={() => edit(activity)}
                  >
                    <Pencil size={14} />
                    Edit
                  </button>
                  <button
                    className="ip-text-button"
                    disabled={pending}
                    onClick={async () => {
                      setError("");
                      try {
                        await update.mutateAsync({
                          id: activity.id,
                          assigneeIds: activity.assignments.map(
                            (item) => item.userId,
                          ),
                          title: activity.title,
                          kind: activity.kind as "STUDY" | "EXERCISE",
                          description: activity.description,
                          resourceUrl: activity.resourceUrl,
                          archived: !activity.archived,
                        });
                        await refresh();
                        setMessage(
                          activity.archived
                            ? "Activity restored."
                            : "Activity archived. Existing submissions are retained.",
                        );
                      } catch (cause) {
                        setError(
                          cause instanceof Error
                            ? cause.message
                            : "Could not update activity.",
                        );
                      }
                    }}
                  >
                    {activity.archived ? "Restore" : "Archive"}
                  </button>
                </div>
              ))}
            </div>
          </>
        )
      )}
    </section>
  );
}

function ReviewItem({
  id,
  kind,
  updatedAt,
  title,
  content,
  onReviewed,
}: {
  id: string;
  kind: "LOG" | "SUBMISSION";
  updatedAt: Date;
  title: string;
  content: string;
  onReviewed: () => Promise<void>;
}) {
  const [feedback, setFeedback] = useState("");
  const [status, setStatus] = useState<"COMPLETED" | "CHANGES_REQUESTED">(
    "COMPLETED",
  );
  const review = api.interns.review.useMutation();
  return (
    <details className="ip-review-item">
      <summary>
        <span className="ip-activity-kind">
          {kind === "LOG" ? "Daily log" : "Submission"}
        </span>
        <strong>{title}</strong>
        <span>Review</span>
      </summary>
      <div className="ip-review-body">
        <p className="ip-prose">{content}</p>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              await review.mutateAsync({
                id,
                kind,
                updatedAt,
                feedback,
                status,
              });
              await onReviewed();
            } catch {
              /* The mutation error remains beside the form for retry. */
            }
          }}
        >
          <label>
            Your feedback
            <textarea
              required
              maxLength={6000}
              rows={3}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
            />
          </label>
          {kind === "SUBMISSION" && (
            <label>
              Review outcome
              <select
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as "COMPLETED" | "CHANGES_REQUESTED")
                }
              >
                <option value="COMPLETED">Complete activity</option>
                <option value="CHANGES_REQUESTED">Request changes</option>
              </select>
            </label>
          )}
          <Feedback error={review.error?.message} />
          <div className="ip-actions">
            <button
              className="ip-button ip-primary"
              disabled={review.isPending}
            >
              <Check size={16} />
              {review.isPending ? "Saving review…" : "Save review"}
            </button>
          </div>
        </form>
      </div>
    </details>
  );
}
