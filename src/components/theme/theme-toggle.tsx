'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import * as React from 'react'
import { flushSync } from 'react-dom'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ThemeToggleProps {
  className?: string
  showLabel?: boolean
}

type ViewTransitionLike = {
  ready: Promise<void>
  finished?: Promise<void>
}

type DocumentWithViewTransition = Document & {
  startViewTransition?: (
    updateCallback: () => void | Promise<void>
  ) => ViewTransitionLike
}

export function ThemeToggle({
  className,
  showLabel = false,
}: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  const buttonRef = React.useRef<HTMLButtonElement | null>(null)
  const pointerRef = React.useRef<{ x: number; y: number } | null>(null)
  const revealCommitTimeoutRef = React.useRef<number | null>(null)
  const revealCleanupTimeoutRef = React.useRef<number | null>(null)
  const nativeTransitionCleanupTimeoutRef = React.useRef<number | null>(null)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const clearRevealTimeouts = () => {
    if (revealCommitTimeoutRef.current) {
      window.clearTimeout(revealCommitTimeoutRef.current)
      revealCommitTimeoutRef.current = null
    }
    if (revealCleanupTimeoutRef.current) {
      window.clearTimeout(revealCleanupTimeoutRef.current)
      revealCleanupTimeoutRef.current = null
    }
    if (nativeTransitionCleanupTimeoutRef.current) {
      window.clearTimeout(nativeTransitionCleanupTimeoutRef.current)
      nativeTransitionCleanupTimeoutRef.current = null
    }
  }

  React.useEffect(() => {
    return () => {
      clearRevealTimeouts()
      document.documentElement.classList.remove('theme-reveal-active')
      document.documentElement.classList.remove('theme-view-transition-active')
    }
  }, [])

  const runCircularRevealTransition = (
    nextTheme: 'light' | 'dark',
    origin?: { x: number; y: number }
  ) => {
    const root = document.documentElement

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setTheme(nextTheme)
      return
    }

    const rect = buttonRef.current?.getBoundingClientRect()
    const x =
      origin?.x ?? (rect ? rect.left + rect.width / 2 : window.innerWidth - 48)
    const y = origin?.y ?? (rect ? rect.top + rect.height / 2 : 32)

    const documentWithTransition = document as DocumentWithViewTransition

    if (documentWithTransition.startViewTransition) {
      clearRevealTimeouts()
      root.classList.remove('theme-reveal-active')
      root.classList.add('theme-view-transition-active')

      const clearNativeTransitionClass = () => {
        root.classList.remove('theme-view-transition-active')
      }

      const transition = documentWithTransition.startViewTransition(() => {
        flushSync(() => setTheme(nextTheme))
      })

      nativeTransitionCleanupTimeoutRef.current = window.setTimeout(() => {
        clearNativeTransitionClass()
      }, 1000)
      ;(transition.finished ?? transition.ready)
        .catch(() => undefined)
        .finally(() => {
          clearNativeTransitionClass()
          if (nativeTransitionCleanupTimeoutRef.current) {
            window.clearTimeout(nativeTransitionCleanupTimeoutRef.current)
            nativeTransitionCleanupTimeoutRef.current = null
          }
        })

      transition.ready
        .then(() => {
          const maxX = Math.max(x, window.innerWidth - x)
          const maxY = Math.max(y, window.innerHeight - y)
          const endRadius = Math.hypot(maxX, maxY)

          root.animate(
            {
              clipPath: [
                `circle(0px at ${x}px ${y}px)`,
                `circle(${endRadius}px at ${x}px ${y}px)`,
              ],
            },
            {
              duration: 750,
              easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
              pseudoElement: '::view-transition-new(root)',
            } as KeyframeAnimationOptions & { pseudoElement: string }
          )
        })
        .catch(() => {
          clearNativeTransitionClass()
          setTheme(nextTheme)
        })

      return
    }

    // Fallback para navegadores sem View Transitions API
    root.style.setProperty('--theme-reveal-x', `${x}px`)
    root.style.setProperty('--theme-reveal-y', `${y}px`)
    root.style.setProperty(
      '--theme-reveal-color',
      nextTheme === 'dark' ? '#0f1011' : '#fafaf8'
    )

    clearRevealTimeouts()
    root.classList.remove('theme-reveal-active')
    root.classList.remove('theme-view-transition-active')

    void root.offsetWidth
    root.classList.add('theme-reveal-active')

    revealCommitTimeoutRef.current = window.setTimeout(() => {
      setTheme(nextTheme)
    }, 240)

    revealCleanupTimeoutRef.current = window.setTimeout(() => {
      root.classList.remove('theme-reveal-active')
    }, 700)
  }

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size={showLabel ? 'sm' : 'icon-sm'}
        className={cn(
          'text-muted-foreground hover:text-foreground transition-colors',
          showLabel && 'gap-2 font-mono text-xs',
          className
        )}
        aria-label="Alternar tema claro e escuro"
      >
        <span className="size-4 shrink-0" />
        {showLabel && <span>Tema</span>}
      </Button>
    )
  }

  const isDark = resolvedTheme === 'dark'

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    pointerRef.current = { x: e.clientX, y: e.clientY }
    const nextTheme = isDark ? 'light' : 'dark'
    const origin = pointerRef.current ?? undefined
    pointerRef.current = null
    runCircularRevealTransition(nextTheme, origin)
  }

  return (
    <Button
      ref={buttonRef}
      variant="ghost"
      size={showLabel ? 'sm' : 'icon-sm'}
      onClick={handleClick}
      className={cn(
        'text-muted-foreground hover:text-foreground cursor-pointer transition-colors',
        showLabel &&
          'justify-start gap-2 px-0 font-mono text-xs hover:bg-transparent',
        className
      )}
      aria-label={isDark ? 'Ativar modo claro' : 'Ativar modo escuro'}
    >
      {isDark ? (
        <Sun className="text-accent-editorial size-4 scale-100 rotate-0 transition-transform duration-300" />
      ) : (
        <Moon className="text-muted-foreground size-4 scale-100 rotate-0 transition-transform duration-300" />
      )}
      {showLabel && (
        <span className="font-mono text-xs">
          {isDark ? '[ modo escuro ]' : '[ modo claro ]'}
        </span>
      )}
    </Button>
  )
}
