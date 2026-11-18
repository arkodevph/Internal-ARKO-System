"use client";

import { ArrowLeft, ArrowRight, Inbox, Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import s from "./intern.module.css";

export const statusLabels: Record<string, string> = {
  TODO: "To do",
  IN_PROGRESS: "In progress",
  REVIEW: "In review",
  DONE: "Completed",
};
export function Status({ status }: { status: string }) {
  return (
    <span className={s.status} data-status={status}>
      {statusLabels[status] || status}
    </span>
  );
}
export function PageHeading({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <header className={s.heading}>
      <h1>{title}</h1>
      <p>{children}</p>
    </header>
  );
}
export function Empty({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className={s.empty}>
      <Inbox size={28} aria-hidden="true" />
      <h3>{title}</h3>
      <p>{children}</p>
    </div>
  );
}
export function QueryState({
  loading,
  error,
  retry,
}: {
  loading: boolean;
  error: { message: string } | null;
  retry: () => unknown;
}) {
  if (error)
    return (
      <div className={s.error} role="alert">
        <p>We couldn’t load this view. Check your connection and try again.</p>
        <button type="button" onClick={() => retry()} className={s.button}>
          Try again
        </button>
      </div>
    );
  if (loading)
    return (
      <div className={s.loading} role="status">
        <Loader2 size={20} className={s.spin} /> Loading your workspace…
      </div>
    );
  return null;
}
export function Pagination({
  page,
  pages,
  onChange,
}: {
  page: number;
  pages: number;
  onChange: (page: number) => void;
}) {
  if (pages <= 1) return null;
  return (
    <nav className={s.pagination} aria-label="Pagination">
      <button
        type="button"
        className={s.button}
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
      >
        <ArrowLeft size={16} /> Previous
      </button>
      <span>
        Page {page} of {pages}
      </span>
      <button
        type="button"
        className={s.button}
        disabled={page >= pages}
        onClick={() => onChange(page + 1)}
      >
        Next <ArrowRight size={16} />
      </button>
    </nav>
  );
}
export function dateLabel(value: Date | string) {
  return new Date(value).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
export function safeWebUrl(value: string | null | undefined) {
  try {
    const url = new URL(value || "");
    return ["https:", "http:"].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

export function LinkedText({ value }: { value: string }) {
  return (
    <>
      {value.split(/(https?:\/\/[^\s<>]+)/g).map((part, index) => {
        const url = /^https?:\/\//.test(part) ? safeWebUrl(part) : null;
        return url ? (
          <a key={index} href={url} target="_blank" rel="noopener noreferrer">
            {part}
          </a>
        ) : (
          <span key={index}>{part}</span>
        );
      })}
    </>
  );
}
