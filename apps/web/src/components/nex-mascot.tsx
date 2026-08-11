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
}: Pick<AssistantIdentity, 'iconStyle' | 'accentColor'> & {
  size?: 'sm' | 'md' | 'lg'
}) {
  const selected =
    NEX_ICON_OPTIONS.find((option) => option.value === iconStyle) ??
    NEX_ICON_OPTIONS[0]
  const Icon = selected.icon
  const sizes = {
    sm: 'h-8 w-8 rounded-lg [&_svg]:h-4 [&_svg]:w-4',
    md: 'h-10 w-10 rounded-xl [&_svg]:h-5 [&_svg]:w-5',
    lg: 'h-20 w-20 rounded-3xl [&_svg]:h-9 [&_svg]:w-9',
  }

  return (
    <span
      className={`relative grid shrink-0 place-items-center text-[#07110b] shadow-[inset_0_1px_0_rgba(255,255,255,0.3)] ${sizes[size]}`}
      style={{ backgroundColor: accentColor }}
      aria-hidden="true"
    >
      <Icon strokeWidth={2} />
      <span className="absolute right-[12%] top-[12%] h-1.5 w-1.5 rounded-full bg-white/80" />
    </span>
  )
}
