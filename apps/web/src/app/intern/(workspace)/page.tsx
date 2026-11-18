"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@arko/ui";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  CheckSquare,
  CheckCircle2,
  Clock3,
  FileText,
  Send,
  Target,
} from "lucide-react";
import { api } from "../../../lib/trpc/client";
import { MetricCard } from "../../dashboard/_components/dashboard-metric-card";
import { dateLabel, Empty, QueryState, Status } from "./_components/common";

export default function InternDashboard() {
  const query = api.intern.overview.useQuery(undefined, {
    refetchInterval: 30000,
    refetchIntervalInBackground: false,
  });
  const data = query.data;
  const counts = data?.counts ?? {};
  const completed = counts.DONE ?? 0;
  const total = Object.values(counts).reduce((sum, value) => sum + value, 0);
  const completionRate = total ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="dashboard-reference mx-auto min-h-full w-full max-w-[1500px]">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between xl:mb-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-text-tertiary">
            Track your assignments, feedback and upcoming project work.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/intern/documents" className="dashboard-outline-button">
            <FileText className="h-4 w-4" />
            Documents
          </Link>
          <Link href="/intern/resources" className="dashboard-outline-button">
            <BookOpen className="h-4 w-4" />
            Resources
          </Link>
          <Link href="/intern/tasks" className="dashboard-outline-button">
            <CheckSquare className="h-4 w-4" />
            My Tasks
          </Link>
        </div>
      </div>
      <QueryState
        loading={query.isLoading}
        error={query.error}
        retry={query.refetch}
      />
      {data && (
        <>
          <section aria-labelledby="intern-kpis" className="mb-4 xl:mb-3">
            <div className="mb-3 flex items-end justify-between">
              <div>
                <h2
                  id="intern-kpis"
                  className="text-base font-semibold text-text-primary"
                >
                  At a glance
                </h2>
                <p className="mt-1 text-xs text-text-tertiary">
                  Your work and review status, all in one place.
                </p>
              </div>
              <span className="hidden text-xs text-text-tertiary sm:block">
                Updated live
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                label="To do"
                value={String(counts.TODO ?? 0)}
                detail="Ready to get started"
                icon={<CheckSquare className="h-4 w-4" />}
                positive
              />
              <MetricCard
                label="In progress"
                value={String(counts.IN_PROGRESS ?? 0)}
                detail="Your current assignments"
                icon={<Clock3 className="h-4 w-4" />}
                positive
              />
              <MetricCard
                label="In review"
                value={String(counts.REVIEW ?? 0)}
                detail="Awaiting team feedback"
                icon={<Send className="h-4 w-4" />}
                positive
              />
              <MetricCard
                label="Completed"
                value={String(completed)}
                detail={String(total) + " total assignments"}
                icon={<CheckCircle2 className="h-4 w-4" />}
                positive
              />
            </div>
          </section>

          <div className="grid gap-4 xl:grid-cols-[300px_minmax(0,1fr)] xl:gap-3">
            <div className="flex min-w-0 flex-col gap-4 xl:gap-3">
              <Card className="dashboard-panel overflow-hidden">
                <CardHeader className="flex-row items-center justify-between p-5 pb-3">
                  <CardTitle className="text-base font-medium">
                    Your progress
                  </CardTitle>
                  <Target className="h-4 w-4 text-primary-400" />
                </CardHeader>
                <CardContent className="p-5 pt-0">
                  <div className="dashboard-balance-card">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-white/75">
                        Completed assignments
                      </span>
                      <CheckCircle2 className="h-5 w-5 text-white/80" />
                    </div>
                    <p className="mt-8 text-3xl font-semibold tabular-nums text-white">
                      {completionRate}%
                    </p>
                    <p className="mt-1 text-xs text-white/75">
                      {completed} of {total} completed
                    </p>
                  </div>
                  <p className="mt-3 text-xs leading-relaxed text-text-tertiary">
                    {total
                      ? "Keep your team up to date as your work moves forward."
                      : "Your progress starts with your first assignment."}
                  </p>
                </CardContent>
              </Card>
              <Card className="dashboard-panel overflow-hidden">
                <CardHeader className="p-5 pb-3">
                  <CardTitle className="text-base font-medium">
                    Ready for feedback?
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5 pt-0">
                  <p className="text-sm leading-relaxed text-text-secondary">
                    Add your work link to a task and submit it for review. Your
                    team can respond in the same place.
                  </p>
                  <Link
                    href="/intern/tasks"
                    className="dashboard-small-button mt-4"
                  >
                    View my tasks <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </CardContent>
              </Card>
              <Card className="dashboard-panel overflow-hidden">
                <CardHeader className="flex-row items-center justify-between p-5 pb-3">
                  <CardTitle className="text-base font-medium">
                    Shared library
                  </CardTitle>
                  <BookOpen className="h-4 w-4 text-primary-400" />
                </CardHeader>
                <CardContent className="p-5 pt-0">
                  {data.resources.length ? (
                    <div className="divide-y divide-border-subtle">
                      {data.resources.map((resource) => (
                        <Link
                          key={resource.id}
                          href={
                            "/intern/resources?search=" +
                            encodeURIComponent(resource.title)
                          }
                          className="flex min-h-11 items-center gap-2 py-3 text-sm text-text-secondary hover:text-text-primary"
                        >
                          <BookOpen className="h-4 w-4 shrink-0" />
                          <span className="min-w-0 flex-1 break-words">
                            {resource.title}
                          </span>
                          <ArrowUpRight className="h-3.5 w-3.5 shrink-0" />
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm leading-relaxed text-text-tertiary">
                      Guides, tools and references shared by your team will
                      appear here.
                    </p>
                  )}
                  <Link
                    href="/intern/resources"
                    className="mt-4 inline-flex min-h-9 items-center gap-1 text-xs text-primary-400 hover:text-primary-300"
                  >
                    Explore resources <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </CardContent>
              </Card>
            </div>

            <div className="flex min-w-0 flex-col gap-4 xl:gap-3">
              <Card className="dashboard-panel overflow-hidden">
                <CardHeader className="flex-row items-start justify-between gap-3 p-5 pb-3">
                  <div>
                    <CardTitle className="text-base font-medium">
                      Your next moves
                    </CardTitle>
                    <p className="mt-1 text-xs text-text-tertiary">
                      Open work, ordered by deadline.
                    </p>
                  </div>
                  <Link
                    className="dashboard-small-button shrink-0"
                    href="/intern/tasks"
                  >
                    All tasks <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </CardHeader>
                <CardContent className="p-0">
                  {data.tasks.length ? (
                    <div className="divide-y divide-border-subtle">
                      {data.tasks.map((task) => (
                        <Link
                          key={task.id}
                          href={"/intern/tasks?task=" + task.id}
                          className="flex flex-wrap items-center gap-3 px-5 py-4 text-sm hover:bg-card-elevated"
                        >
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-500/10 text-primary-400">
                            <CheckSquare className="h-4 w-4" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <strong className="block break-words font-medium text-text-primary">
                              {task.title}
                            </strong>
                            <small className="mt-1 block text-xs text-text-tertiary">
                              {task.project?.name || "ARKO"} · Due{" "}
                              {dateLabel(task.dueDate)}
                            </small>
                          </span>
                          <Status status={task.status} />
                          <ArrowRight className="h-4 w-4 shrink-0 text-text-tertiary" />
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <Empty title="You’re all caught up">
                      Your next assignment will appear here when it’s ready.
                    </Empty>
                  )}
                </CardContent>
              </Card>
              <Card className="dashboard-panel overflow-hidden">
                <CardHeader className="flex-row items-center justify-between p-5 pb-3">
                  <div>
                    <CardTitle className="text-base font-medium">
                      Coming up
                    </CardTitle>
                    <p className="mt-1 text-xs text-text-tertiary">
                      Shared project meetings and check-ins.
                    </p>
                  </div>
                  <CalendarDays className="h-4 w-4 text-primary-400" />
                </CardHeader>
                <CardContent className="p-5 pt-0">
                  {data.events.length ? (
                    <div className="divide-y divide-border-subtle">
                      {data.events.map((event) => (
                        <Link
                          href="/intern/calendar"
                          key={event.id}
                          className="flex items-center gap-3 py-4"
                        >
                          <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-lg border border-border-subtle bg-card-elevated">
                            <strong className="text-base font-semibold tabular-nums">
                              {new Date(event.date).getDate()}
                            </strong>
                            <span className="text-[10px] text-text-tertiary">
                              {new Date(event.date).toLocaleDateString(
                                "en-PH",
                                { month: "short" },
                              )}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="break-words text-sm font-medium text-text-primary">
                              {event.title}
                            </p>
                            <p className="mt-1 text-xs text-text-tertiary">
                              {event.startTime} – {event.endTime}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className="py-5 text-sm text-text-tertiary">
                      No upcoming shared meetings. Your task deadlines are in
                      Calendar.
                    </p>
                  )}
                  <Link
                    href="/intern/calendar"
                    className="dashboard-small-button mt-2"
                  >
                    Open calendar <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
