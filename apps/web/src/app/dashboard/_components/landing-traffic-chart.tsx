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

function emptyTrafficSeries() {
  return Array.from({ length: 30 }, (_, index) => {
    const date = new Date()
    date.setUTCDate(date.getUTCDate() - (29 - index))
    return { date: date.toISOString().slice(0, 10), views: 0 }
  })
}

export function LandingTrafficChart({ data }: { data: TrafficPoint[] }) {
  const points = data.length > 1 ? data : emptyTrafficSeries()
  const maxViews = Math.max(...points.map((point) => point.views), 1)
  const total = points.reduce((sum, point) => sum + point.views, 0)
  const width = 760
  const height = 150
  const left = 34
  const right = 8
  const top = 8
  const bottom = 24
  const chartWidth = width - left - right
  const chartHeight = height - top - bottom
  const coordinates = points.map((point, index) => ({
    x: left + (index / Math.max(points.length - 1, 1)) * chartWidth,
    y: top + chartHeight - (point.views / maxViews) * chartHeight,
    point,
  }))
  const linePath = coordinates
    .map(({ x, y }, index) => `${index === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`)
    .join(' ')
  const lastCoordinate = coordinates[coordinates.length - 1]
  const areaPath = `${linePath} L${lastCoordinate?.x ?? left},${top + chartHeight} L${left},${top + chartHeight} Z`
  const labelIndexes = [0, Math.floor((points.length - 1) / 2), points.length - 1]

  return (
    <div className="h-full min-h-0 w-full">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="h-full w-full"
        role="img"
        aria-label={`Landing page visits over the last 30 days. ${total} total visits.`}
      >
        <defs>
          <linearGradient id="traffic-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22c55e" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[1, 0.5, 0].map((fraction) => {
          const y = top + chartHeight - chartHeight * fraction
          return (
            <g key={fraction}>
              <line x1={left} y1={y} x2={width - right} y2={y} className="stroke-white/[0.07]" />
              <text x={left - 8} y={y + 3} textAnchor="end" className="fill-text-tertiary text-[9px]">
                {Math.round(maxViews * fraction)}
              </text>
            </g>
          )
        })}
        <path d={areaPath} fill="url(#traffic-area)" />
        <path d={linePath} fill="none" stroke="#22c55e" strokeWidth="2.2" vectorEffect="non-scaling-stroke" />
        {coordinates.map(({ x, y, point }, index) => (
          <circle key={point.date} cx={x} cy={y} r={index === coordinates.length - 1 ? 3 : 1.5} fill="#22c55e">
            <title>{shortDate(point.date)}: {point.views} visits</title>
          </circle>
        ))}
        {labelIndexes.map((index) => (
          <text
            key={points[index].date}
            x={coordinates[index].x}
            y={height - 5}
            textAnchor={index === 0 ? 'start' : index === points.length - 1 ? 'end' : 'middle'}
            className="fill-text-tertiary text-[9px]"
          >
            {shortDate(points[index].date)}
          </text>
        ))}
      </svg>
      <table className="sr-only">
        <caption>Landing page visits by day for the last 30 days</caption>
        <tbody>{points.map((point) => <tr key={point.date}><td>{shortDate(point.date)}</td><td>{point.views}</td></tr>)}</tbody>
      </table>
    </div>
  )
}
