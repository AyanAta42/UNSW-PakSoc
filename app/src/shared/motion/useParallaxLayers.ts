import { useEffect } from 'react'
import type { RefObject } from 'react'
import { prefersReducedMotion } from './usePrefersReducedMotion'

export interface ParallaxLayer {
  /** Multiplier applied to normalised pointer offset (-0.5..0.5). */
  depth: number
  el: HTMLElement | null
}

/**
 * Smooth multi-layer parallax driven by rAF — updates DOM transforms directly
 * so React never re-renders on pointer move. Respects reduced-motion and
 * pauses when the tab is hidden.
 */
export function useParallaxLayers(
  containerRef: RefObject<HTMLElement | null>,
  layersRef: RefObject<ParallaxLayer[]>,
) {
  useEffect(() => {
    const node = containerRef.current
    if (
      !node
      || !window.matchMedia('(hover: hover) and (pointer: fine)').matches
      || prefersReducedMotion()
    ) return

    let targetX = 0
    let targetY = 0
    let x = 0
    let y = 0
    let raf = 0
    let active = false

    const apply = () => {
      const layers = layersRef.current
      if (!layers) return
      for (const layer of layers) {
        if (!layer.el) continue
        layer.el.style.transform =
          `translate3d(${(x * layer.depth).toFixed(2)}px, ${(y * layer.depth).toFixed(2)}px, 0)`
      }
    }

    const frame = () => {
      x += (targetX - x) * 0.12
      y += (targetY - y) * 0.12
      apply()
      const settled = Math.abs(targetX - x) < 0.0005 && Math.abs(targetY - y) < 0.0005
      if (settled && !active) {
        raf = 0
        return
      }
      raf = requestAnimationFrame(frame)
    }

    const start = () => {
      if (raf || document.hidden) return
      raf = requestAnimationFrame(frame)
    }

    const onMove = (event: PointerEvent) => {
      const bounds = node.getBoundingClientRect()
      targetX = (event.clientX - bounds.left) / bounds.width - 0.5
      targetY = (event.clientY - bounds.top) / bounds.height - 0.5
      active = true
      start()
    }

    const onLeave = () => {
      targetX = 0
      targetY = 0
      active = false
      start()
    }

    const onVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(raf)
        raf = 0
      } else {
        start()
      }
    }

    node.addEventListener('pointermove', onMove, { passive: true })
    node.addEventListener('pointerleave', onLeave)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      cancelAnimationFrame(raf)
      node.removeEventListener('pointermove', onMove)
      node.removeEventListener('pointerleave', onLeave)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [containerRef, layersRef])
}
