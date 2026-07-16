import { useEffect, useRef } from 'react'

/**
 * A giant, heavily-blurred emerald glow that smoothly trails the cursor (rAF
 * lerp) to gently brighten the area around it. Intensifies a touch while
 * hovering elements marked with `data-cta`. Disabled for coarse pointers and
 * under prefers-reduced-motion; pauses when the tab is hidden.
 */
export function MouseSpotlight() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)')
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (!finePointer.matches || reducedMotion.matches) return
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

    function onMove(e: PointerEvent) {
      targetX = e.clientX
      targetY = e.clientY
      if (!visible) visible = true
    }
    function onOver(e: MouseEvent) {
      const t = e.target as HTMLElement | null
      if (t?.closest?.('[data-cta]')) targetIntensity = 1
    }
    function onOut(e: MouseEvent) {
      const t = e.target as HTMLElement | null
      if (t?.closest?.('[data-cta]')) targetIntensity = 0
    }

    function frame() {
      raf = requestAnimationFrame(frame)
      x += (targetX - x) * 0.08
      y += (targetY - y) * 0.08
      intensity += (targetIntensity - intensity) * 0.06
      const scale = 1 + intensity * 0.15
      const opacity = visible ? 0.05 + intensity * 0.05 : 0
      el!.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%) scale(${scale})`
      el!.style.opacity = opacity.toFixed(3)
    }

    function start() {
      if (raf) return
      raf = requestAnimationFrame(frame)
    }
    function stop() {
      cancelAnimationFrame(raf)
      raf = 0
    }
    function onVisibility() {
      if (document.hidden) stop()
      else start()
    }

    start()
    window.addEventListener('pointermove', onMove, { passive: true })
    document.addEventListener('mouseover', onOver)
    document.addEventListener('mouseout', onOut)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      stop()
      window.removeEventListener('pointermove', onMove)
      document.removeEventListener('mouseover', onOver)
      document.removeEventListener('mouseout', onOut)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  return <div ref={ref} aria-hidden className="ambient-spotlight" style={{ opacity: 0 }} />
}
