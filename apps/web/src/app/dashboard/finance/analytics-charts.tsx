'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@arko/ui'
import { formatCurrency } from '@arko/finance'
import { PerformanceChart } from '../_components/performance-chart'

type AnalyticsTransaction = {
  id: string
  amount: number
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER'
  date: Date | string
  category?: { name: string } | null
}

export function AnalyticsCharts({
  transactions,
}: {
  transactions: AnalyticsTransaction[]
}) {
  const data = useMemo(() => {
    const months: Record<string, { income: number; expenses: number }> = {}
    const now = new Date()
    for (let index = 5; index >= 0; index--) {
      const date = new Date(now.getFullYear(), now.getMonth() - index, 1)
      months[date.toLocaleDateString('en-US', { month: 'short' })] = {
        income: 0,
        expenses: 0,
      }
    }
    for (const transaction of transactions) {
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

  const expenseCategories = useMemo(() => {
    const totals = new Map<string, number>()
    for (const transaction of transactions) {
      if (transaction.type !== 'EXPENSE') continue
      const category = transaction.category?.name ?? 'Other'
      totals.set(category, (totals.get(category) ?? 0) + transaction.amount)
    }
    return [...totals.entries()]
      .map(([name, amount]) => ({ name, amount }))
      .sort((left, right) => right.amount - left.amount)
      .slice(0, 5)
  }, [transactions])
  const maxCategoryAmount = Math.max(
    ...expenseCategories.map((category) => category.amount),
    1,
  )

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="analytics-panel finance-panel flex min-h-[300px] flex-col overflow-hidden">
        <CardHeader className="p-5 pb-2">
          <div>
            <CardTitle className="text-sm font-medium">Spending</CardTitle>
            <p className="mt-1 text-xs text-text-tertiary">
              Your highest expense categories
            </p>
          </div>
        </CardHeader>
        <CardContent className="flex min-h-0 flex-1 flex-col justify-center p-5 pt-3">
          {expenseCategories.length === 0 ? (
            <div className="flex h-full min-h-48 items-center justify-center rounded-xl border border-dashed border-white/10 bg-white/[0.015] px-6 text-center text-sm text-text-tertiary">
              Add an expense to see where your money goes.
            </div>
          ) : (
            <div
              className="space-y-4"
              role="img"
              aria-label="Expenses by category"
            >
              {expenseCategories.map((category, index) => (
                <div key={category.name}>
                  <div className="mb-2 flex items-center justify-between gap-4 text-xs">
                    <span className="truncate font-medium text-text-secondary">
                      {category.name}
                    </span>
                    <span className="shrink-0 tabular-nums text-text-primary">
                      {formatCurrency(category.amount)}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
                    <div
                      className={`h-full rounded-full ${['bg-primary-400', 'bg-primary-500', 'bg-primary-600', 'bg-primary-700', 'bg-primary-800'][index]}`}
                      style={{
                        width: `${Math.max(5, (category.amount / maxCategoryAmount) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="analytics-panel finance-panel flex h-[300px] flex-col overflow-hidden">
        <CardHeader className="flex-row items-start justify-between p-5 pb-2">
          <div>
            <CardTitle className="text-sm font-medium">
              Financial activity
            </CardTitle>
            <p className="mt-1 text-xs text-text-tertiary">
              Income and expense movement
            </p>
          </div>
          <div className="flex gap-3 text-[10px] text-text-tertiary">
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-primary-500" />
              Income
            </span>
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
              Expenses
            </span>
          </div>
        </CardHeader>
        <CardContent className="min-h-0 flex-1 p-4 pt-0">
          <PerformanceChart
            incomeData={data.income}
            expenseData={data.expenses}
            labels={data.labels}
          />
        </CardContent>
      </Card>
    </div>
  )
}
