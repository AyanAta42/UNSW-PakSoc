import { useEffect, useRef } from 'react'

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

const COUNT = 40

/**
 * A single <canvas> of ~40 slowly rising, gently swaying dust motes with
 * fading opacity — like illuminated dust in sunlight. Pauses when the tab is
 * hidden and is disabled under prefers-reduced-motion.
 */
export function DustCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    let width = window.innerWidth
    let height = window.innerHeight
    let dpr = Math.min(window.devicePixelRatio || 1, 2)
    let raf = 0
    let last = performance.now()

    function resize() {
      width = window.innerWidth
      height = window.innerHeight
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas!.width = width * dpr
      canvas!.height = height * dpr
      canvas!.style.width = `${width}px`
      canvas!.style.height = `${height}px`
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    function spawn(fromBottom: boolean): Particle {
      return {
        x: Math.random() * width,
        y: fromBottom ? height + Math.random() * 40 : Math.random() * height,
        r: 0.6 + Math.random() * 1.8,
        vy: 0.05 + Math.random() * 0.14,
        drift: (Math.random() - 0.5) * 0.16,
        driftPhase: Math.random() * Math.PI * 2,
        driftSpeed: 0.0005 + Math.random() * 0.001,
        baseOpacity: 0.06 + Math.random() * 0.26,
        fadePhase: Math.random() * Math.PI * 2,
        fadeSpeed: 0.0003 + Math.random() * 0.0008,
      }
    }

    resize()
    const particles: Particle[] = Array.from({ length: COUNT }, () => spawn(false))

    function frame(now: number) {
      raf = requestAnimationFrame(frame)
      const dt = Math.min(now - last, 50)
      last = now

      ctx!.clearRect(0, 0, width, height)
      ctx!.shadowColor = 'rgba(34, 197, 94, 0.5)'
      ctx!.shadowBlur = 4

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
      if (raf) return
      last = performance.now()
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
    window.addEventListener('resize', resize)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      stop()
      window.removeEventListener('resize', resize)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  return <canvas ref={canvasRef} aria-hidden className="ambient-dust" />
}
