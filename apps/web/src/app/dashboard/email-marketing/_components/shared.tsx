import type { ReactNode } from "react";
import { Card, CardContent } from "@arko/ui";

export const fieldClass =
  "w-full rounded-lg border border-border-subtle bg-card px-3 py-2 text-sm text-text-primary outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20";

export const labelClass =
  "mb-1.5 block text-xs font-medium text-text-secondary";

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className={labelClass}>{label}</span>
      {children}
    </label>
  );
}

export function StatCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string | number;
  detail?: string;
}) {
  return (
    <Card className="hover:translate-y-0">
      <CardContent className="p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-tertiary">
          {label}
        </p>
        <p className="mt-2 text-2xl font-bold tabular-nums text-text-primary">
          {value}
        </p>
        {detail && <p className="mt-1 text-xs text-text-tertiary">{detail}</p>}
      </CardContent>
    </Card>
  );
}

export function EmptyState({
  title,
  detail,
}: {
  title: string;
  detail: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-border-subtle px-5 py-10 text-center">
      <p className="text-sm font-medium text-text-primary">{title}</p>
      <p className="mt-1 text-xs text-text-tertiary">{detail}</p>
    </div>
  );
}

export function StatusBadge({ value }: { value: string }) {
  const tone =
    value.includes("FAIL") ||
    value.includes("BOUNCE") ||
    value.includes("COMPLAIN")
      ? "bg-red-500/10 text-red-500"
      : value.includes("SENT") ||
          value.includes("DELIVER") ||
          value.includes("ACTIVE") ||
          value.includes("SUBSCRIBED")
        ? "bg-emerald-500/10 text-emerald-500"
        : value.includes("SCHEDULE") ||
            value.includes("RUNNING") ||
            value.includes("OPEN")
          ? "bg-amber-500/10 text-amber-500"
          : "bg-card text-text-tertiary";
  return (
    <span
      className={`rounded-full px-2 py-1 text-[10px] font-semibold ${tone}`}
    >
      {value.replaceAll("_", " ")}
    </span>
  );
}

export function formatDate(value: Date | string | null | undefined) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Manila",
  }).format(new Date(value));
}
