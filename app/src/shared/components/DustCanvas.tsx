import { useEffect, useRef } from 'react'
import { isFxPaused, onFxPauseChange, prefersReducedMotion } from '@/shared/motion'

interface Particle {
  x: number
  y: number
  r: number
  vy: number
  drift: number
  driftPhase: number
  driftSpeed: number
  baseOpacity: number
  fadePhase: number
  fadeSpeed: number
}

interface Star {
  x: number
  y: number
  arm: number
  baseOpacity: number
  twinklePhase: number
  twinkleSpeed: number
}

/** Fewer particles on phones / high-DPR screens keeps the loop cheap. */
const HI_DPR = typeof window !== 'undefined' && (window.devicePixelRatio || 1) > 1.5
const LITE = typeof window !== 'undefined'
  && window.matchMedia('(max-width: 1023px), (pointer: coarse)').matches
const DUST_COUNT = LITE ? 10 : HI_DPR ? 16 : 20
const STAR_COUNT = LITE ? 12 : HI_DPR ? 12 : 16

/**
 * Single-canvas dust motes + pinned twinkling stars (x/y/opacity only).
 * Stars are two crossed fillRects — cheaper than arc paths, and the
 * overlapping centre pixel composites brighter for free.
 * No canvas shadows — those were a per-frame paint tax. Pauses when hidden.
 */
export function DustCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (prefersReducedMotion()) return
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d', { alpha: true })
    if (!canvas || !ctx) return

    let width = window.innerWidth
    let height = window.innerHeight
    let dpr = Math.min(window.devicePixelRatio || 1, 1.5)
    let raf = 0
    let last = performance.now()

    function spawnStar(): Star {
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        arm: 1.4 + Math.random() * 2.2,
        baseOpacity: 0.25 + Math.random() * 0.5,
        twinklePhase: Math.random() * Math.PI * 2,
        twinkleSpeed: 0.0006 + Math.random() * 0.0014,
      }
    }

    const stars: Star[] = Array.from({ length: STAR_COUNT }, spawnStar)

    function resize() {
      width = window.innerWidth
      height = window.innerHeight
      dpr = Math.min(window.devicePixelRatio || 1, 1.5)
      canvas!.width = Math.floor(width * dpr)
      canvas!.height = Math.floor(height * dpr)
      canvas!.style.width = `${width}px`
      canvas!.style.height = `${height}px`
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)
      // Re-scatter so stars never sit stranded outside the new viewport
      for (let i = 0; i < stars.length; i++) stars[i] = spawnStar()
    }

    function spawn(fromBottom: boolean): Particle {
      return {
        x: Math.random() * width,
        y: fromBottom ? height + Math.random() * 40 : Math.random() * height,
        r: 0.55 + Math.random() * 1.5,
        vy: 0.05 + Math.random() * 0.12,
        drift: (Math.random() - 0.5) * 0.14,
        driftPhase: Math.random() * Math.PI * 2,
        driftSpeed: 0.0005 + Math.random() * 0.001,
        baseOpacity: 0.09 + Math.random() * 0.26,
        fadePhase: Math.random() * Math.PI * 2,
        fadeSpeed: 0.0003 + Math.random() * 0.0007,
      }
    }

    resize()
    const particles: Particle[] = Array.from({ length: DUST_COUNT }, () => spawn(false))

    function frame(now: number) {
      raf = requestAnimationFrame(frame)
      const dt = Math.min(now - last, 50)
      last = now

      ctx!.clearRect(0, 0, width, height)

      for (const s of stars) {
        s.twinklePhase += s.twinkleSpeed * dt
        const tw = 0.5 + 0.5 * Math.sin(s.twinklePhase)
        // Squared twinkle: long dim rests with brief bright sparkles
        const opacity = s.baseOpacity * (0.18 + 0.82 * tw * tw)
        ctx!.fillStyle = `rgba(214, 242, 250, ${opacity.toFixed(3)})`
        ctx!.fillRect(s.x - s.arm, s.y - 0.5, s.arm * 2, 1)
        ctx!.fillRect(s.x - 0.5, s.y - s.arm, 1, s.arm * 2)
      }

      for (const p of particles) {
        p.y -= p.vy * dt * 0.06
        p.driftPhase += p.driftSpeed * dt
        p.x += Math.sin(p.driftPhase) * p.drift * dt * 0.12
        p.fadePhase += p.fadeSpeed * dt

        if (p.y < -10) Object.assign(p, spawn(true))

        const opacity = p.baseOpacity * (0.5 + 0.5 * Math.sin(p.fadePhase))
        ctx!.beginPath()
        ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx!.fillStyle = `rgba(215, 240, 224, ${opacity.toFixed(3)})`
        ctx!.fill()
      }
    }

    function start() {
      if (raf || isFxPaused()) return
      last = performance.now()
      raf = requestAnimationFrame(frame)
    }
    function stop() {
      cancelAnimationFrame(raf)
      raf = 0
    }

    start()
    window.addEventListener('resize', resize, { passive: true })
    const unsubPause = onFxPauseChange(() => {
      if (isFxPaused()) stop()
      else start()
    })
    return () => {
      stop()
      window.removeEventListener('resize', resize)
      unsubPause()
    }
  }, [])

  return <canvas ref={canvasRef} aria-hidden className="ambient-dust" />
}
