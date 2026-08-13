'use client'

import { useEffect, useState } from 'react'

export function AssistantThinking({ label = 'Thinking' }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-text-tertiary" role="status" aria-label={`${label}…`}>
      <span>{label}</span>
      <span className="flex items-center gap-1" aria-hidden="true">
        {[0, 1, 2].map((index) => (
          <span
            key={index}
            className="h-1.5 w-1.5 animate-bounce rounded-full bg-current motion-reduce:animate-none"
            style={{ animationDelay: `${index * 120}ms` }}
          />
        ))}
      </span>
    </div>
  )
}

export function ProgressiveResponse({
  text,
  animate,
}: {
  text: string
  animate: boolean
}) {
  const [visibleText, setVisibleText] = useState(animate ? '' : text)

  useEffect(() => {
    if (!animate || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setVisibleText(text)
      return
    }

    const words = text.split(/(\s+)/)
    let index = 0
    setVisibleText('')
    const timer = window.setInterval(() => {
      index += 1
      setVisibleText(words.slice(0, index).join(''))
      if (index >= words.length) window.clearInterval(timer)
    }, 24)
    return () => window.clearInterval(timer)
  }, [animate, text])

  return <>{visibleText}</>
}
