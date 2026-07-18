/** True when heavy canvas/CSS ambience should freeze (tab hidden). */
export function isFxPaused(): boolean {
  return document.hidden
}

/** Subscribe to pause/resume signals for rAF loops. */
export function onFxPauseChange(cb: () => void): () => void {
  const sync = () => cb()
  document.addEventListener('visibilitychange', sync)
  return () => {
    document.removeEventListener('visibilitychange', sync)
  }
}
