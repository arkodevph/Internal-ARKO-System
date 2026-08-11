'use client'

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { motion, useReducedMotion } from 'motion/react'

type Phase = 'idle' | 'covering' | 'covered' | 'revealing'

const PageTransitionContext = createContext<((href: string) => void) | null>(null)

export function useMarketingPageTransition() {
  const navigate = useContext(PageTransitionContext)

  if (!navigate) {
    throw new Error(
      'useMarketingPageTransition must be used inside MarketingPageTransition',
    )
  }

  return navigate
}

export default function MarketingPageTransition({
  children,
}: Readonly<{ children: ReactNode }>) {
  const router = useRouter()
  const pathname = usePathname()
  const reduceMotion = useReducedMotion()
  const [phase, setPhase] = useState<Phase>('idle')
  const destinationRef = useRef<string | null>(null)
  const sourcePathRef = useRef(pathname)
  const revealTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const navigate = useCallback(
    (href: string) => {
      if (destinationRef.current) return

      if (reduceMotion) {
        router.push(href)
        return
      }

      destinationRef.current = href
      sourcePathRef.current = pathname
      setPhase('covering')
    },
    [pathname, reduceMotion, router],
  )

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return
      }

      const target = event.target
      if (!(target instanceof Element)) return

      const anchor = target.closest('a')
      if (
        !anchor ||
        anchor.target === '_blank' ||
        anchor.hasAttribute('download')
      ) {
        return
      }

      const url = new URL(anchor.href, window.location.href)
      if (url.origin !== window.location.origin) return

      const current = new URL(window.location.href)
      if (
        url.pathname === current.pathname &&
        url.search === current.search
      ) {
        return
      }

      event.preventDefault()
      event.stopPropagation()
      navigate(`${url.pathname}${url.search}${url.hash}`)
    }

    document.addEventListener('click', handleClick, true)
    return () => document.removeEventListener('click', handleClick, true)
  }, [navigate])

  useEffect(() => {
    if (!destinationRef.current || pathname === sourcePathRef.current) return

    let secondFrame = 0
    const firstFrame = requestAnimationFrame(() => {
      secondFrame = requestAnimationFrame(() => setPhase('revealing'))
    })

    return () => {
      cancelAnimationFrame(firstFrame)
      cancelAnimationFrame(secondFrame)
    }
  }, [pathname])

  useEffect(
    () => () => {
      if (revealTimerRef.current) clearTimeout(revealTimerRef.current)
    },
    [],
  )

  const handleAnimationComplete = () => {
    if (phase === 'covering') {
      setPhase('covered')
      router.push(destinationRef.current ?? '/')

      revealTimerRef.current = setTimeout(() => {
        setPhase('revealing')
      }, 800)
      return
    }

    if (phase === 'revealing') {
      if (revealTimerRef.current) clearTimeout(revealTimerRef.current)
      revealTimerRef.current = null
      destinationRef.current = null
      setPhase('idle')
    }
  }

  const curtainX =
    phase === 'covering' || phase === 'covered'
      ? '0%'
      : phase === 'revealing'
        ? '115%'
        : '-115%'

  return (
    <PageTransitionContext.Provider value={navigate}>
      {children}
      <motion.div
        aria-hidden="true"
        initial={false}
        animate={{ x: curtainX, skewX: -12 }}
        onAnimationComplete={handleAnimationComplete}
        transition={{ duration: 0.22, ease: [0.76, 0, 0.24, 1] }}
        className={`fixed inset-y-0 -left-[15vw] z-[9999] w-[130vw] origin-center bg-acid ${phase === 'idle' ? 'pointer-events-none' : 'pointer-events-auto will-change-transform'}`}
      >
        <div className="h-full skew-x-[12deg]" />
      </motion.div>
    </PageTransitionContext.Provider>
  )
}
