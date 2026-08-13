'use client'

import { useMemo, useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@arko/ui'
import {
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  ExternalLink,
  GitCommit,
  Plus,
  FileCheck,
  Target,
  Users,
  Wallet,
  Eye,
  Activity,
} from 'lucide-react'
import { api } from '../../../lib/trpc/client'
import { PerformanceChart } from './performance-chart'
import { LandingTrafficChart } from './landing-traffic-chart'
import { Sparkline } from './sparkline'

function pctChange(current: number, previous: number) {
  return previous > 0 ? ((current - previous) / previous) * 100 : null
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 0,
  }).format(value)
}

function timeAgo(date: string) {
  const minutes = Math.floor((Date.now() - new Date(date).getTime()) / 60_000)
  if (minutes < 1) return 'now'
  if (minutes < 60) return `${minutes}m`
  if (minutes < 1_440) return `${Math.floor(minutes / 60)}h`
  return `${Math.floor(minutes / 1_440)}d`
}

export default function DashboardContent() {
  const { data: session } = useSession()
  const canUseCompany =
    session?.user?.role === 'ADMIN' || session?.user?.role === 'ACCOUNTANT'
  const [financeScope, setFinanceScope] = useState<'PERSONAL' | 'COMPANY'>(
    'PERSONAL',
  )
  const { data: balance } = api.finance.getBalance.useQuery({
    scope: financeScope,
  })
  const { data: insights } = api.finance.getInsights.useQuery({
    scope: financeScope,
  })
  const { data: tasks } = api.tasks.list.useQuery()
  const { data: transactions } = api.finance.getTransactions.useQuery({
    scope: financeScope,
  })
  const { data: users } = api.users.search.useQuery({})
  const { data: updates, isLoading: updatesLoading } =
    api.github.recentCommits.useQuery({ limit: 5 })
  const { data: landingStats } = api.landing.stats.useQuery()

  const completedTasks =
    tasks?.filter((task) => task.status === 'DONE').length ?? 0
  const activeTasks =
    tasks?.filter((task) => task.status !== 'DONE').length ?? 0
  const totalTasks = tasks?.length ?? 0
  const completionRate = totalTasks
    ? Math.round((completedTasks / totalTasks) * 100)
    : 0
  const recentTransactions = transactions?.slice(0, 6) ?? []
  const team = users?.slice(0, 5) ?? []
  const commits = updates?.commits ?? []

  const chartData = useMemo(() => {
    const months: Record<string, { income: number; expenses: number }> = {}
    const now = new Date()
    for (let index = 5; index >= 0; index--) {
      const month = new Date(now.getFullYear(), now.getMonth() - index, 1)
      months[month.toLocaleDateString('en-US', { month: 'short' })] = {
        income: 0,
        expenses: 0,
      }
    }
    for (const transaction of transactions ?? []) {
      const month = new Date(transaction.date).toLocaleDateString('en-US', {
        month: 'short',
      })
      if (!months[month]) continue
      if (transaction.type === 'INCOME')
        months[month].income += transaction.amount
      if (transaction.type === 'EXPENSE')
        months[month].expenses += transaction.amount
    }
    return {
      labels: Object.keys(months),
      income: Object.values(months).map((month) => month.income),
      expenses: Object.values(months).map((month) => month.expenses),
    }
  }, [transactions])

  const incomeDelta = insights
    ? pctChange(insights.current.income, insights.previous.income)
    : null
  const expenseDelta = insights
    ? pctChange(insights.current.expenses, insights.previous.expenses)
    : null
  const landingDelta = landingStats?.previous7Days
    ? pctChange(landingStats.last7Days ?? 0, landingStats.previous7Days)
    : null

  return (
    <div className="dashboard-reference mx-auto min-h-full w-full max-w-[1500px] xl:flex xl:h-full xl:min-h-0 xl:flex-col xl:overflow-hidden">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between xl:mb-3 xl:shrink-0">
        <div>
          <p className="mb-1 text-xs font-medium uppercase tracking-[0.16em] text-primary-400">
            Workspace overview
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-text-tertiary">
            Track your finances, work, and team performance in one place.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="dashboard-segmented inline-flex min-h-10 items-center p-1">
            {(
              [
                'PERSONAL',
                ...(canUseCompany ? ['COMPANY' as const] : []),
              ] as const
            ).map((scope) => (
              <button
                key={scope}
                type="button"
                aria-pressed={financeScope === scope}
                onClick={() => setFinanceScope(scope)}
                className={`min-h-8 rounded-full px-4 text-xs font-medium transition-all ${
                  financeScope === scope
                    ? 'bg-primary-500 text-white shadow-[0_0_20px_rgba(34,197,94,0.2)]'
                    : 'text-text-tertiary hover:text-text-primary'
                }`}
              >
                {scope === 'PERSONAL' ? 'Personal' : 'Company'}
              </button>
            ))}
          </div>
          <Link
            href="/dashboard/documents"
            className="dashboard-outline-button"
          >
            <FileCheck className="h-4 w-4" />
            Documents & Invoices
          </Link>
          <Link href="/dashboard/finance" className="dashboard-outline-button">
            <Plus className="h-4 w-4" />
            New transaction
          </Link>
        </div>
      </div>

      <section aria-labelledby="dashboard-kpis" className="mb-4 xl:mb-3 xl:shrink-0">
        <div className="mb-3 flex items-end justify-between">
          <div>
            <h2 id="dashboard-kpis" className="text-base font-semibold text-text-primary">
              At a glance
            </h2>
            <p className="mt-1 text-xs text-text-tertiary">
              The numbers that need your attention today.
            </p>
          </div>
          <span className="hidden text-xs text-text-tertiary sm:block">Updated live</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Income"
            value={formatCurrency(balance?.income ?? 0)}
            detail="vs. previous month"
            icon={<ArrowUpRight className="h-4 w-4" />}
            delta={incomeDelta}
            trend={chartData.income}
            positive
          />
          <MetricCard
            label="Expenses"
            value={formatCurrency(balance?.expenses ?? 0)}
            detail={`${insights?.upcomingCount ?? 0} upcoming entries`}
            icon={<ArrowDownRight className="h-4 w-4" />}
            delta={expenseDelta}
            trend={chartData.expenses}
          />
          <MetricCard
            label="Active tasks"
            value={String(activeTasks)}
            detail={`${completedTasks} completed`}
            icon={<CheckCircle2 className="h-4 w-4" />}
            trend={[0, 0, completedTasks, totalTasks, completedTasks]}
            positive
          />
          <MetricCard
            label="Landing views"
            value={new Intl.NumberFormat('en-US').format(landingStats?.viewCount ?? 0)}
            detail={landingStats?.lastViewedAt ? `Last view ${timeAgo(String(landingStats.lastViewedAt))}` : 'No views yet'}
            icon={<Eye className="h-4 w-4" />}
            delta={landingDelta}
            trend={(landingStats?.history ?? []).map((point) => point.views)}
            positive
          />
        </div>
      </section>

      <div className="grid gap-4 xl:min-h-0 xl:flex-1 xl:grid-cols-[300px_minmax(0,1fr)] xl:gap-3">
        <div className="flex flex-col gap-4 xl:min-h-0 xl:gap-3">
          <Card className="dashboard-panel overflow-hidden xl:min-h-0 xl:flex-1">
            <CardHeader className="flex-row items-center justify-between p-5 pb-3">
              <CardTitle className="text-base font-medium">
                Current balance
              </CardTitle>
              <Wallet className="h-4 w-4 text-primary-400" />
            </CardHeader>
            <CardContent className="p-5 pt-0">
              <div className="dashboard-balance-card xl:min-h-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/65">
                    {financeScope === 'PERSONAL'
                      ? 'Personal funds'
                      : 'Company funds'}
                  </span>
                  <CircleDollarSign className="h-5 w-5 text-white/80" />
                </div>
                <p className="mt-10 text-3xl font-semibold tabular-nums text-white xl:mt-6">
                  {formatCurrency(balance?.balance ?? 0)}
                </p>
                <p className="mt-1 text-xs text-white/60">
                  {(insights?.savingsRate ?? 0).toFixed(1)}% retained this month
                </p>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-text-tertiary">Income</p>
                  <p className="mt-1 text-sm font-semibold tabular-nums text-primary-400">
                    {formatCurrency(balance?.income ?? 0)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-text-tertiary">Expenses</p>
                  <p className="mt-1 text-sm font-semibold tabular-nums text-red-400">
                    {formatCurrency(balance?.expenses ?? 0)}
                  </p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 border-t border-white/[0.06] pt-4">
                <div className="min-w-0">
                  <p className="text-xs text-text-tertiary">Projected net</p>
                  <p className="mt-1 text-sm font-semibold tabular-nums text-text-primary">
                    {formatCurrency(insights?.projectedBalance ?? 0)}
                  </p>
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-text-tertiary">Top expense</p>
                  <p
                    className="mt-1 truncate text-sm font-semibold text-text-primary"
                    title={insights?.topCategory?.name ?? undefined}
                  >
                    {insights?.topCategory?.name ?? '—'}
                  </p>
                  {insights?.topCategory && (
                    <p className="text-[11px] tabular-nums text-text-tertiary">
                      {formatCurrency(insights.topCategory.amount)}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="dashboard-panel xl:shrink-0">
            <CardHeader className="p-5 pb-3">
              <CardTitle className="text-base font-medium">
                Task completion
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-0">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-3xl font-semibold tabular-nums text-text-primary">
                    {completionRate}%
                  </p>
                  <p className="mt-1 text-xs text-text-tertiary">
                    {completedTasks} of {totalTasks} completed
                  </p>
                </div>
                <Target className="h-5 w-5 text-primary-400" />
              </div>
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary-700 to-primary-400"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
              <Link
                href="/dashboard/tasks"
                className="mt-4 inline-flex min-h-9 items-center text-xs font-medium text-primary-400 hover:text-primary-300"
              >
                Manage tasks <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </CardContent>
          </Card>

          <Card className="dashboard-panel xl:shrink-0">
            <CardHeader className="flex-row items-center justify-between p-5 pb-3">
              <CardTitle className="text-base font-medium">Team</CardTitle>
              <span className="text-xs text-text-tertiary">
                {users?.length ?? 0} members
              </span>
            </CardHeader>
            <CardContent className="flex items-center justify-between p-5 pt-0">
              <div className="flex -space-x-2">
                {team.map((user) => (
                  <div
                    key={user.id}
                    title={user.name ?? user.email}
                    className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#15171a] bg-gradient-to-br from-primary-700 to-primary-400 text-xs font-semibold text-white"
                  >
                    {(user.name ?? user.email).charAt(0).toUpperCase()}
                  </div>
                ))}
                {team.length === 0 && (
                  <Users className="h-5 w-5 text-text-tertiary" />
                )}
              </div>
              <Link
                href="/dashboard/users"
                className="text-xs font-medium text-primary-400 hover:text-primary-300"
              >
                View team
              </Link>
            </CardContent>
          </Card>
        </div>

        <div className="flex min-w-0 flex-col gap-4 xl:grid xl:min-h-0 xl:grid-rows-[minmax(0,0.9fr)_minmax(0,1.1fr)] xl:gap-3">
          <Card className="dashboard-panel overflow-hidden xl:flex xl:min-h-0 xl:flex-col">
            <CardHeader className="flex-row items-start justify-between gap-4 p-4 pb-1">
              <div>
                <CardTitle className="text-base font-medium">
                  Landing page traffic
                </CardTitle>
                <p className="mt-1 text-xs text-text-tertiary">
                  Session visits recorded over the last 30 days
                </p>
              </div>
              <Activity className="h-4 w-4 shrink-0 text-primary-400" />
            </CardHeader>
            <CardContent className="flex min-h-0 flex-1 flex-col p-4 pt-1">
              <div className="flex flex-wrap items-center gap-x-8 gap-y-2 border-b border-white/[0.06] pb-2">
                <InlineTrafficStat label="Today" value={landingStats?.todayViews ?? 0} />
                <InlineTrafficStat label="7 days" value={landingStats?.last7Days ?? 0} />
                <InlineTrafficStat label="30 days" value={landingStats?.last30Days ?? 0} />
                <span className="ml-auto hidden text-[11px] text-text-tertiary sm:block">
                  {landingStats?.previous7Days
                    ? `${Math.round((((landingStats.last7Days ?? 0) - landingStats.previous7Days) / landingStats.previous7Days) * 100)}% vs previous week`
                    : 'Awaiting comparison data'}
                </span>
              </div>
              <div className="mt-2 min-h-[130px] flex-1">
                <LandingTrafficChart data={landingStats?.history ?? []} />
              </div>
            </CardContent>
          </Card>

          <Card className="dashboard-panel flex h-[300px] flex-col overflow-hidden xl:h-auto xl:min-h-0">
            <CardHeader className="flex-row items-center justify-between p-5 pb-1">
              <div>
                <CardTitle className="text-base font-medium">
                  Income overview
                </CardTitle>
                <p className="mt-1 text-xs text-text-tertiary">
                  Six-month financial performance
                </p>
              </div>
              <div className="hidden items-center gap-3 text-xs text-text-tertiary sm:flex">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-primary-500" />
                  Income
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-orange-500" />
                  Expenses
                </span>
              </div>
            </CardHeader>
            <CardContent className="min-h-0 flex-1 p-4 pt-0">
              <PerformanceChart
                incomeData={chartData.income}
                expenseData={chartData.expenses}
                labels={chartData.labels}
              />
            </CardContent>
          </Card>

          <Card className="dashboard-panel overflow-hidden xl:hidden">
            <CardHeader className="flex-row items-center justify-between p-5">
              <div>
                <CardTitle className="text-base font-medium">
                  Transactions
                </CardTitle>
                <p className="mt-1 text-xs text-text-tertiary">
                  Latest activity in this account
                </p>
              </div>
              <Link
                href="/dashboard/finance"
                className="dashboard-small-button"
              >
                View all <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </CardHeader>
            <CardContent className="overflow-x-auto p-0">
              <div className="min-w-[620px]">
                <div className="grid grid-cols-[1.4fr_.8fr_1fr_.8fr] gap-4 bg-white/[0.025] px-5 py-3 text-[11px] font-medium text-text-tertiary">
                  <span>Transaction</span>
                  <span>Type</span>
                  <span>Date</span>
                  <span className="text-right">Amount</span>
                </div>
                {recentTransactions.length === 0 ? (
                  <div className="flex flex-col items-center py-10 text-center">
                    <Wallet className="h-6 w-6 text-text-tertiary" />
                    <p className="mt-2 text-sm text-text-tertiary">
                      No transactions yet
                    </p>
                  </div>
                ) : (
                  recentTransactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="grid min-h-12 grid-cols-[1.4fr_.8fr_1fr_.8fr] items-center gap-4 border-t border-white/[0.045] px-5 py-2.5 text-xs"
                    >
                      <span className="truncate font-medium text-text-primary">
                        {transaction.description ||
                          transaction.category?.name ||
                          'Transaction'}
                      </span>
                      <span className="text-text-tertiary">
                        {transaction.type.charAt(0) +
                          transaction.type.slice(1).toLowerCase()}
                      </span>
                      <span className="text-text-tertiary">
                        {new Date(transaction.date).toLocaleDateString(
                          'en-PH',
                          { month: 'short', day: 'numeric', year: 'numeric' },
                        )}
                      </span>
                      <span
                        className={`text-right font-semibold tabular-nums ${transaction.type === 'INCOME' ? 'text-primary-400' : 'text-red-400'}`}
                      >
                        {transaction.type === 'INCOME' ? '+' : '-'}
                        {formatCurrency(transaction.amount)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="dashboard-panel overflow-hidden xl:hidden">
            <CardHeader className="flex-row items-center justify-between p-5 pb-3">
              <CardTitle className="text-base font-medium">
                Recent updates
              </CardTitle>
              <GitCommit className="h-4 w-4 text-text-tertiary" />
            </CardHeader>
            <CardContent className="p-0">
              {updatesLoading ? (
                <div className="space-y-2 p-5">
                  {[0, 1, 2].map((item) => (
                    <div
                      key={item}
                      className="h-10 animate-pulse rounded-lg bg-white/[0.035]"
                    />
                  ))}
                </div>
              ) : commits.length === 0 ? (
                <p className="p-5 text-sm text-text-tertiary">
                  No recent updates.
                </p>
              ) : (
                commits.map((commit) => (
                  <a
                    key={commit.sha}
                    href={commit.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex min-h-12 items-center gap-3 border-t border-white/[0.045] px-5 py-2.5 hover:bg-white/[0.025]"
                  >
                    <GitCommit className="h-4 w-4 shrink-0 text-primary-500" />
                    <span className="min-w-0 flex-1 truncate text-sm text-text-secondary">
                      {commit.commit.message.split('\n')[0]}
                    </span>
                    <span className="text-xs tabular-nums text-text-tertiary">
                      {timeAgo(commit.commit.author.date)}
                    </span>
                    <ExternalLink className="h-3.5 w-3.5 text-text-tertiary group-hover:text-text-primary" />
                  </a>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function InlineTrafficStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="text-xl font-semibold tabular-nums text-text-primary">
        {new Intl.NumberFormat('en-US').format(value)}
      </span>
      <span className="text-[11px] text-text-tertiary">{label}</span>
    </div>
  )
}

function MetricCard({
  label,
  value,
  detail,
  icon,
  delta,
  trend = [],
  positive = false,
}: {
  label: string
  value: string
  detail: string
  icon: React.ReactNode
  delta?: number | null
  trend?: number[]
  positive?: boolean
}) {
  return (
    <Card className="dashboard-panel">
      <CardContent className="p-5 xl:p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-text-tertiary">{label}</p>
          <span
            className={`flex h-8 w-8 items-center justify-center rounded-full ${positive ? 'bg-primary-500/10 text-primary-400' : 'bg-red-500/10 text-red-400'}`}
          >
            {icon}
          </span>
        </div>
        <div className="mt-4 flex items-end justify-between gap-3 xl:mt-2">
          <div className="min-w-0">
            <p className="truncate text-2xl font-semibold tabular-nums text-text-primary">
              {value}
            </p>
            <p className="mt-1 flex items-center gap-1 text-xs text-text-tertiary">
              {delta == null ? (
                <Clock3 className="h-3 w-3" />
              ) : delta >= 0 ? (
                <ArrowUpRight className="h-3 w-3 text-primary-400" />
              ) : (
                <ArrowDownRight className="h-3 w-3 text-red-400" />
              )}
              {delta == null ? detail : `${Math.abs(delta).toFixed(1)}% ${detail}`}
            </p>
          </div>
          <Sparkline
            data={trend}
            color={positive ? '#22c55e' : '#f87171'}
            className="h-8 w-20 shrink-0 opacity-80"
          />
        </div>
      </CardContent>
    </Card>
  )
}
