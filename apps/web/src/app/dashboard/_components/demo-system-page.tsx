"use client";

import {
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  Circle,
  Clock3,
  FileText,
  MessageSquare,
  Plus,
  Search,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import { DemoDashboard } from "./demo-dashboard";

type DemoSection = {
  eyebrow: string;
  title: string;
  description: string;
  metric: string;
  metricLabel: string;
  secondary: string;
  secondaryLabel: string;
  action: string;
  columns: string[];
  rows: string[][];
  insight: string;
};

const sections: Record<string, DemoSection> = {
  finance: {
    eyebrow: "Financial command center",
    title: "Finance",
    description:
      "Know where the money is going and what the next month looks like.",
    metric: "₱248K",
    metricLabel: "Revenue this month",
    secondary: "₱122K",
    secondaryLabel: "Net operating margin",
    action: "Add transaction",
    columns: ["Transaction", "Category", "Date", "Amount"],
    rows: [
      ["Mobile commerce milestone", "Project income", "Aug 12", "+₱96,000"],
      ["Cloud infrastructure", "Software", "Aug 10", "−₱18,420"],
      ["Operations dashboard", "Project income", "Aug 08", "+₱84,000"],
      ["Design subscriptions", "Software", "Aug 05", "−₱7,800"],
    ],
    insight:
      "Revenue is tracking 14% above plan. Maintain the current delivery pace to protect margin.",
  },
  tasks: {
    eyebrow: "Team execution",
    title: "Tasks",
    description:
      "Turn priorities into visible, accountable progress across the team.",
    metric: "24",
    metricLabel: "Open tasks",
    secondary: "86%",
    secondaryLabel: "On-time completion",
    action: "Create task",
    columns: ["Task", "Project", "Owner", "Status"],
    rows: [
      ["Approve onboarding flow", "Mobile commerce", "Mika", "In review"],
      [
        "Connect support knowledge",
        "AI support agent",
        "Justine",
        "In progress",
      ],
      ["Prepare launch analytics", "Growth website", "Paolo", "Ready"],
      ["Review access controls", "Operations hub", "Andrea", "To do"],
    ],
    insight:
      "Two launch-critical tasks need review today. Clearing them keeps both releases on schedule.",
  },
  events: {
    eyebrow: "Shared schedule",
    title: "Calendar",
    description:
      "Keep launches, reviews, meetings, and deadlines in one team timeline.",
    metric: "08",
    metricLabel: "Events this week",
    secondary: "02",
    secondaryLabel: "Milestones due",
    action: "New event",
    columns: ["Event", "Date", "Time", "Team"],
    rows: [
      ["Commerce design review", "Aug 14", "10:00 AM", "Product"],
      ["AI support launch check", "Aug 15", "2:30 PM", "Engineering"],
      ["Client progress call", "Aug 17", "11:00 AM", "Delivery"],
      ["August planning", "Aug 19", "9:00 AM", "All hands"],
    ],
    insight:
      "Thursday has the highest meeting load. Protect the afternoon focus block for launch work.",
  },
  reminders: {
    eyebrow: "Nothing falls through",
    title: "Reminders",
    description: "Bring important follow-ups back at exactly the right moment.",
    metric: "06",
    metricLabel: "Due today",
    secondary: "18",
    secondaryLabel: "Completed this week",
    action: "Add reminder",
    columns: ["Reminder", "When", "Related to", "Status"],
    rows: [
      [
        "Send revised proposal",
        "Today · 4:00 PM",
        "Northstar Labs",
        "Upcoming",
      ],
      ["Renew staging certificate", "Tomorrow", "Infrastructure", "Scheduled"],
      ["Check launch feedback", "Aug 16", "AI support", "Scheduled"],
      ["Invoice milestone two", "Aug 18", "Mobile commerce", "Scheduled"],
    ],
    insight:
      "One client follow-up is time-sensitive. NEX recommends sending the revised proposal before 4 PM.",
  },
  notes: {
    eyebrow: "Capture the context",
    title: "Notes",
    description:
      "Keep decisions, research, and working thoughts easy to find and share.",
    metric: "32",
    metricLabel: "Team notes",
    secondary: "07",
    secondaryLabel: "Updated today",
    action: "New note",
    columns: ["Note", "Workspace", "Updated", "Owner"],
    rows: [
      ["Commerce launch checklist", "Mobile commerce", "12 min ago", "Mika"],
      ["Support agent guardrails", "AI support", "1 hour ago", "Justine"],
      ["Client discovery summary", "Northstar Labs", "Yesterday", "Andrea"],
      ["August growth experiments", "Marketing", "Aug 11", "Paolo"],
    ],
    insight:
      "Three recent notes mention launch risk. NEX can turn them into a single action summary.",
  },
  journal: {
    eyebrow: "A record of progress",
    title: "Journal",
    description:
      "Document wins, decisions, and lessons while the context is still fresh.",
    metric: "14",
    metricLabel: "Entries this month",
    secondary: "04",
    secondaryLabel: "Shared reflections",
    action: "Write entry",
    columns: ["Entry", "Theme", "Date", "Visibility"],
    rows: [
      ["What changed after user testing", "Product", "Aug 12", "Team"],
      ["A better handoff process", "Operations", "Aug 09", "Private"],
      ["Launch week lessons", "Delivery", "Aug 05", "Team"],
      ["July retrospective", "Company", "Jul 31", "Team"],
    ],
    insight:
      "Delivery handoffs are the most repeated theme this month. Turn the latest lesson into a reusable checklist.",
  },
  ideas: {
    eyebrow: "From spark to roadmap",
    title: "Ideas",
    description:
      "Collect opportunities, sharpen them together, and promote the best into real work.",
    metric: "18",
    metricLabel: "Ideas captured",
    secondary: "05",
    secondaryLabel: "Ready to evaluate",
    action: "Capture idea",
    columns: ["Idea", "Theme", "Signal", "Stage"],
    rows: [
      ["Client health summaries", "Automation", "High", "Evaluating"],
      ["Proposal generator", "Sales", "High", "Research"],
      ["Weekly project pulse", "Delivery", "Medium", "Shortlisted"],
      ["Resource recommendation", "Knowledge", "Medium", "New"],
    ],
    insight:
      "Client health summaries have the strongest customer signal and fit the existing NEX workflow.",
  },
  documents: {
    eyebrow: "Work that stays organized",
    title: "Documents",
    description:
      "Create, review, and share the files that keep projects moving.",
    metric: "46",
    metricLabel: "Active documents",
    secondary: "09",
    secondaryLabel: "Shared externally",
    action: "New document",
    columns: ["Document", "Type", "Updated", "Access"],
    rows: [
      ["Mobile commerce proposal", "Proposal", "Today", "Client shared"],
      ["AI support implementation", "Technical spec", "Yesterday", "Internal"],
      ["August delivery report", "Report", "Aug 10", "Leadership"],
      ["Brand usage guide", "Guide", "Aug 06", "Team"],
    ],
    insight:
      "The commerce proposal was viewed three times today. A follow-up now is likely to get attention.",
  },
  resources: {
    eyebrow: "Team knowledge base",
    title: "Resources",
    description:
      "Give everyone one dependable place for links, guides, assets, and references.",
    metric: "68",
    metricLabel: "Shared resources",
    secondary: "12",
    secondaryLabel: "Collections",
    action: "Add resource",
    columns: ["Resource", "Collection", "Added", "Use"],
    rows: [
      ["Frontend quality checklist", "Engineering", "Today", "Frequent"],
      ["Client kickoff template", "Delivery", "Aug 11", "Frequent"],
      ["ARKO brand assets", "Brand", "Aug 08", "Pinned"],
      ["AI safety guidelines", "AI systems", "Aug 03", "Pinned"],
    ],
    insight:
      "The kickoff template is your fastest-growing resource. Pin it for every new client workspace.",
  },
  messages: {
    eyebrow: "Communication in context",
    title: "Messages",
    description:
      "Keep team and client conversations connected to the work they affect.",
    metric: "04",
    metricLabel: "Unread threads",
    secondary: "12m",
    secondaryLabel: "Average response",
    action: "New message",
    columns: ["Conversation", "Last message", "Time", "Status"],
    rows: [
      [
        "Northstar Labs",
        "The revised direction looks great.",
        "8 min",
        "Unread",
      ],
      ["AI support team", "QA is ready for final review.", "22 min", "Active"],
      ["Mobile commerce", "Uploaded the new prototype.", "1 hour", "Active"],
      ["ARKO team", "Planning notes are now available.", "Yesterday", "Read"],
    ],
    insight:
      "Northstar Labs replied positively. Respond today while the proposal has momentum.",
  },
  assistant: {
    eyebrow: "Workspace intelligence",
    title: "NEX Assistant",
    description:
      "Ask questions across your work and turn answers into clear next steps.",
    metric: "9.4h",
    metricLabel: "Estimated time saved",
    secondary: "28",
    secondaryLabel: "Insights this week",
    action: "Start a conversation",
    columns: ["Recent conversation", "Context", "Updated", "Result"],
    rows: [
      [
        "What needs attention today?",
        "All workspace",
        "10 min ago",
        "3 actions",
      ],
      ["Summarize launch readiness", "AI support", "Yesterday", "Ready"],
      ["Where can we protect margin?", "Finance", "Aug 11", "2 insights"],
      ["Prepare client update", "Mobile commerce", "Aug 09", "Drafted"],
    ],
    insight:
      "Try asking: “What should the team prioritize before Friday?” In demo mode, responses remain examples only.",
  },
};

function sectionKey(pathname: string) {
  return pathname.split("/")[2] || "dashboard";
}

export function DemoSystemPage({ pathname }: { pathname: string }) {
  const key = sectionKey(pathname);
  if (key === "dashboard") return <DemoDashboard />;
  const section = sections[key] ?? sections.tasks;

  return (
    <div
      className="mx-auto w-full max-w-[1500px] space-y-4 pb-28"
      data-demo-tour="overview"
    >
      <section className="relative overflow-hidden rounded-3xl border border-border-subtle bg-card p-5 md:p-7">
        <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-primary-500/12 blur-3xl" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-primary-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-primary-400">
                Interactive demo
              </span>
              <span className="rounded-full border border-border-subtle px-3 py-1 text-[10px] uppercase tracking-[0.14em] text-text-tertiary">
                Sample data · Read only
              </span>
            </div>
            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-text-tertiary">
              {section.eyebrow}
            </p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight md:text-4xl">
              {section.title}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-text-secondary md:text-base">
              {section.description}
            </p>
          </div>
          <button
            type="button"
            disabled
            className="flex min-h-11 items-center justify-center gap-2 rounded-full bg-primary-500 px-5 text-xs font-bold text-white opacity-90"
          >
            <Plus className="h-4 w-4" /> {section.action}
          </button>
        </div>
      </section>

      <section
        className="grid gap-3 md:grid-cols-[1fr_1fr_1.4fr]"
        data-demo-tour="metrics"
      >
        <div className="dashboard-panel rounded-2xl border border-border-subtle p-5">
          <TrendingUp className="h-4 w-4 text-primary-400" />
          <p className="mt-5 text-3xl font-semibold tracking-tight">
            {section.metric}
          </p>
          <p className="mt-1 text-xs text-text-tertiary">
            {section.metricLabel}
          </p>
        </div>
        <div className="dashboard-panel rounded-2xl border border-border-subtle p-5">
          <CheckCircle2 className="h-4 w-4 text-primary-400" />
          <p className="mt-5 text-3xl font-semibold tracking-tight">
            {section.secondary}
          </p>
          <p className="mt-1 text-xs text-text-tertiary">
            {section.secondaryLabel}
          </p>
        </div>
        <div
          className="dashboard-panel flex rounded-2xl border border-primary-500/20 p-5"
          data-demo-tour="nex"
        >
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-500/15 text-primary-400">
              <Sparkles className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary-400">
                NEX insight
              </p>
              <p className="mt-2 text-sm leading-6 text-text-secondary">
                {section.insight}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section
        className="dashboard-panel overflow-hidden rounded-2xl border border-border-subtle"
        data-demo-tour="insights"
      >
        <div className="flex flex-col gap-3 border-b border-border-subtle p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold">Recent activity</p>
            <p className="mt-0.5 text-xs text-text-tertiary">
              A polished preview of this workspace module
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-border-subtle px-3 py-2 text-xs text-text-tertiary">
            <Search className="h-3.5 w-3.5" /> Search{" "}
            {section.title.toLowerCase()}
          </div>
        </div>
        <div className="overflow-x-auto">
          <div className="min-w-[680px]">
            <div className="grid grid-cols-4 border-b border-border-subtle px-5 py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-text-tertiary">
              {section.columns.map((column) => (
                <span key={column}>{column}</span>
              ))}
            </div>
            {section.rows.map((row, index) => (
              <div
                key={row[0]}
                className="grid grid-cols-4 items-center border-b border-border-subtle/70 px-5 py-4 text-sm last:border-0"
              >
                {row.map((cell, cellIndex) => (
                  <span
                    key={cell}
                    className={
                      cellIndex === 0
                        ? "font-medium text-text-primary"
                        : cellIndex === 3
                          ? "text-primary-400"
                          : "text-text-secondary"
                    }
                  >
                    {cellIndex === 0 ? (
                      <span className="flex items-center gap-2">
                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary-500/10 text-primary-400">
                          {index % 3 === 0 ? (
                            <FileText className="h-3.5 w-3.5" />
                          ) : index % 3 === 1 ? (
                            <Users className="h-3.5 w-3.5" />
                          ) : (
                            <Clock3 className="h-3.5 w-3.5" />
                          )}
                        </span>
                        {cell}
                      </span>
                    ) : (
                      cell
                    )}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { icon: CalendarDays, label: "Upcoming", value: "4 scheduled" },
          { icon: MessageSquare, label: "Collaboration", value: "12 updates" },
          { icon: ArrowUpRight, label: "Momentum", value: "+18% this week" },
        ].map(({ icon: Icon, label, value }) => (
          <div
            key={label}
            className="flex items-center gap-3 rounded-2xl border border-border-subtle bg-card p-4"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-500/10 text-primary-400">
              <Icon className="h-4 w-4" />
            </span>
            <div>
              <p className="text-xs text-text-tertiary">{label}</p>
              <p className="mt-0.5 text-sm font-semibold">{value}</p>
            </div>
            <Circle className="ml-auto h-2 w-2 fill-primary-400 text-primary-400" />
          </div>
        ))}
      </div>
    </div>
  );
}
