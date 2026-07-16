import { useEffect, useRef, useState } from 'react'
import type { DbEvent } from '@/events/types/Event'
import { useCountdown }    from '@/shared/hooks/useCountdown'
import { getEventButtons } from '@/events/utils/getEventButtons'
import { EventCtaButton }  from '@/events/components/EventCtaButton'
import { ACCENT, ACCENT_GLOW, PALETTE } from '@/config/theme'

interface Props { banner: DbEvent | null; loading: boolean }

// Parallax depth multipliers applied to the normalised pointer offset (-0.5..0.5)
const BG_DEPTH = 8       // ±4px
const GLOW_DEPTH = 16    // ±8px
const CONTENT_DEPTH = 3  // ±1.5px

export function HeroBanner({ banner, loading }: Props) {
  const cd   = useCountdown(banner?.time)
  const heroRef = useRef<HTMLDivElement>(null)
  const [parallax, setParallax] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const node = heroRef.current
    if (!node || !window.matchMedia('(hover: hover) and (pointer: fine)').matches || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const onPointerMove = (event: PointerEvent) => {
      const bounds = node.getBoundingClientRect()
      setParallax({
        x: (event.clientX - bounds.left) / bounds.width - 0.5,
        y: (event.clientY - bounds.top) / bounds.height - 0.5,
      })
    }
    const reset = () => setParallax({ x: 0, y: 0 })

    node.addEventListener('pointermove', onPointerMove)
    node.addEventListener('pointerleave', reset)
    return () => {
      node.removeEventListener('pointermove', onPointerMove)
      node.removeEventListener('pointerleave', reset)
    }
  }, [])

  if (!banner) return null
  const btns = getEventButtons(banner.buttons)

  const layerTransform = (depth: number) =>
    `translate3d(${(parallax.x * depth).toFixed(2)}px, ${(parallax.y * depth).toFixed(2)}px, 0)`
  const smoothTransition = 'transform 500ms cubic-bezier(0.22, 1, 0.36, 1)'

  return (
    <div className="px-4 pt-4 lg:p-0">
      <div ref={heroRef} className="motion-hero-enter overflow-hidden relative flex flex-col min-h-[228px] md:flex-row md:min-h-[280px]"
        style={{ borderRadius: 18, border: `1px solid ${PALETTE.border}`, boxShadow: PALETTE.shadowLg }}>

        {/* Layer 1: Background image */}
        <div className="absolute -inset-2 will-change-transform"
          style={{ transform: layerTransform(BG_DEPTH), transition: smoothTransition }}>
          <img src="/banner.png" alt="" className="w-[calc(100%+1rem)] h-[calc(100%+1rem)] object-cover object-center motion-hero-image" />
        </div>

        {/* Base dark overlay */}
        <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.55)' }} />

        {/* Layer 2: Aurora glow */}
        <div aria-hidden className="absolute inset-0 will-change-transform"
          style={{ transform: layerTransform(GLOW_DEPTH), transition: smoothTransition }}>
          <div className="absolute -left-[8%] -top-[35%] w-[65%] h-[170%] motion-hero-aurora"
            style={{ background: 'radial-gradient(closest-side, rgba(34,197,94,0.55), transparent 72%)', filter: 'blur(70px)', opacity: 0.55 }} />
        </div>

        {/* Layer 3: Decorative gradients */}
        {/* Green gradient accent — bottom-left corner */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.18) 0%, rgba(0,0,0,0) 55%)' }} />
        <div aria-hidden className="absolute -inset-1/4 opacity-30 motion-light-rays"
          style={{ background: 'linear-gradient(115deg, transparent 38%, rgba(74,222,128,0.15) 48%, transparent 58%)' }} />
        {/* Faint diagonal light streak — passes over slowly */}
        <div aria-hidden className="motion-hero-streak" />
        {/* Left-side text legibility fade */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.55) 35%, transparent 65%)' }} />

        {/* Layer 4: Content */}
        <div className="relative z-10 flex flex-col p-5 md:p-9 flex-1 min-h-[228px] md:min-h-0 will-change-transform"
          style={{ transform: layerTransform(CONTENT_DEPTH), transition: smoothTransition }}>
          <h1 style={{ fontFamily: '"Satoshi", sans-serif', fontWeight: 900, color: '#F8FAFC' }}
            className="text-2xl md:text-[44px] tracking-tight m-0 leading-none shrink-0 motion-hero-title">
            Next <span style={{ color: ACCENT }}>Event</span>
          </h1>

          <div className="flex-1 min-h-8 md:min-h-0" />

          {loading && (
            <div className="rounded-xl h-[72px] md:h-24 animate-pulse shrink-0"
              style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${PALETTE.border}` }} />
          )}

          {!loading && banner && (
            <div className="w-full md:w-fit shrink-0 motion-hero-details">
              <div style={{ color: '#F8FAFC' }} className="text-[15px] md:text-lg font-extrabold mb-3 truncate">{banner.name}</div>
              <div className="flex gap-2 w-fit">
                {(['days','hrs','mins','secs'] as const).map((k, i) => {
                  const val = [cd.days, cd.hrs, cd.mins, cd.secs][i]
                  return (
                    <div key={k} className="text-center min-w-[48px] md:min-w-[58px] shrink-0 px-2 py-1.5 md:px-3 md:py-2"
                      style={{ background: 'rgba(10,10,10,0.9)', border: `1px solid ${PALETTE.border}`, borderRadius: 12 }}>
                      <div style={{ color: ACCENT_GLOW, fontSize: 20, lineHeight: 1 }} className="font-extrabold tabular-nums md:text-[26px]">{String(val).padStart(2,'0')}</div>
                      <div style={{ color: PALETTE.secondary, fontSize: 8 }} className="uppercase tracking-widest mt-1 font-bold md:text-[9px]">{k}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Mobile CTAs */}
          {!loading && btns.length > 0 && (
            <div className="md:hidden flex gap-2 mt-3 w-full shrink-0 motion-hero-actions">
              {btns.map((b, i) => (
                <EventCtaButton key={i} label={b.label} url={b.url} variant={i === 0 ? 'primary' : 'secondary'}
                  className="flex-1 px-2 py-2.5 text-xs min-w-0" />
              ))}
            </div>
          )}
        </div>

        {/* Desktop CTAs — bottom-right */}
        <div className="hidden md:flex relative z-10 w-[42%] shrink-0 flex-col justify-end items-end p-8 will-change-transform"
          style={{ transform: layerTransform(CONTENT_DEPTH), transition: smoothTransition }}>
          {!loading && btns.length > 0 && (
            <div className="flex gap-3 motion-hero-actions">
              {btns.map((b, i) => (
                <EventCtaButton key={i} label={b.label} url={b.url} variant={i === 0 ? 'primary' : 'secondary'}
                  className="px-5 py-2.5 text-sm whitespace-nowrap" />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
