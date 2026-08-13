"use client";

import { Card, CardContent } from "@arko/ui";
import {
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  Eye,
  Lightbulb,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import { PerformanceChart } from "./performance-chart";

const metrics = [
  {
    label: "Monthly revenue",
    value: "₱248K",
    detail: "+18.4%",
    context: "vs last month",
    icon: TrendingUp,
    points: [22, 34, 30, 48, 44, 66, 82],
  },
  {
    label: "Active projects",
    value: "07",
    detail: "+3",
    context: "launching soon",
    icon: CheckCircle2,
    points: [20, 28, 38, 35, 51, 58, 70],
  },
  {
    label: "Team capacity",
    value: "82%",
    detail: "Healthy",
    context: "across 4 teams",
    icon: Users,
    points: [46, 52, 58, 68, 64, 76, 74],
  },
  {
    label: "Landing views",
    value: "12.8K",
    detail: "+24.1%",
    context: "this week",
    icon: Eye,
    points: [18, 25, 21, 39, 50, 61, 86],
  },
];

const projects = [
  {
    name: "AI support agent",
    stage: "QA testing",
    progress: 88,
    due: "Aug 16",
  },
  {
    name: "Mobile commerce",
    stage: "Design review",
    progress: 72,
    due: "Aug 22",
  },
  { name: "Operations hub", stage: "Development", progress: 54, due: "Sep 04" },
  { name: "Growth website", stage: "Content", progress: 40, due: "Sep 12" },
];

function MiniTrend({ points }: { points: number[] }) {
  const coordinates = points
    .map(
      (point, index) => `${(index / (points.length - 1)) * 100},${100 - point}`,
    )
    .join(" ");

  return (
    <svg
      viewBox="0 0 100 100"
      aria-hidden="true"
      className="h-10 w-20 overflow-visible"
    >
      <polyline
        points={coordinates}
        fill="none"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

export function DemoDashboard() {
  return (
    <div
      className="mx-auto w-full max-w-[1500px] space-y-4 pb-28"
      data-demo-tour="overview"
    >
      <section className="relative overflow-hidden rounded-3xl border border-border-subtle bg-card px-5 py-6 md:px-8 md:py-7">
        <div className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full bg-primary-500/15 blur-3xl" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary-500/25 bg-primary-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-primary-400">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary-400" />
                Live product demo
              </span>
              <span className="rounded-full border border-border-subtle px-3 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-text-tertiary">
                Fictional data · Read only
              </span>
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-tertiary">
              Executive overview
            </p>
            <h1 className="mt-2 max-w-xl text-3xl font-semibold tracking-tight md:text-4xl">
              One clear view of the business.
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-text-secondary md:text-base">
              ARKO brings delivery, revenue, capacity, and customer signals into
              one focused workspace.
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-border-subtle bg-bg-app/70 px-4 py-3 backdrop-blur-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500/15 text-primary-400">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-text-tertiary">NEX workspace pulse</p>
              <p className="text-sm font-semibold">Everything is on track</p>
            </div>
          </div>
        </div>
      </section>

      <section
        className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
        data-demo-tour="metrics"
      >
        {metrics.map(
          ({ label, value, detail, context, icon: Icon, points }) => (
            <Card
              key={label}
              className="dashboard-panel group overflow-hidden transition-transform duration-200 hover:-translate-y-0.5"
            >
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-text-tertiary">
                    {label}
                  </span>
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary-500/10 text-primary-400">
                    <Icon className="h-4 w-4" />
                  </span>
                </div>
                <div className="mt-5 flex items-end justify-between gap-3">
                  <div>
                    <p className="text-3xl font-semibold tracking-tight">
                      {value}
                    </p>
                    <p className="mt-1 text-xs">
                      <span className="font-semibold text-primary-400">
                        {detail}
                      </span>{" "}
                      <span className="text-text-tertiary">{context}</span>
                    </p>
                  </div>
                  <span className="text-primary-400/75 transition-colors group-hover:text-primary-400">
                    <MiniTrend points={points} />
                  </span>
                </div>
              </CardContent>
            </Card>
          ),
        )}
      </section>

      <section
        className="grid gap-4 xl:grid-cols-[1.55fr_1fr]"
        data-demo-tour="insights"
      >
        <Card className="dashboard-panel min-h-[370px] overflow-hidden">
          <CardContent className="p-0">
            <div className="flex flex-col gap-3 border-b border-border-subtle p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-base font-semibold">Revenue momentum</p>
                <p className="mt-1 text-xs text-text-tertiary">
                  Income and operating cost · last 6 months
                </p>
              </div>
              <div className="flex gap-2">
                <span className="rounded-full bg-primary-500/10 px-3 py-1 text-[10px] font-semibold text-primary-400">
                  Income ₱248K
                </span>
                <span className="rounded-full bg-card px-3 py-1 text-[10px] font-semibold text-text-secondary">
                  Cost ₱126K
                </span>
              </div>
            </div>
            <div className="h-[265px] px-3 pb-3 pt-5 md:px-5">
              <PerformanceChart
                incomeData={[92, 118, 142, 166, 205, 248]}
                expenseData={[60, 72, 81, 96, 110, 126]}
                labels={["Mar", "Apr", "May", "Jun", "Jul", "Aug"]}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="dashboard-panel" data-demo-tour="projects">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-base font-semibold">Project pipeline</p>
                <p className="mt-1 text-xs text-text-tertiary">
                  4 priorities in motion
                </p>
              </div>
              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-border-subtle text-text-tertiary">
                <ArrowUpRight className="h-4 w-4" />
              </span>
            </div>
            <div className="mt-5 space-y-4">
              {projects.map(({ name, stage, progress, due }) => (
                <div key={name}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">{name}</p>
                      <p className="mt-0.5 text-[11px] text-text-tertiary">
                        {stage} · Due {due}
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-primary-400">
                      {progress}%
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-border-subtle">
                    <div
                      className="h-full rounded-full bg-primary-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <section
        className="grid gap-4 lg:grid-cols-[1.25fr_1fr]"
        data-demo-tour="nex"
      >
        <Card className="dashboard-panel overflow-hidden border-primary-500/25">
          <CardContent className="relative p-6">
            <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-primary-500/10 blur-3xl" />
            <div className="relative flex items-start gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary-500 text-white shadow-lg shadow-primary-500/20">
                <Sparkles className="h-5 w-5" />
              </span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary-400">
                  NEX executive briefing
                </p>
                <h2 className="mt-2 text-xl font-semibold">
                  Your strongest growth window is now.
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-text-secondary">
                  Revenue is outpacing operating cost while delivery capacity
                  remains healthy. Prioritize the AI support launch before
                  adding new work.
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {[
                    "Review launch readiness",
                    "Protect 18% capacity",
                    "Follow up on 3 leads",
                  ].map((action) => (
                    <span
                      key={action}
                      className="rounded-full border border-border-subtle bg-bg-app/60 px-3 py-1.5 text-xs text-text-secondary"
                    >
                      {action}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="dashboard-panel">
          <CardContent className="grid h-full grid-cols-2 gap-3 p-5">
            <div className="rounded-2xl bg-primary-500/10 p-4">
              <Clock3 className="h-4 w-4 text-primary-400" />
              <p className="mt-5 text-2xl font-semibold">9.4h</p>
              <p className="mt-1 text-xs text-text-tertiary">saved this week</p>
            </div>
            <div className="rounded-2xl bg-card p-4">
              <Lightbulb className="h-4 w-4 text-primary-400" />
              <p className="mt-5 text-2xl font-semibold">03</p>
              <p className="mt-1 text-xs text-text-tertiary">
                NEX recommendations
              </p>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
