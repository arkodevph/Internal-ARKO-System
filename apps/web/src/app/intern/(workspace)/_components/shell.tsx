"use client";

import { DashboardShell } from "../../../dashboard/_components/dashboard-shell";
import s from "./intern.module.css";

export function InternShell({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell surface="intern">
      <div className={s.content}>{children}</div>
    </DashboardShell>
  );
}
