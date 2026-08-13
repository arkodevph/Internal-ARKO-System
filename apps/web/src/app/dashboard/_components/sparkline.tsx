import { memo } from 'react'
const Sparkline = memo(function Sparkline({
  data,
  color = '#22c55e',
  className,
}: {
  data: number[]
  color?: string
  className?: string
}) {
  const points = data.filter((value) => Number.isFinite(value))
  if (points.length < 2) return null

  const w = 100
  const h = 28
  const pad = 2
  const max = Math.max(...points)
  const min = Math.min(...points)
  const range = max - min || 1
  const xStep = (w - pad * 2) / (points.length - 1)
  const coords = points.map((value, index) => ({
    x: pad + index * xStep,
    y: h - pad - ((value - min) / range) * (h - pad * 2),
  }))

  const line = coords
    .map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x.toFixed(1)},${point.y.toFixed(1)}`)
    .join('')
  const last = coords[coords.length - 1]
  const area = `${line}L${last.x.toFixed(1)},${h}L${coords[0].x.toFixed(1)},${h}Z`
  const gradientId = `spark-${color.replace('#', '')}`

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradientId})`} />
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
})

export { Sparkline }
