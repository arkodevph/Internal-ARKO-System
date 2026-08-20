"use client";

import {
  ArrowUpRight,
  Bell,
  Bookmark,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  Circle,
  Clock3,
  FileText,
  Folder,
  Lightbulb,
  Link2,
  MessageSquare,
  MoreHorizontal,
  Paperclip,
  Plus,
  Search,
  Send,
  Sparkles,
  Star,
  TrendingDown,
  TrendingUp,
  Users,
  WalletCards,
  X,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useState, type MouseEvent as ReactMouseEvent } from "react";
import { DemoDashboard } from "./demo-dashboard";
import { PerformanceChart } from "./performance-chart";

const pill =
  "rounded-full border border-border-subtle bg-card px-3 py-1.5 text-xs text-text-secondary";
const panel = "rounded-3xl border border-border-subtle bg-card";

function DemoHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action: string;
}) {
  return (
    <header
      className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between"
      data-demo-tour="overview"
    >
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary-400">
          {eyebrow}
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
          {title}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-text-secondary">
          {description}
        </p>
      </div>
      <button
        data-demo-action={action}
        className="flex min-h-11 items-center justify-center gap-2 rounded-full bg-primary-500 px-5 text-xs font-bold text-white shadow-lg shadow-primary-500/20 transition-transform hover:scale-[1.02] active:scale-[.98]"
      >
        <Plus className="h-4 w-4" />
        {action}
      </button>
    </header>
  );
}

function DemoNotice() {
  return (
    <div className="flex items-center gap-2 rounded-full border border-primary-500/20 bg-primary-500/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-primary-400">
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary-400" />
      Interactive sample · read only
    </div>
  );
}

function FinanceDemo() {
  return (
    <DemoFrame>
      <DemoHeader
        eyebrow="Financial intelligence"
        title="Money, without the mystery."
        description="A live view of runway, cash movement, and the decisions that shape margin."
        action="Add transaction"
      />
      <div
        className="grid gap-4 xl:grid-cols-[1.45fr_.85fr]"
        data-demo-tour="metrics"
      >
        <section className={`${panel} overflow-hidden p-6`}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-text-tertiary">Available balance</p>
              <p className="mt-2 text-4xl font-semibold tabular-nums">
                ₱1,248,920
              </p>
              <p className="mt-2 text-xs font-medium text-primary-400">
                ↑ 18.4% from last month
              </p>
            </div>
            <span className="rounded-2xl bg-primary-500/10 p-3 text-primary-400">
              <WalletCards className="h-5 w-5" />
            </span>
          </div>
          <div className="mt-8 h-60">
            <PerformanceChart
              incomeData={[92, 118, 142, 166, 205, 248]}
              expenseData={[60, 72, 81, 96, 110, 126]}
              labels={["Mar", "Apr", "May", "Jun", "Jul", "Aug"]}
            />
          </div>
        </section>
        <div className="grid gap-4">
          <section className="relative overflow-hidden rounded-3xl bg-primary-500 p-6 text-white">
            <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full border-[28px] border-white/10" />
            <p className="text-xs text-white/70">Projected runway</p>
            <p className="mt-4 text-5xl font-semibold">14.6</p>
            <p className="mt-1 text-sm">months at current spend</p>
            <div className="mt-8 flex justify-between border-t border-white/20 pt-4 text-xs">
              <span>Burn ₱126K</span>
              <span>Goal 18 mo</span>
            </div>
          </section>
          <section className={`${panel} p-5`} data-demo-tour="nex">
            <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.16em] text-primary-400">
              <Sparkles className="h-4 w-4" />
              NEX forecast
            </p>
            <p className="mt-3 text-sm leading-6 text-text-secondary">
              Revenue is climbing faster than cost. Hold hiring for 30 days and
              runway improves by 1.8 months.
            </p>
          </section>
        </div>
      </div>
      <section className={`${panel} overflow-hidden`} data-demo-tour="insights">
        <div className="flex items-center justify-between border-b border-border-subtle p-5">
          <div>
            <h2 className="font-semibold">Cash movement</h2>
            <p className="text-xs text-text-tertiary">August 2026</p>
          </div>
          <div className="flex gap-2">
            <button
              data-demo-action="Account filter changed"
              className={`${pill} min-h-11`}
            >
              All accounts
            </button>
            <button
              data-demo-action="Date range changed"
              className={`${pill} min-h-11`}
            >
              This month
            </button>
          </div>
        </div>
        {[
          ["Mobile commerce milestone", "Project income", "+₱96,000", true],
          ["Cloud infrastructure", "Software", "−₱18,420", false],
          ["Operations dashboard", "Project income", "+₱84,000", true],
          ["Design subscriptions", "Software", "−₱7,800", false],
        ].map(([name, type, amount, positive]) => (
          <button
            key={String(name)}
            data-demo-title={String(name)}
            data-demo-detail={`${type} transaction · ${amount} · August 2026`}
            className="grid w-full grid-cols-[1fr_auto] items-center border-b border-border-subtle/70 px-5 py-4 text-left transition-colors last:border-0 hover:bg-primary-500/5 md:grid-cols-[1fr_1fr_auto]"
          >
            <div className="flex items-center gap-3">
              <span
                className={`rounded-xl p-2.5 ${positive ? "bg-primary-500/10 text-primary-400" : "bg-neg-bg text-neg"}`}
              >
                {positive ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
              </span>
              <span className="text-sm font-medium">{name}</span>
            </div>
            <span className="hidden text-sm text-text-tertiary md:block">
              {type}
            </span>
            <span
              className={`text-sm font-semibold tabular-nums ${positive ? "text-primary-400" : "text-text-primary"}`}
            >
              {amount}
            </span>
          </button>
        ))}
      </section>
    </DemoFrame>
  );
}

const kanban = [
  {
    title: "TO DO",
    count: 4,
    cards: [
      ["Approve onboarding flow", "HIGH", "Mobile commerce", "Mika"],
      ["Prepare launch analytics", "MEDIUM", "Growth website", "Paolo"],
    ],
  },
  {
    title: "IN PROGRESS",
    count: 3,
    cards: [
      ["Connect support knowledge", "HIGH", "AI support", "Justine"],
      ["Build finance export", "LOW", "Operations hub", "Andrea"],
    ],
  },
  {
    title: "IN REVIEW",
    count: 2,
    cards: [
      ["Review access controls", "HIGH", "Operations hub", "Mika"],
      ["Homepage motion pass", "MEDIUM", "Growth website", "Paolo"],
    ],
  },
  {
    title: "DONE",
    count: 18,
    cards: [
      ["Map client journey", "DONE", "Mobile commerce", "Team"],
      ["Define AI guardrails", "DONE", "AI support", "Team"],
    ],
  },
];
function TasksDemo() {
  return (
    <DemoFrame>
      <DemoHeader
        eyebrow="Delivery cockpit"
        title="Work moves here."
        description="A tactile board for priorities, ownership, and momentum - built for fast weekly standups."
        action="Create task"
      />
      <div className="flex flex-wrap items-center gap-2">
        <span className={pill}>Board</span>
        <span className={pill}>Timeline</span>
        <span className={pill}>My tasks</span>
        <span className="ml-auto text-xs text-text-tertiary">
          24 open · 86% on time
        </span>
      </div>
      <div className="grid gap-3 xl:grid-cols-4" data-demo-tour="metrics">
        {kanban.map((column, i) => (
          <section
            key={column.title}
            className="rounded-3xl bg-bg-sidebar/60 p-3"
          >
            <div className="mb-3 flex items-center gap-2 px-1">
              <span
                className={`h-2 w-2 rounded-full ${i === 3 ? "bg-primary-400" : "bg-text-tertiary"}`}
              />
              <h2 className="text-[11px] font-bold tracking-[.12em]">
                {column.title}
              </h2>
              <span className="ml-auto text-xs text-text-tertiary">
                {column.count}
              </span>
            </div>
            <div className="space-y-3">
              {column.cards.map((card) => (
                <article
                  key={card[0]}
                  data-demo-title={card[0]}
                  data-demo-detail={`${card[1]} priority · ${card[2]} · Assigned to ${card[3]}`}
                  className={`${panel} group cursor-pointer p-4 transition-transform hover:-translate-y-1 hover:border-primary-500/40`}
                >
                  <div className="flex justify-between">
                    <span
                      className={`text-[9px] font-bold tracking-wider ${card[1] === "HIGH" ? "text-neg" : "text-primary-400"}`}
                    >
                      {card[1]}
                    </span>
                    <MoreHorizontal className="h-4 w-4 text-text-tertiary" />
                  </div>
                  <h3 className="mt-4 text-sm font-semibold leading-5">
                    {card[0]}
                  </h3>
                  <p className="mt-2 text-xs text-text-tertiary">{card[2]}</p>
                  <div className="mt-5 flex items-center justify-between border-t border-border-subtle pt-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-500/15 text-[9px] font-bold text-primary-400">
                      {card[3].slice(0, 1)}
                    </span>
                    <div className="flex gap-3 text-text-tertiary">
                      <span className="flex items-center gap-1 text-[10px]">
                        <MessageSquare className="h-3 w-3" />3
                      </span>
                      <Paperclip className="h-3 w-3" />
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
      <NexStrip text="Two launch-critical cards are waiting in review. Clear those before pulling more work into progress." />
    </DemoFrame>
  );
}

const week = [
  {
    day: "MON",
    date: "11",
    events: [
      ["09:00", "Team sync"],
      ["14:00", "Research block"],
    ],
  },
  {
    day: "TUE",
    date: "12",
    events: [
      ["10:30", "Client kickoff"],
      ["15:00", "Design crit"],
    ],
  },
  {
    day: "WED",
    date: "13",
    events: [
      ["09:00", "Focus time"],
      ["13:30", "AI review"],
    ],
  },
  {
    day: "THU",
    date: "14",
    events: [
      ["10:00", "Commerce review"],
      ["14:30", "Launch check"],
    ],
  },
  {
    day: "FRI",
    date: "15",
    events: [
      ["11:00", "Client progress"],
      ["16:00", "Weekly retro"],
    ],
  },
];
function CalendarDemo() {
  return (
    <DemoFrame>
      <DemoHeader
        eyebrow="Team rhythm"
        title="August 11–15"
        description="A calm weekly planner that protects focus while keeping every milestone visible."
        action="New event"
      />
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <span className={pill}>Week</span>
          <span className={pill}>Today</span>
        </div>
        <div className="flex -space-x-2">
          {["J", "M", "P", "A"].map((x) => (
            <span
              key={x}
              className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-bg-app bg-primary-500 text-[10px] font-bold text-white"
            >
              {x}
            </span>
          ))}
        </div>
      </div>
      <section className={`${panel} overflow-hidden`} data-demo-tour="metrics">
        <div className="grid min-w-[720px] grid-cols-5 overflow-x-auto">
          {week.map((day, index) => (
            <div
              key={day.day}
              className="min-h-[500px] border-r border-border-subtle p-3 last:border-0"
            >
              <div
                className={`rounded-2xl p-3 text-center ${index === 3 ? "bg-primary-500 text-white" : ""}`}
              >
                <p className="text-[10px] font-bold tracking-widest opacity-70">
                  {day.day}
                </p>
                <p className="mt-1 text-2xl font-semibold">{day.date}</p>
              </div>
              <div className="mt-8 space-y-5">
                {day.events.map(([time, event], j) => (
                  <article
                    key={event}
                    data-demo-title={event}
                    data-demo-detail={`${day.day}, August ${day.date} at ${time} · 45 minute event`}
                    className={`rounded-2xl border p-3 ${index === 3 && j === 1 ? "border-primary-500 bg-primary-500/10" : "border-border-subtle bg-bg-sidebar/50"}`}
                  >
                    <p className="text-[10px] text-text-tertiary">{time}</p>
                    <p className="mt-2 text-sm font-semibold">{event}</p>
                    <div className="mt-4 flex items-center gap-1 text-[10px] text-text-tertiary">
                      <Clock3 className="h-3 w-3" />
                      45 min
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
      <NexStrip text="Thursday is meeting-heavy. Keep 3:30–5:00 PM protected so the launch team can finish uninterrupted." />
    </DemoFrame>
  );
}

const chats = [
  ["Northstar Labs", "The revised direction looks great.", "8m", "2"],
  ["AI support team", "QA is ready for final review.", "22m", ""],
  ["Mobile commerce", "Uploaded the new prototype.", "1h", ""],
  ["ARKO team", "Planning notes are available.", "1d", ""],
];
function MessagesDemo() {
  return (
    <DemoFrame>
      <DemoHeader
        eyebrow="Conversations in context"
        title="Messages"
        description="A focused three-pane workspace inspired by modern team communication tools."
        action="New message"
      />
      <section
        className={`${panel} grid min-h-[610px] overflow-hidden lg:grid-cols-[280px_1fr_240px]`}
        data-demo-tour="metrics"
      >
        <aside className="border-r border-border-subtle">
          <div className="p-4">
            <div className="flex items-center gap-2 rounded-full bg-bg-sidebar px-3 py-2 text-xs text-text-tertiary">
              <Search className="h-4 w-4" />
              Search conversations
            </div>
          </div>
          {chats.map((c, i) => (
            <button
              key={c[0]}
              data-demo-title={c[0]}
              data-demo-detail={`Conversation preview · ${c[1]}`}
              className={`flex w-full gap-3 border-t border-border-subtle p-4 text-left transition-colors hover:bg-primary-500/5 ${i === 0 ? "bg-primary-500/10" : ""}`}
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-500 text-xs font-bold text-white">
                {c[0].slice(0, 1)}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex justify-between">
                  <p className="truncate text-sm font-semibold">{c[0]}</p>
                  <span className="text-[10px] text-text-tertiary">{c[2]}</span>
                </div>
                <p className="mt-1 truncate text-xs text-text-tertiary">
                  {c[1]}
                </p>
              </div>
              {c[3] && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-500 text-[9px] font-bold text-white">
                  {c[3]}
                </span>
              )}
            </button>
          ))}
        </aside>
        <main className="flex min-h-[540px] flex-col">
          <div className="flex items-center justify-between border-b border-border-subtle p-4">
            <div>
              <p className="font-semibold">Northstar Labs</p>
              <p className="text-xs text-primary-400">3 members online</p>
            </div>
            <MoreHorizontal className="h-5 w-5 text-text-tertiary" />
          </div>
          <div className="flex-1 space-y-5 p-5">
            <div className="max-w-[78%] rounded-3xl rounded-tl-md bg-bg-sidebar p-4 text-sm leading-6 text-text-secondary">
              We reviewed the new direction with the team. The clearer delivery
              timeline makes this much easier to approve.
            </div>
            <div className="ml-auto max-w-[78%] rounded-3xl rounded-tr-md bg-primary-500 p-4 text-sm leading-6 text-white">
              Great. I’ve attached the revised milestone plan and highlighted
              what ships in the first release.
            </div>
            <div className="max-w-[78%] rounded-3xl rounded-tl-md bg-bg-sidebar p-4 text-sm leading-6 text-text-secondary">
              The revised direction looks great. Let’s proceed with the kickoff.
            </div>
          </div>
          <div className="m-4 flex items-center gap-3 rounded-2xl border border-border-subtle p-3">
            <Paperclip className="h-4 w-4 text-text-tertiary" />
            <span className="flex-1 text-sm text-text-tertiary">
              Write a reply…
            </span>
            <button
              data-demo-action="Message sent"
              className="flex min-h-11 min-w-11 items-center justify-center rounded-xl bg-primary-500 p-2 text-white"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </main>
        <aside className="hidden border-l border-border-subtle p-5 lg:block">
          <p className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary">
            Client context
          </p>
          <div className="mt-6 text-center">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-500 text-xl font-bold text-white">
              N
            </span>
            <p className="mt-3 font-semibold">Northstar Labs</p>
            <p className="text-xs text-text-tertiary">Active client</p>
          </div>
          <div className="mt-8 space-y-3 text-xs">
            <p className="flex justify-between">
              <span className="text-text-tertiary">Project</span>
              <span>Commerce app</span>
            </p>
            <p className="flex justify-between">
              <span className="text-text-tertiary">Health</span>
              <span className="text-primary-400">On track</span>
            </p>
            <p className="flex justify-between">
              <span className="text-text-tertiary">Files</span>
              <span>12 shared</span>
            </p>
          </div>
        </aside>
      </section>
    </DemoFrame>
  );
}

function AssistantDemo() {
  const prompts = [
    "What needs attention today?",
    "Summarize launch readiness",
    "Where can we protect margin?",
    "Prepare a client update",
  ];
  return (
    <DemoFrame>
      <div
        className="mx-auto flex min-h-[690px] max-w-4xl flex-col items-center justify-center text-center"
        data-demo-tour="overview"
      >
        <div className="relative">
          <div className="absolute inset-0 scale-[2] rounded-full bg-primary-500/15 blur-3xl" />
          <span className="relative flex h-20 w-20 items-center justify-center rounded-[1.75rem] border border-primary-500/30 bg-primary-500/10 text-primary-400">
            <Sparkles className="h-9 w-9" />
          </span>
        </div>
        <p className="mt-8 text-[10px] font-bold uppercase tracking-[.22em] text-primary-400">
          NEX workspace intelligence
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-6xl">
          What can I help you
          <br />
          move forward?
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-6 text-text-secondary">
          Ask across projects, finance, tasks, and team activity. This demo uses
          sample responses and never accesses real workspace data.
        </p>
        <div
          className="mt-8 grid w-full gap-3 sm:grid-cols-2"
          data-demo-tour="metrics"
        >
          {prompts.map((x, i) => (
            <button
              key={x}
              data-demo-title={x}
              data-demo-detail="NEX is ready to generate a sample briefing from fictional workspace data."
              className={`${panel} flex min-h-16 items-center gap-3 p-4 text-left text-sm transition-colors hover:border-primary-500/40`}
            >
              <span className="text-primary-400">0{i + 1}</span>
              <span>{x}</span>
              <ArrowUpRight className="ml-auto h-4 w-4 text-text-tertiary" />
            </button>
          ))}
        </div>
        <div className="mt-5 flex w-full items-center gap-3 rounded-full border border-primary-500/30 bg-card p-2 pl-5 shadow-2xl shadow-primary-500/5">
          <span className="flex-1 text-left text-sm text-text-tertiary">
            Ask NEX about this workspace…
          </span>
          <button
            data-demo-action="NEX response generated"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-500 text-white"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </DemoFrame>
  );
}

const editorial: Record<
  string,
  {
    title: string;
    eyebrow: string;
    desc: string;
    action: string;
    kind:
      "notes" | "journal" | "ideas" | "documents" | "resources" | "reminders";
  }
> = {
  notes: {
    title: "Notes",
    eyebrow: "Knowledge canvas",
    desc: "Ideas and decisions arranged for fast visual recall.",
    action: "New note",
    kind: "notes",
  },
  journal: {
    title: "Journal",
    eyebrow: "Company memory",
    desc: "An editorial record of progress, decisions, and lessons.",
    action: "Write entry",
    kind: "journal",
  },
  ideas: {
    title: "Ideas",
    eyebrow: "Opportunity lab",
    desc: "Score possibilities by impact, evidence, and effort.",
    action: "Capture idea",
    kind: "ideas",
  },
  documents: {
    title: "Documents",
    eyebrow: "Document studio",
    desc: "A visual library for proposals, specs, and reports.",
    action: "New document",
    kind: "documents",
  },
  resources: {
    title: "Resources",
    eyebrow: "Curated library",
    desc: "The team’s best playbooks, assets, and references.",
    action: "Add resource",
    kind: "resources",
  },
  reminders: {
    title: "Reminders",
    eyebrow: "Action timeline",
    desc: "Important follow-ups, ordered around your attention.",
    action: "Add reminder",
    kind: "reminders",
  },
};
const content = [
  "Commerce launch checklist",
  "AI support guardrails",
  "Client discovery summary",
  "August growth experiments",
  "A better handoff process",
  "Weekly project pulse",
];
function EditorialDemo({ type }: { type: keyof typeof editorial }) {
  const p = editorial[type];
  if (p.kind === "reminders") return <ReminderDemo />;
  return (
    <DemoFrame>
      <DemoHeader
        eyebrow={p.eyebrow}
        title={p.title}
        description={p.desc}
        action={p.action}
      />
      {p.kind === "ideas" ? (
        <div
          className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
          data-demo-tour="metrics"
        >
          {content.map((x, i) => (
            <article
              key={x}
              data-demo-title={x}
              data-demo-detail={`Opportunity score ${92 - i * 7} · Strong signal · Medium effort`}
              className={`${panel} cursor-pointer p-5 transition-transform hover:-translate-y-1`}
            >
              <div className="flex justify-between">
                <Lightbulb className="h-5 w-5 text-primary-400" />
                <span className="text-2xl font-semibold">{92 - i * 7}</span>
              </div>
              <h2 className="mt-8 text-lg font-semibold">{x}</h2>
              <p className="mt-2 text-sm leading-6 text-text-secondary">
                A promising direction supported by recurring client and delivery
                signals.
              </p>
              <div className="mt-6 grid grid-cols-3 gap-2 border-t border-border-subtle pt-4 text-center text-[10px] text-text-tertiary">
                <span>
                  Impact
                  <br />
                  <b className="text-text-primary">High</b>
                </span>
                <span>
                  Effort
                  <br />
                  <b className="text-text-primary">Medium</b>
                </span>
                <span>
                  Signal
                  <br />
                  <b className="text-primary-400">Strong</b>
                </span>
              </div>
            </article>
          ))}
        </div>
      ) : p.kind === "documents" || p.kind === "resources" ? (
        <div
          className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
          data-demo-tour="metrics"
        >
          {content.map((x, i) => (
            <article
              key={x}
              data-demo-title={x}
              data-demo-detail={`${p.kind === "documents" ? "Document" : "Resource"} preview · ${i + 3} collaborators`}
              className={`${panel} cursor-pointer overflow-hidden transition-transform hover:-translate-y-1`}
            >
              <div
                className={`flex h-36 items-center justify-center ${i % 2 ? "bg-primary-500/10" : "bg-bg-sidebar"}`}
              >
                {p.kind === "documents" ? (
                  <FileText className="h-12 w-12 text-primary-400" />
                ) : (
                  <Bookmark className="h-12 w-12 text-primary-400" />
                )}
              </div>
              <div className="p-5">
                <div className="flex justify-between">
                  <h2 className="font-semibold">{x}</h2>
                  <MoreHorizontal className="h-4 w-4 text-text-tertiary" />
                </div>
                <p className="mt-2 text-xs text-text-tertiary">
                  {i % 2 ? "Updated today" : "Updated Aug 11"} · {i + 3}{" "}
                  collaborators
                </p>
                <div className="mt-5 flex gap-2">
                  <span className={pill}>
                    {p.kind === "documents" ? "PDF" : "Guide"}
                  </span>
                  <span className={pill}>{i % 2 ? "Pinned" : "Shared"}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : p.kind === "journal" ? (
        <div className="mx-auto max-w-4xl" data-demo-tour="metrics">
          {content.slice(0, 4).map((x, i) => (
            <article
              key={x}
              data-demo-title={x}
              data-demo-detail="Journal entry preview · Shared with the demo team"
              className="grid gap-4 border-l border-primary-500/40 pb-10 pl-8 md:grid-cols-[120px_1fr]"
            >
              <div className="relative">
                <span className="absolute -left-[37px] top-1 h-4 w-4 rounded-full border-4 border-bg-app bg-primary-500" />
                <p className="text-xs text-text-tertiary">AUG {12 - i * 2}</p>
              </div>
              <div className={`${panel} p-6`}>
                <p className="text-[10px] font-bold uppercase tracking-widest text-primary-400">
                  {i % 2 ? "OPERATIONS" : "PRODUCT"}
                </p>
                <h2 className="mt-2 text-xl font-semibold">{x}</h2>
                <p className="mt-3 text-sm leading-6 text-text-secondary">
                  A concise reflection on what changed, why it mattered, and
                  what the team will do differently next time.
                </p>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div
          className="columns-1 gap-4 sm:columns-2 xl:columns-3"
          data-demo-tour="metrics"
        >
          {content.map((x, i) => (
            <article
              key={x}
              data-demo-title={x}
              data-demo-detail="Knowledge card · Related to three sample projects"
              className={`${panel} mb-4 cursor-pointer break-inside-avoid p-5 transition-transform hover:-translate-y-1`}
            >
              <div className="flex justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary-400">
                  {i % 2 ? "RESEARCH" : "PROJECT"}
                </span>
                <Star className="h-4 w-4 text-text-tertiary" />
              </div>
              <h2 className="mt-5 text-lg font-semibold">{x}</h2>
              <p className="mt-3 text-sm leading-6 text-text-secondary">
                {i % 2
                  ? "What we learned from the latest client conversation and the decisions it changes."
                  : "The essential checklist, owners, open questions, and launch conditions in one place."}
              </p>
              {i % 3 === 0 && (
                <div className="mt-5 h-28 rounded-2xl bg-gradient-to-br from-primary-500/20 to-transparent" />
              )}
              <p className="mt-5 text-[10px] text-text-tertiary">
                Edited {i + 1}h ago
              </p>
            </article>
          ))}
        </div>
      )}
      <NexStrip text="NEX found related context across three items and can combine it into a concise team briefing." />
    </DemoFrame>
  );
}

function ReminderDemo() {
  const groups = [
    [
      "TODAY",
      [
        "Send revised proposal",
        "Review launch checklist",
        "Call Northstar Labs",
      ],
    ],
    ["TOMORROW", ["Renew staging certificate", "Prepare weekly update"]],
    ["NEXT WEEK", ["Invoice milestone two", "Review monthly runway"]],
  ];
  return (
    <DemoFrame>
      <DemoHeader
        eyebrow="Action timeline"
        title="Reminders"
        description="A chronological focus rail that puts urgency before volume."
        action="Add reminder"
      />
      <div
        className="grid gap-5 xl:grid-cols-[1fr_320px]"
        data-demo-tour="metrics"
      >
        <section className={`${panel} p-5 md:p-7`}>
          {groups.map(([label, items]) => (
            <div key={String(label)} className="mb-8 last:mb-0">
              <p className="mb-3 text-[10px] font-bold tracking-[.18em] text-text-tertiary">
                {label as string}
              </p>
              <div className="space-y-2">
                {(items as string[]).map((x, i) => (
                  <div
                    key={x}
                    className="flex items-center gap-4 rounded-2xl border border-border-subtle p-4"
                  >
                    <button
                      className="flex h-7 w-7 items-center justify-center rounded-full border border-primary-500/50"
                      aria-label={`Complete ${x}`}
                    >
                      {i === 1 ? (
                        <Check className="h-3.5 w-3.5 text-primary-400" />
                      ) : null}
                    </button>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{x}</p>
                      <p className="mt-1 text-xs text-text-tertiary">
                        {label === "TODAY" ? `${i + 2}:00 PM` : "9:00 AM"}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-text-tertiary" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>
        <aside className="space-y-4">
          <div className="rounded-3xl bg-primary-500 p-6 text-white">
            <Bell className="h-5 w-5" />
            <p className="mt-8 text-4xl font-semibold">06</p>
            <p className="mt-1 text-sm text-white/70">due today</p>
            <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/20">
              <div className="h-full w-2/3 rounded-full bg-white" />
            </div>
          </div>
          <NexCard text="The proposal follow-up is the only time-sensitive item. Send it before 4 PM." />
        </aside>
      </div>
    </DemoFrame>
  );
}

function NexStrip({ text }: { text: string }) {
  return (
    <section
      className="flex flex-col gap-4 rounded-3xl border border-primary-500/25 bg-primary-500/10 p-5 md:flex-row md:items-center"
      data-demo-tour="nex"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-500 text-white">
        <Sparkles className="h-5 w-5" />
      </span>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[.16em] text-primary-400">
          NEX recommends
        </p>
        <p className="mt-1 text-sm leading-6 text-text-secondary">{text}</p>
      </div>
      <span className="ml-auto whitespace-nowrap text-xs font-bold text-primary-400">
        View reasoning →
      </span>
    </section>
  );
}
function NexCard({ text }: { text: string }) {
  return (
    <div className={`${panel} p-5`}>
      <Sparkles className="h-5 w-5 text-primary-400" />
      <p className="mt-4 text-[10px] font-bold uppercase tracking-widest text-primary-400">
        NEX focus
      </p>
      <p className="mt-2 text-sm leading-6 text-text-secondary">{text}</p>
    </div>
  );
}
function DemoFrame({ children }: { children: React.ReactNode }) {
  const [detail, setDetail] = useState<{ title: string; body: string } | null>(
    null,
  );
  const [toast, setToast] = useState("");
  const reduceMotion = useReducedMotion();

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2600);
  };

  const interact = (event: ReactMouseEvent<HTMLDivElement>) => {
    const target = (event.target as HTMLElement).closest<HTMLElement>(
      "button, article, [data-demo-title]",
    );
    if (!target || target.closest('[aria-label="NEX demo walkthrough"]'))
      return;
    const action = target.dataset.demoAction;
    if (action) {
      showToast(`${action} - saved in your private demo sandbox`);
      return;
    }
    const title =
      target.dataset.demoTitle ||
      target.querySelector("h2, h3")?.textContent?.trim();
    if (!title) return;
    setDetail({
      title,
      body:
        target.dataset.demoDetail ||
        "Open this item to review ownership, activity, attachments, and NEX recommendations. Everything here is fictional and private to this demo session.",
    });
  };

  return (
    <div
      onClick={interact}
      className="mx-auto w-full max-w-[1500px] space-y-5 pb-28"
    >
      <div className="flex justify-end">
        <DemoNotice />
      </div>
      {children}
      <AnimatePresence>
        {detail ? (
          <>
            <motion.button
              type="button"
              aria-label="Close preview"
              onClick={() => setDetail(null)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/45 backdrop-blur-sm"
            />
            <motion.aside
              role="dialog"
              aria-modal="true"
              aria-label={`${detail.title} preview`}
              initial={{ x: reduceMotion ? 0 : "100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: reduceMotion ? 0 : "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed bottom-0 right-0 top-0 z-50 flex w-full max-w-md flex-col border-l border-border-subtle bg-bg-sidebar shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-border-subtle p-5">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[.18em] text-primary-400">
                    Demo detail
                  </p>
                  <h2 className="mt-1 text-lg font-semibold">{detail.title}</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setDetail(null)}
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-border-subtle"
                  aria-label="Close detail"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-5">
                <div className="rounded-3xl border border-primary-500/25 bg-primary-500/10 p-5">
                  <Sparkles className="h-5 w-5 text-primary-400" />
                  <p className="mt-4 text-sm leading-6 text-text-secondary">
                    {detail.body}
                  </p>
                </div>
                <div className="mt-6 grid grid-cols-2 gap-3">
                  {[
                    ["Owner", "Demo team"],
                    ["Status", "On track"],
                    ["Activity", "12 updates"],
                    ["Access", "Read only"],
                  ].map(([label, value]) => (
                    <div key={label} className={`${panel} p-4`}>
                      <p className="text-[10px] uppercase tracking-wider text-text-tertiary">
                        {label}
                      </p>
                      <p className="mt-2 text-sm font-semibold">{value}</p>
                    </div>
                  ))}
                </div>
                <h3 className="mt-7 text-sm font-semibold">Recent activity</h3>
                <div className="mt-3 space-y-4 border-l border-primary-500/30 pl-5">
                  {[
                    "NEX summarized the latest changes",
                    "A teammate reviewed this item",
                    "Progress was updated",
                  ].map((item, index) => (
                    <div key={item} className="relative">
                      <span className="absolute -left-[25px] top-1 h-2 w-2 rounded-full bg-primary-400" />
                      <p className="text-sm">{item}</p>
                      <p className="mt-1 text-xs text-text-tertiary">
                        {index + 1} hour{index ? "s" : ""} ago
                      </p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="border-t border-border-subtle p-5">
                <button
                  type="button"
                  data-demo-action="Preview action completed"
                  onClick={() => {
                    setDetail(null);
                    showToast(
                      "Action completed - saved in your private demo sandbox",
                    );
                  }}
                  className="min-h-12 w-full rounded-full bg-primary-500 px-5 text-sm font-bold text-white"
                >
                  Try this action
                </button>
              </div>
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>
      <AnimatePresence>
        {toast ? (
          <motion.div
            role="status"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="fixed bottom-24 left-1/2 z-[60] w-[min(28rem,calc(100vw-2rem))] -translate-x-1/2 rounded-full border border-primary-500/30 bg-bg-sidebar/95 px-5 py-3 text-center text-sm font-medium shadow-2xl backdrop-blur-xl"
          >
            <CheckCircle2 className="mr-2 inline h-4 w-4 text-primary-400" />
            {toast}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export function DemoSystemPage({ pathname }: { pathname: string }) {
  const key = pathname.split("/")[2] || "dashboard";
  if (key === "dashboard") return <DemoDashboard />;
  if (key === "finance") return <FinanceDemo />;
  if (key === "tasks") return <TasksDemo />;
  if (key === "events") return <CalendarDemo />;
  if (key === "messages") return <MessagesDemo />;
  if (key === "assistant") return <AssistantDemo />;
  if (key in editorial)
    return <EditorialDemo type={key as keyof typeof editorial} />;
  return <DemoDashboard />;
}
