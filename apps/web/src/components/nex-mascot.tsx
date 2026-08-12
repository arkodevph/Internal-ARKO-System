import { Bot, BrainCircuit, Orbit, Sparkles } from 'lucide-react'
import type { AssistantIdentity } from '../lib/use-assistant-identity'

export const NEX_ICON_OPTIONS = [
  { value: 'BOT', label: 'Core', icon: Bot },
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
      <span
        className="absolute inset-[8%] rotate-45 border bg-[#090b0a] shadow-[0_0_18px_currentColor]"
        style={{ borderColor: accentColor }}
      />
      <svg viewBox="0 0 32 32" fill="none" className="relative overflow-visible" aria-hidden="true">
        <path
          d="M8 22V10l8 9V10h8v12"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="square"
          strokeLinejoin="miter"
        />
        <path d="M5 6h5M22 26h5" stroke="currentColor" strokeWidth="1.2" />
        <circle cx="7" cy="7" r="1.5" fill="currentColor" />
        <circle cx="25" cy="25" r="1.5" fill="currentColor" />
        {iconStyle === 'ORBIT' && (
          <ellipse cx="16" cy="16" rx="14" ry="7" stroke="currentColor" strokeWidth="1" opacity=".65" />
        )}
        {iconStyle === 'SPARK' && (
          <path d="M25 5v5M22.5 7.5h5" stroke="currentColor" strokeWidth="1.4" />
        )}
        {iconStyle === 'BRAIN' && (
          <path d="M12 5h8M12 27h8" stroke="currentColor" strokeWidth="1" opacity=".75" />
        )}
      </svg>
      <span className="absolute right-0 top-0 h-1.5 w-1.5 bg-white shadow-[0_0_8px_currentColor]" />
    </span>
  )
}
