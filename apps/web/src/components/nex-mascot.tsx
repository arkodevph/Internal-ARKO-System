import { BrainCircuit, Orbit, Sparkles } from 'lucide-react'
import type { AssistantIdentity } from '../lib/use-assistant-identity'

export function NexMark({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" fill="none" className={className} aria-hidden="true">
      <path d="M2 9h7l5 6M2 31h7l5-6M38 9h-7l-5 6M38 31h-7l-5-6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M20 3 34 20 20 37 6 20 20 3Z" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="20" cy="20" r="8" fill="currentColor" />
      <circle cx="17" cy="19" r="1.2" className="fill-bg-sidebar" />
      <circle cx="23" cy="19" r="1.2" className="fill-bg-sidebar" />
      <path d="M16.5 23c2.2 1.8 4.8 1.8 7 0" className="stroke-bg-sidebar" strokeWidth="1.2" strokeLinecap="round" />
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
        <path d="M1 9h8l5 6M1 31h8l5-6M39 9h-8l-5 6M39 31h-8l-5-6" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" opacity=".8" />
        <path d="M20 3 34 20 20 37 6 20 20 3Z" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="20" cy="20" r="8.5" fill="#090b0a" stroke="currentColor" strokeWidth="1.4" />
        <circle cx="17" cy="18.5" r="1.15" fill="currentColor" />
        <circle cx="23" cy="18.5" r="1.15" fill="currentColor" />
        <path d="M16.5 22.5c2.2 2 4.8 2 7 0" stroke="currentColor" strokeWidth="1.15" strokeLinecap="round" />
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
