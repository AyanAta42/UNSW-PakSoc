import { useEffect } from 'react'

/**
 * Toggles `ambient-paused` on <html> when the tab is hidden so CSS infinite
 * loops freeze. Pair with the CSS animation-play-state rule.
 */
export function useAmbientPause() {
  useEffect(() => {
    const sync = () => {
      document.documentElement.classList.toggle('ambient-paused', document.hidden)
    }
    sync()
    document.addEventListener('visibilitychange', sync)
    return () => {
      document.removeEventListener('visibilitychange', sync)
      document.documentElement.classList.remove('ambient-paused')
    }
  }, [])
}
