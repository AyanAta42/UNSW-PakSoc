import { useState, useEffect } from 'react'

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

/** Live countdown — computes the first value synchronously so digits aren't stuck at 00. */
export function useCountdown(iso: string | undefined): Countdown {
  const [cd, setCd] = useState<Countdown>(() => (iso ? calc(iso) : ZERO))

  useEffect(() => {
    if (!iso) {
      setCd(ZERO)
      return
    }

    const tick = () => setCd(calc(iso))
    tick() // immediate — don't wait for the first interval

    let id: ReturnType<typeof setInterval> | undefined
    const start = () => {
      if (id !== undefined || document.hidden) return
      id = setInterval(tick, 1000)
    }
    const stop = () => {
      if (id === undefined) return
      clearInterval(id)
      id = undefined
    }
    const onVisibility = () => {
      if (document.hidden) stop()
      else { tick(); start() }
    }

    start()
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      stop()
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [iso])

  return cd
}
