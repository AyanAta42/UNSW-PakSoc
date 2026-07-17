import { useEffect, useRef } from 'react'
import { isFxPaused, onFxPauseChange, prefersReducedMotion } from '@/shared/motion'

type Kind = 'star' | 'crescent'

interface Speck {
  t: number
  kind: Kind
  /** Perpendicular offset from the Bézier, grows toward the end (dispersion). */
  offset: number
  size: number
  baseOpacity: number
  twinklePhase: number
  twinkleSpeed: number
  driftAmp: number
  driftPhase: number
  driftSpeed: number
  color: 'warm' | 'emerald' | 'gold'
}

/** Cubic Bézier evaluation. */
function bezier(t: number, p0: number, p1: number, p2: number, p3: number) {
  const u = 1 - t
  return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3
}

function bezierPoint(
  t: number,
  w: number,
  h: number,
): { x: number; y: number; tx: number; ty: number } {
  // Bottom-left → top-right, with a soft night-sky arc
  const x0 = w * 0.04, y0 = h * 0.94
  const x1 = w * 0.28, y1 = h * 0.55
  const x2 = w * 0.62, y2 = h * 0.12
  const x3 = w * 0.96, y3 = h * 0.08

  const x = bezier(t, x0, x1, x2, x3)
  const y = bezier(t, y0, y1, y2, y3)

  // Tangent for perpendicular scatter
  const dx = bezier(Math.min(1, t + 0.001), x0, x1, x2, x3) - x
  const dy = bezier(Math.min(1, t + 0.001), y0, y1, y2, y3) - y
  const len = Math.hypot(dx, dy) || 1
  return { x, y, tx: dx / len, ty: dy / len }
}

function pickColor(): Speck['color'] {
  const r = Math.random()
  if (r < 0.90) return 'warm'
  if (r < 0.98) return 'emerald'
  return 'gold'
}

function colorCss(c: Speck['color'], a: number) {
  if (c === 'emerald') return `rgba(167, 243, 208, ${a})`
  if (c === 'gold') return `rgba(250, 220, 160, ${a})`
  return `rgba(255, 255, 245, ${a})`
}

/**
 * Celestial particle trail along a cubic Bézier (bottom-left → top-right).
 * Canvas-only, ~200 tiny stars + sparse crescents. Twinkle / drift / path pulse
 * via rAF; static under prefers-reduced-motion; pauses when the tab is hidden.
 */
export function HeroCelestialTrail() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const parent = canvas?.parentElement
    if (!canvas || !parent) return
    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    const reduced = prefersReducedMotion()
    let w = 0
    let h = 0
    let dpr = 1
    let raf = 0
    let start = performance.now()
    let specks: Speck[] = []

    function build(count: number) {
      const next: Speck[] = []
      let sinceCrescent = 0
      const crescentEvery = 15 + Math.floor(Math.random() * 11) // 15–25

      for (let i = 0; i < count; i++) {
        // Bias density toward the start; thin out as we disperse
        const t = Math.pow(Math.random(), 0.85)
        sinceCrescent++
        const kind: Kind = sinceCrescent >= crescentEvery ? 'crescent' : 'star'
        if (kind === 'crescent') sinceCrescent = 0

        // Dispersion grows with t (trail fades out toward top-right)
        const spread = 4 + t * t * 42
        next.push({
          t,
          kind,
          offset: (Math.random() - 0.5) * 2 * spread,
          size: kind === 'crescent'
            ? 8 + Math.random() * 6
            : 1 + Math.random() * 3,
          baseOpacity: kind === 'crescent'
            ? 0.18 + Math.random() * 0.28
            : (0.15 + Math.random() * 0.55) * (1 - t * 0.55),
          twinklePhase: Math.random() * Math.PI * 2,
          twinkleSpeed: 0.0004 + Math.random() * 0.0012,
          driftAmp: 0.4 + Math.random() * 1.8,
          driftPhase: Math.random() * Math.PI * 2,
          driftSpeed: 0.00025 + Math.random() * 0.0006,
          color: pickColor(),
        })
      }
      specks = next
    }

    function resize() {
      const rect = parent!.getBoundingClientRect()
      w = Math.max(1, Math.floor(rect.width))
      h = Math.max(1, Math.floor(rect.height))
      dpr = Math.min(window.devicePixelRatio || 1, 1.25)
      canvas!.width = Math.floor(w * dpr)
      canvas!.height = Math.floor(h * dpr)
      canvas!.style.width = `${w}px`
      canvas!.style.height = `${h}px`
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)
      // Leaner on phone so open animations stay snappy
      const narrow = w < 640
      const count = Math.round(Math.min(
        narrow ? 90 : 160,
        Math.max(narrow ? 48 : 80, (w * h) / (narrow ? 1100 : 720)),
      ))
      build(count)
    }

    function drawSoftGlow() {
      // Extremely soft emerald wash under the trail path
      for (let i = 0; i <= 6; i++) {
        const t = i / 6
        const { x, y } = bezierPoint(t, w, h)
        const r = 28 + t * 50
        const g = ctx!.createRadialGradient(x, y, 0, x, y, r)
        g.addColorStop(0, `rgba(34, 197, 94, ${0.07 * (1 - t * 0.5)})`)
        g.addColorStop(1, 'rgba(34, 197, 94, 0)')
        ctx!.fillStyle = g
        ctx!.beginPath()
        ctx!.arc(x, y, r, 0, Math.PI * 2)
        ctx!.fill()
      }
    }

    function drawSpeck(s: Speck, now: number, pulseT: number) {
      const { x: bx, y: by, tx, ty } = bezierPoint(s.t, w, h)
      // Perpendicular offset
      const nx = -ty
      const ny = tx
      const drift = Math.sin(now * s.driftSpeed + s.driftPhase) * s.driftAmp
      const x = bx + nx * s.offset + nx * drift * 0.3
      const y = by + ny * s.offset + ny * drift

      let opacity = s.baseOpacity
      if (!reduced) {
        const twinkle = 0.55 + 0.45 * Math.sin(now * s.twinkleSpeed + s.twinklePhase)
        opacity *= s.kind === 'crescent' ? (0.7 + 0.3 * twinkle) : twinkle

        // Path energy pulse — brief brightening near the travelling crest
        const dist = Math.abs(s.t - pulseT)
        if (dist < 0.08) opacity *= 1 + (1 - dist / 0.08) * 0.55
      }

      opacity = Math.max(0, Math.min(0.85, opacity))
      if (opacity < 0.02) return

      if (s.kind === 'crescent') {
        ctx!.font = `${s.size}px Georgia, "Times New Roman", serif`
        ctx!.fillStyle = colorCss(s.color, opacity * 0.85)
        ctx!.textAlign = 'center'
        ctx!.textBaseline = 'middle'
        ctx!.fillText('☾', x, y)
        return
      }

      ctx!.beginPath()
      ctx!.arc(x, y, s.size * 0.5, 0, Math.PI * 2)
      ctx!.fillStyle = colorCss(s.color, opacity)
      ctx!.fill()
    }

    function render(now: number) {
      ctx!.clearRect(0, 0, w, h)
      drawSoftGlow()

      // Pulse loops every ~10s along the path
      const period = 10000
      const pulseT = reduced ? -1 : ((now - start) % period) / period

      for (const s of specks) drawSpeck(s, now, pulseT)
    }

    function frame(now: number) {
      raf = requestAnimationFrame(frame)
      render(now)
    }

    function startLoop() {
      if (raf || isFxPaused() || reduced) return
      raf = requestAnimationFrame(frame)
    }
    function stopLoop() {
      cancelAnimationFrame(raf)
      raf = 0
    }

    resize()
    render(performance.now())
    if (!reduced) startLoop()

    const ro = new ResizeObserver(() => {
      resize()
      render(performance.now())
    })
    ro.observe(parent)

    const unsubPause = onFxPauseChange(() => {
      if (isFxPaused()) stopLoop()
      else if (!reduced) startLoop()
    })

    return () => {
      stopLoop()
      ro.disconnect()
      unsubPause()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="hero-celestial-trail pointer-events-none absolute inset-0 z-[1]"
    />
  )
}
