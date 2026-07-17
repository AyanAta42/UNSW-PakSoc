import { lazy, Suspense, useEffect, useState } from 'react'
import { useAmbientPause } from '@/shared/motion'
import { prefersReducedMotion } from '@/shared/motion'

const DustCanvas = lazy(() => import('./DustCanvas').then(m => ({ default: m.DustCanvas })))
const MouseSpotlight = lazy(() => import('./MouseSpotlight').then(m => ({ default: m.MouseSpotlight })))

/** Phones skip the grain tile and cursor spotlight; stars/dust run everywhere. */
function isLiteDevice(): boolean {
  return typeof window !== 'undefined'
    && window.matchMedia('(max-width: 1023px), (pointer: coarse)').matches
}

/**
 * Ambient, always-on background motion — drifting radial gradients, a giant
 * aurora + swaying ribbon, a faint film-grain layer, floating dust/stars, and
 * a cursor spotlight. CSS layers render immediately (they fade in over the
 * static shell tint); canvas effects mount after idle so first paint stays
 * fast, then fade in via CSS. Pauses via `ambient-paused` when hidden.
 */
export function AmbientBackground() {
  const [enhance, setEnhance] = useState(false)
  useAmbientPause()

  useEffect(() => {
    if (prefersReducedMotion()) return
    let cancelled = false
    const run = () => { if (!cancelled) setEnhance(true) }
    let idleId: number | undefined
    let timeoutId: ReturnType<typeof setTimeout> | undefined

    if (typeof window.requestIdleCallback === 'function') {
      idleId = window.requestIdleCallback(run, { timeout: 800 })
    } else {
      timeoutId = setTimeout(run, 200)
    }

    return () => {
      cancelled = true
      if (idleId !== undefined && typeof window.cancelIdleCallback === 'function') {
        window.cancelIdleCallback(idleId)
      }
      if (timeoutId !== undefined) clearTimeout(timeoutId)
    }
  }, [])

  return (
    <>
      <div aria-hidden className="ambient-root">
        <div className="ambient-layer ambient-layer-a" />
        <div className="ambient-layer ambient-layer-b" />
        <div className="ambient-aurora" />
        <div className="ambient-aurora-ribbon" />
        {!isLiteDevice() && <div className="ambient-grain" />}
      </div>
      {enhance && (
        <Suspense fallback={null}>
          {!isLiteDevice() && <MouseSpotlight />}
          <DustCanvas />
        </Suspense>
      )}
    </>
  )
}
