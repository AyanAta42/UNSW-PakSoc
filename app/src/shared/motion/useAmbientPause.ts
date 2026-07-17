import { useEffect } from 'react'

/**
 * Toggles `ambient-paused` on <html> when the tab is hidden or a modal is open
 * so CSS infinite loops freeze. Pair with the CSS animation-play-state rule.
 */
export function useAmbientPause() {
  useEffect(() => {
    const sync = () => {
      const pause =
        document.hidden
        || document.documentElement.classList.contains('modal-open')
      document.documentElement.classList.toggle('ambient-paused', pause)
    }
    sync()
    document.addEventListener('visibilitychange', sync)
    const mo = new MutationObserver(sync)
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => {
      document.removeEventListener('visibilitychange', sync)
      mo.disconnect()
      document.documentElement.classList.remove('ambient-paused')
    }
  }, [])
}
