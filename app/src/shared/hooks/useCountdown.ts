import { useLayoutEffect, useState } from 'react'

interface Countdown {
  days: number
  hrs: number
  mins: number
  secs: number
}

const ZERO: Countdown = { days: 0, hrs: 0, mins: 0, secs: 0 }

function calc(iso: string): Countdown {
  const diff = new Date(iso).getTime() - Date.now()
  if (Number.isNaN(diff) || diff <= 0) return ZERO
  return {
    days: Math.floor(diff / 86_400_000),
    hrs: Math.floor((diff % 86_400_000) / 3_600_000),
    mins: Math.floor((diff % 3_600_000) / 60_000),
    secs: Math.floor((diff % 60_000) / 1_000),
  }
}

/**
 * Live countdown — value is always computed fresh on render (instant correct digits),
 * and a layout-effect interval forces a re-render every second so it ticks immediately.
 */
export function useCountdown(iso: string | undefined): Countdown {
  const [, setBeat] = useState(0)

  useLayoutEffect(() => {
    if (!iso) return
    const id = window.setInterval(() => {
      if (!document.hidden) setBeat(n => n + 1)
    }, 1000)
    const onVis = () => { if (!document.hidden) setBeat(n => n + 1) }
    document.addEventListener('visibilitychange', onVis)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [iso])

  return iso ? calc(iso) : ZERO
}
