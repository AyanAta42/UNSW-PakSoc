import { useState, useEffect } from 'react'

interface Countdown {
  days: number
  hrs:  number
  mins: number
  secs: number
}

/** Live countdown to an ISO date string. Updates every second; pauses when the tab is hidden. */
export function useCountdown(iso: string | undefined): Countdown {
  const [cd, setCd] = useState<Countdown>({ days: 0, hrs: 0, mins: 0, secs: 0 })

  useEffect(() => {
    if (!iso) return

    const tick = () => {
      const diff = new Date(iso).getTime() - Date.now()
      if (diff <= 0) { setCd({ days: 0, hrs: 0, mins: 0, secs: 0 }); return }
      setCd({
        days: Math.floor(diff / 86_400_000),
        hrs:  Math.floor((diff % 86_400_000) / 3_600_000),
        mins: Math.floor((diff % 3_600_000)  / 60_000),
        secs: Math.floor((diff % 60_000)      / 1_000),
      })
    }

    tick()
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
