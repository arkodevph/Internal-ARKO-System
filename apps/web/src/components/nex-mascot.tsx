import { BrainCircuit, Orbit, Sparkles } from 'lucide-react'
import type { AssistantIdentity } from '../lib/use-assistant-identity'

export function NexMark({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" fill="none" className={className} aria-hidden="true">
      <path d="M2 20 8 8l7 5 5-10 5 10 7-5 6 12-6 12-7-5-5 10-5-10-7 5L2 20Z" stroke="currentColor" strokeWidth="1.65" strokeLinejoin="round" />
      <path d="M7 20c3.5-5 7.8-7.5 13-7.5S29.5 15 33 20c-3.5 5-7.8 7.5-13 7.5S10.5 25 7 20Z" fill="currentColor" />
      <path d="M11 20c2.7-2.7 5.7-4 9-4s6.3 1.3 9 4c-2.7 2.7-5.7 4-9 4s-6.3-1.3-9-4Z" className="fill-bg-sidebar" />
      <path d="m20 15 3.6 5-3.6 5-3.6-5 3.6-5Z" fill="currentColor" />
      <circle cx="20" cy="20" r="1.45" className="fill-bg-sidebar" />
    </svg>
  )
}

export const NEX_ICON_OPTIONS = [
  { value: 'BOT', label: 'Nexus', icon: NexMark },
  { value: 'SPARK', label: 'Spark', icon: Sparkles },
  { value: 'ORBIT', label: 'Orbit', icon: Orbit },
  { value: 'BRAIN', label: 'Neural', icon: BrainCircuit },
] as const

export const NEX_COLOR_OPTIONS = [
  { value: '#22C55E', label: 'Signal green' },
  { value: '#22D3EE', label: 'Electric cyan' },
  { value: '#A78BFA', label: 'Neural violet' },
  { value: '#FBBF24', label: 'Solar amber' },
] as const

export function NexMascot({
  iconStyle,
  accentColor,
  size = 'md',
}: Pick<AssistantIdentity, 'iconStyle'> & {
  accentColor: string
  size?: 'sm' | 'md' | 'lg'
}) {
  const sizes = {
    sm: 'h-8 w-8 [&_svg]:h-6 [&_svg]:w-6',
    md: 'h-10 w-10 [&_svg]:h-8 [&_svg]:w-8',
    lg: 'h-20 w-20 [&_svg]:h-14 [&_svg]:w-14',
  }

  return (
    <span
      className={`relative grid shrink-0 place-items-center ${sizes[size]}`}
      style={{ color: accentColor }}
      aria-hidden="true"
    >
      <span className="absolute inset-[5%] rotate-45 border border-current/45 bg-[#090b0a]/90 shadow-[0_0_18px_currentColor]" />
      <svg viewBox="0 0 40 40" fill="none" className="relative overflow-visible" aria-hidden="true">
        <path d="M2 20 8 8l7 5 5-10 5 10 7-5 6 12-6 12-7-5-5 10-5-10-7 5L2 20Z" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round" opacity=".85" />
        <path d="M7 20c3.5-5 7.8-7.5 13-7.5S29.5 15 33 20c-3.5 5-7.8 7.5-13 7.5S10.5 25 7 20Z" fill="#090b0a" stroke="currentColor" strokeWidth="1.4" />
        <path d="M11 20c2.7-2.7 5.7-4 9-4s6.3 1.3 9 4c-2.7 2.7-5.7 4-9 4s-6.3-1.3-9-4Z" fill="currentColor" opacity=".22" />
        <path d="m20 14.5 4 5.5-4 5.5-4-5.5 4-5.5Z" fill="currentColor" />
        <circle cx="20" cy="20" r="1.6" fill="#090b0a" />
        {iconStyle === 'ORBIT' && (
          <ellipse cx="20" cy="20" rx="18" ry="10" stroke="currentColor" strokeWidth=".8" opacity=".6" />
        )}
        {iconStyle === 'SPARK' && (
          <path d="M31 3v5M28.5 5.5h5" stroke="currentColor" strokeWidth="1.4" />
        )}
        {iconStyle === 'BRAIN' && (
          <path d="M14 3h12M14 37h12" stroke="currentColor" strokeWidth="1" opacity=".75" />
        )}
      </svg>
      <span className="absolute right-0 top-0 h-1.5 w-1.5 bg-white shadow-[0_0_8px_currentColor]" />
    </span>
  )
}
