type TrafficPoint = {
  date: string
  views: number
}

function shortDate(date: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${date}T00:00:00Z`))
}

export function LandingTrafficChart({ data }: { data: TrafficPoint[] }) {
  const maxViews = Math.max(...data.map((point) => point.views), 1)
  const total = data.reduce((sum, point) => sum + point.views, 0)
  const peak = data.reduce<TrafficPoint | null>(
    (highest, point) =>
      !highest || point.views > highest.views ? point : highest,
    null,
  )

  if (total === 0) {
    return (
      <div className="flex h-full min-h-40 items-center justify-center text-center">
        <div>
          <p className="text-sm font-medium text-text-secondary">
            No visits yet
          </p>
          <p className="mt-1 text-xs text-text-tertiary">
            Traffic will appear here after someone visits the landing page.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full min-h-40 w-full">
      <div
        className="relative h-full pb-6 pl-8 pt-2"
        role="img"
        aria-label={`Landing page visits over the last 30 days. ${total} total visits. Peak was ${peak?.views ?? 0} on ${peak ? shortDate(peak.date) : 'no date'}.`}
      >
        <div className="pointer-events-none absolute bottom-6 left-8 right-0 top-2 flex flex-col justify-between">
          {[1, 0.5, 0].map((fraction) => (
            <div
              key={fraction}
              className="relative border-t border-white/[0.07]"
            >
              <span className="absolute right-full top-0 mr-2 -translate-y-1/2 text-[9px] tabular-nums text-text-tertiary">
                {Math.round(maxViews * fraction)}
              </span>
            </div>
          ))}
        </div>
        <div className="flex h-full items-end gap-px">
          {data.map((point) => (
            <div
              key={point.date}
              className="flex h-full min-w-0 flex-1 items-end"
              title={`${shortDate(point.date)}: ${point.views} visit${point.views === 1 ? '' : 's'}`}
            >
              <span
                className="block w-full rounded-t-sm bg-primary-500"
                style={{
                  height: `${(point.views / maxViews) * 100}%`,
                  minHeight: point.views > 0 ? 2 : 0,
                }}
              />
            </div>
          ))}
        </div>
        <div className="absolute bottom-0 left-8 right-0 flex justify-between text-[9px] text-text-tertiary">
          <span>{data[0] ? shortDate(data[0].date) : ''}</span>
          <span>{data[14] ? shortDate(data[14].date) : ''}</span>
          <span>{data[29] ? shortDate(data[29].date) : ''}</span>
        </div>
      </div>
      <table className="sr-only">
        <caption>Landing page visits by day for the last 30 days</caption>
        <thead>
          <tr>
            <th>Date</th>
            <th>Visits</th>
          </tr>
        </thead>
        <tbody>
          {data.map((point) => (
            <tr key={point.date}>
              <td>{shortDate(point.date)}</td>
              <td>{point.views}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
