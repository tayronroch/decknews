'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { Suspense, useCallback, useEffect, useRef, useState } from 'react'

function hasModifierKey(event: MouseEvent): boolean {
  return Boolean(
    event.metaKey || event.ctrlKey || event.shiftKey || event.altKey
  )
}

function isEligibleAnchor(
  anchor: HTMLAnchorElement | null | undefined
): anchor is HTMLAnchorElement {
  if (!anchor) return false
  const href = anchor.getAttribute('href')
  if (!href || href.startsWith('#') || href.startsWith('javascript:'))
    return false
  if (anchor.target && anchor.target !== '_self') return false
  if (anchor.hasAttribute('download')) return false
  return true
}

function isInternalNavigation(href: string): boolean {
  try {
    const targetUrl = new URL(href, window.location.href)
    if (targetUrl.origin !== window.location.origin) return false
    if (
      targetUrl.pathname === window.location.pathname &&
      targetUrl.search === window.location.search
    ) {
      return false
    }
    return true
  } catch {
    return false
  }
}

function ProgressBarCore() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [progress, setProgress] = useState(0)
  const [isVisible, setIsVisible] = useState(false)

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isRunningRef = useRef(false)
  const previousPathRef = useRef<string | null>(null)

  const clearTimers = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current)
      resetTimerRef.current = null
    }
  }, [])

  const start = useCallback(() => {
    clearTimers()
    isRunningRef.current = true
    setIsVisible(true)
    setProgress(20)

    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 80) return prev
        const remaining = 80 - prev
        return prev + Math.max(1, remaining * 0.15)
      })
    }, 150)
  }, [clearTimers])

  const complete = useCallback(() => {
    clearTimers()
    isRunningRef.current = false
    setProgress(100)

    resetTimerRef.current = setTimeout(() => {
      setIsVisible(false)
      resetTimerRef.current = setTimeout(() => {
        setProgress(0)
      }, 250)
    }, 200)
  }, [clearTimers])

  // Detect route changes (pathname or query params)
  useEffect(() => {
    const currentPath = `${pathname}?${searchParams.toString()}`

    if (previousPathRef.current === null) {
      previousPathRef.current = currentPath
      return
    }

    if (previousPathRef.current !== currentPath) {
      previousPathRef.current = currentPath
      if (isRunningRef.current || isVisible) {
        complete()
      }
    }
  }, [pathname, searchParams, isVisible, complete])

  // Listen to global click and history popstate events
  useEffect(() => {
    const handlePopState = () => {
      start()
    }

    const handleClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return
      if (hasModifierKey(event)) return

      const target = event.target as HTMLElement | null
      const anchor = target?.closest('a')
      if (!isEligibleAnchor(anchor)) return

      if (isInternalNavigation(anchor?.href ?? '')) {
        start()
      }
    }

    window.addEventListener('popstate', handlePopState)
    document.addEventListener('click', handleClick, { capture: true })

    return () => {
      clearTimers()
      window.removeEventListener('popstate', handlePopState)
      document.removeEventListener('click', handleClick, { capture: true })
    }
  }, [start, clearTimers])

  return (
    <div
      role="progressbar"
      aria-hidden="true"
      className="pointer-events-none fixed top-0 right-0 left-0 z-50 h-[2.5px] overflow-hidden"
      style={{
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 250ms ease-out',
      }}
    >
      <div
        className="relative h-full bg-gradient-to-r from-sky-500 via-cyan-400 to-[#00f0ff] shadow-[0_0_12px_#00f0ff,0_0_4px_#00f0ff]"
        style={{
          width: `${progress}%`,
          transition: progress === 0 ? 'none' : 'width 200ms ease-out',
        }}
      >
        <div className="absolute top-0 right-0 h-full w-24 bg-gradient-to-r from-transparent to-white/70 shadow-[0_0_12px_#00f0ff]" />
      </div>
    </div>
  )
}

export function NavigationProgressBar() {
  return (
    <Suspense fallback={null}>
      <ProgressBarCore />
    </Suspense>
  )
}
