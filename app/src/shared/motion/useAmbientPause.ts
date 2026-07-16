import { useEffect } from 'react'

/**
 * Toggles `ambient-paused` on <html> when the tab is hidden so CSS infinite
 * loops freeze without tearing down layers. Pair with the CSS rule that sets
 * animation-play-state: paused.
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
