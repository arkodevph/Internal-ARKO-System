import { redirect } from 'next/navigation'
import { prisma } from '@arko/db'
import { auth } from '../../../lib/auth'

const STATUS_STYLE: Record<string, string> = {
  PROPOSED: 'border-amber-500/25 bg-amber-500/10 text-amber-500',
  COMPLETED: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-500',
  FAILED: 'border-red-500/25 bg-red-500/10 text-red-500',
  REJECTED: 'border-red-500/25 bg-red-500/10 text-red-500',
}

export default async function AssistantActivityPage() {
  const session = await auth()
  if (session?.user?.role !== 'ADMIN') redirect('/dashboard')

  const activities = await prisma.assistantActivity.findMany({
    orderBy: { createdAt: 'desc' },
    take: 200,
    select: {
      id: true,
      action: true,
      summary: true,
      status: true,
      details: true,
      createdAt: true,
      user: { select: { name: true, email: true } },
    },
  })

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-16">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-500">Admin oversight</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-text-primary">AI activity log</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-text-secondary">
          Review NEX proposals, confirmations, permission rejections, and failures across the workspace.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border-subtle bg-card">
        {activities.length ? (
          <div className="divide-y divide-border-subtle">
            {activities.map((activity) => (
              <article key={activity.id} className="grid gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center md:px-5">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-semibold uppercase tracking-wider text-text-primary">
                      {activity.action.replace(/_/g, ' ')}
                    </span>
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${STATUS_STYLE[activity.status] ?? 'border-border-subtle text-text-tertiary'}`}>
                      {activity.status}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-text-secondary">{activity.summary}</p>
                  <p className="mt-2 text-xs text-text-tertiary">
                    {activity.status === 'PROPOSED' ? 'Requested by' : 'Handled by'}{' '}
                    {activity.user.name ?? activity.user.email} · {activity.user.email}
                  </p>
                  <details className="mt-3 text-xs text-text-tertiary">
                    <summary className="cursor-pointer select-none font-medium text-text-secondary">Review change details</summary>
                    <pre className="mt-2 max-h-56 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-background p-3 font-mono text-[11px] leading-relaxed">
                      {JSON.stringify(activity.details, null, 2)}
                    </pre>
                  </details>
                </div>
                <time className="text-xs tabular-nums text-text-tertiary" dateTime={activity.createdAt.toISOString()}>
                  {activity.createdAt.toLocaleString('en-PH', { timeZone: 'Asia/Manila' })}
                </time>
              </article>
            ))}
          </div>
        ) : (
          <div className="px-6 py-20 text-center text-sm text-text-tertiary">
            NEX activity will appear here after users propose or confirm actions.
          </div>
        )}
      </div>
    </div>
  )
}
