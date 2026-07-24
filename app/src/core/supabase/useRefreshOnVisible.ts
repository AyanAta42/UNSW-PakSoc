import { useEffect, useRef } from 'react'

/**
 * Lightweight "stay fresh without a socket" hook for public / anonymous surfaces.
 *
 * Calls `onChange` when the tab regains visibility, the window refocuses, or the
 * network comes back online — plus an optional slow poll while visible. It opens
 * NO realtime WebSocket and never imports supabase-js, so anonymous visitors cost
 * zero idle traffic and zero realtime connections.
 *
 * Use this instead of `useRealtimeTable` on surfaces that every visitor loads
 * (home events, social wall), where data changes rarely and "fresh on return" is
 * good enough. Keep `useRealtimeTable` for the few logged-in exec surfaces that
 * genuinely need live collaboration.
 */
export function useRefreshOnVisible(onChange: () => void, enabled = true, pollMs = 0) {
  const cb = useRef(onChange)
  cb.current = onChange

  useEffect(() => {
    if (!enabled) return
    let timer: number | undefined

    // focus + visibilitychange often both fire on a single tab switch — debounce
    // so we refetch once, not twice.
    const run = () => {
      if (document.visibilityState !== 'visible') return
      window.clearTimeout(timer)
      timer = window.setTimeout(() => cb.current(), 300)
    }

    document.addEventListener('visibilitychange', run)
    window.addEventListener('focus', run)
    window.addEventListener('online', run)

    const poll = pollMs > 0
      ? window.setInterval(() => { if (document.visibilityState === 'visible') cb.current() }, pollMs)
      : undefined

    return () => {
      window.clearTimeout(timer)
      document.removeEventListener('visibilitychange', run)
      window.removeEventListener('focus', run)
      window.removeEventListener('online', run)
      if (poll !== undefined) window.clearInterval(poll)
    }
  }, [enabled, pollMs])
}
