import { lazy, Suspense, useEffect, useState } from 'react'
import { useAmbientPause, useEnterOnce } from '@/shared/motion'
import { prefersReducedMotion } from '@/shared/motion'

const DustCanvas = lazy(() => import('./DustCanvas').then(m => ({ default: m.DustCanvas })))

/** Phones skip the grain tile; dust runs everywhere. */
function isLiteDevice(): boolean {
  return typeof window !== 'undefined'
    && window.matchMedia('(max-width: 1023px), (pointer: coarse)').matches
}

/**
 * Ambient, always-on background motion — drifting radial gradients, a giant
 * aurora + swaying ribbon, a faint film-grain layer, and floating dust motes.
 * CSS layers render immediately (they fade in over the static shell tint);
 * canvas effects mount after idle so first paint stays fast, then fade in via
 * CSS. Pauses via `ambient-paused` when the tab is hidden.
 */
export function AmbientBackground({ still = false }: { still?: boolean }) {
  const [enhance, setEnhance] = useState(false)
  // Fade the whole background in on the first visit only; on a back/forward
  // remount it stays put instead of rebuilding from black.
  const fadeInOnce = useEnterOnce('ambient')
  useAmbientPause()

  useEffect(() => {
    if (still || prefersReducedMotion()) return
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
  }, [still])

  return (
    <>
      <div aria-hidden className={`ambient-root${fadeInOnce ? ' ambient-enter' : ''}${still ? ' ambient-still' : ''}`}>
        <div className="ambient-layer ambient-layer-a" />
        <div className="ambient-layer ambient-layer-b" />
        <div className="ambient-aurora" />
        <div className="ambient-aurora-ribbon" />
        {!still && !isLiteDevice() && <div className="ambient-grain" />}
      </div>
      {enhance && !still && (
        <Suspense fallback={null}>
          <DustCanvas />
        </Suspense>
      )}
    </>
  )
}
