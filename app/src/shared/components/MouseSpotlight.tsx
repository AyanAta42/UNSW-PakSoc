import { useEffect, useRef } from 'react'
import { isFxPaused, onFxPauseChange, prefersReducedMotion } from '@/shared/motion'

/**
 * Soft emerald cursor wash — DOM updates via rAF lerp only (no React state).
 * Idles the loop when settled; pauses when the tab is hidden.
 */
export function MouseSpotlight() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)')
    if (!finePointer.matches || prefersReducedMotion()) return
    const el = ref.current
    if (!el) return

    let targetX = window.innerWidth / 2
    let targetY = window.innerHeight / 2
    let x = targetX
    let y = targetY
    let intensity = 0
    let targetIntensity = 0
    let visible = false
    let raf = 0

    function paint() {
      const scale = 1 + intensity * 0.12
      const opacity = visible ? 0.045 + intensity * 0.04 : 0
      el!.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%) scale(${scale})`
      el!.style.opacity = opacity.toFixed(3)
    }

    function frame() {
      x += (targetX - x) * 0.08
      y += (targetY - y) * 0.08
      intensity += (targetIntensity - intensity) * 0.06
      paint()

      const settled =
        Math.abs(targetX - x) < 0.15
        && Math.abs(targetY - y) < 0.15
        && Math.abs(targetIntensity - intensity) < 0.002

      if (settled) {
        raf = 0
        return
      }
      raf = requestAnimationFrame(frame)
    }

    function start() {
      if (raf || isFxPaused()) return
      raf = requestAnimationFrame(frame)
    }
    function stop() {
      cancelAnimationFrame(raf)
      raf = 0
    }

    function onMove(e: PointerEvent) {
      if (isFxPaused()) return
      targetX = e.clientX
      targetY = e.clientY
      if (!visible) visible = true
      start()
    }
    function onOver(e: MouseEvent) {
      if ((e.target as HTMLElement | null)?.closest?.('[data-cta]')) {
        targetIntensity = 1
        start()
      }
    }
    function onOut(e: MouseEvent) {
      if ((e.target as HTMLElement | null)?.closest?.('[data-cta]')) {
        targetIntensity = 0
        start()
      }
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    document.addEventListener('mouseover', onOver)
    document.addEventListener('mouseout', onOut)
    const unsubPause = onFxPauseChange(() => {
      if (isFxPaused()) stop()
    })
    return () => {
      stop()
      window.removeEventListener('pointermove', onMove)
      document.removeEventListener('mouseover', onOver)
      document.removeEventListener('mouseout', onOut)
      unsubPause()
    }
  }, [])

  return <div ref={ref} aria-hidden className="ambient-spotlight" style={{ opacity: 0 }} />
}
