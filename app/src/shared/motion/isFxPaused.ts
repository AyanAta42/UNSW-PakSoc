/** True when heavy canvas/CSS ambience should freeze (tab hidden or modal open). */
export function isFxPaused(): boolean {
  return (
    document.hidden
    || document.documentElement.classList.contains('modal-open')
  )
}

/** Subscribe to pause/resume signals for rAF loops. */
export function onFxPauseChange(cb: () => void): () => void {
  const sync = () => cb()
  document.addEventListener('visibilitychange', sync)
  const mo = new MutationObserver(sync)
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
  return () => {
    document.removeEventListener('visibilitychange', sync)
    mo.disconnect()
  }
}
