import { useRef } from 'react'
import type { DbEvent } from '@/events/types/Event'
import { useCountdown }    from '@/shared/hooks/useCountdown'
import { getEventButtons, getCtaVariant } from '@/events/utils/getEventButtons'
import { EventCtaButton }  from '@/events/components/EventCtaButton'
import { OdometerNumber }  from '@/shared/components/OdometerNumber'
import { useParallaxLayers, type ParallaxLayer } from '@/shared/motion'
import { ACCENT, ACCENT_GLOW, PALETTE } from '@/config/theme'

interface Props { banner: DbEvent | null; loading: boolean }

// Parallax depth multipliers applied to the normalised pointer offset (-0.5..0.5)
const BG_DEPTH = 8       // ±4px
const GLOW_DEPTH = 16    // ±8px
const CONTENT_DEPTH = 3  // ±1.5px

export function HeroBanner({ banner, loading }: Props) {
  const cd   = useCountdown(banner?.time)
  const heroRef = useRef<HTMLDivElement>(null)
  const bgRef = useRef<HTMLDivElement>(null)
  const glowRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const ctaRef = useRef<HTMLDivElement>(null)
  const layersRef = useRef<ParallaxLayer[]>([])

  layersRef.current = [
    { depth: BG_DEPTH, el: bgRef.current },
    { depth: GLOW_DEPTH, el: glowRef.current },
    { depth: CONTENT_DEPTH, el: contentRef.current },
    { depth: CONTENT_DEPTH, el: ctaRef.current },
  ]
  useParallaxLayers(heroRef, layersRef)

  if (!banner) return null
  const btns = getEventButtons(banner.buttons)

  return (
    <div className="motion-glow motion-glow-hero px-4 pt-4 lg:p-0">
      <div ref={heroRef} className="motion-hero-enter overflow-hidden relative flex flex-col min-h-[228px] md:flex-row md:min-h-[280px]"
        style={{ borderRadius: 18, border: `1px solid ${PALETTE.border}`, boxShadow: PALETTE.shadowLg }}>

        {/* Layer 1: Background image — slow zoom only (no filter breathing) */}
        <div ref={bgRef} className="absolute -inset-2 motion-parallax-layer">
          <img
            src="/banner.png"
            alt=""
            fetchPriority="high"
            decoding="async"
            className="w-[calc(100%+1rem)] h-[calc(100%+1rem)] object-cover object-center motion-hero-image"
          />
          {/* Opacity-only breath overlay — avoids animating filter on the image */}
          <div aria-hidden className="motion-hero-breath absolute inset-0 pointer-events-none" />
        </div>

        {/* Base dark overlay */}
        <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.55)' }} />

        {/* Layer 2: Aurora glow */}
        <div ref={glowRef} aria-hidden className="absolute inset-0 motion-parallax-layer">
          <div className="absolute -left-[8%] -top-[35%] w-[65%] h-[170%] motion-hero-aurora"
            style={{ background: 'radial-gradient(closest-side, rgba(34,197,94,0.55), transparent 72%)', filter: 'blur(70px)', opacity: 0.55 }} />
        </div>

        {/* Layer 3: Decorative gradients */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.18) 0%, rgba(0,0,0,0) 55%)' }} />
        <div aria-hidden className="absolute -inset-1/4 opacity-30 motion-light-rays"
          style={{ background: 'linear-gradient(115deg, transparent 38%, rgba(74,222,128,0.15) 48%, transparent 58%)' }} />
        <div aria-hidden className="motion-hero-streak" />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.55) 35%, transparent 65%)' }} />

        {/* Layer 4: Content */}
        <div ref={contentRef} className="relative z-10 flex flex-col p-5 md:p-9 flex-1 min-h-[228px] md:min-h-0 motion-parallax-layer">
          <h1 style={{ fontFamily: '"Satoshi", sans-serif', fontWeight: 900, color: '#F8FAFC' }}
            className="text-2xl md:text-[44px] tracking-tight m-0 leading-none shrink-0 motion-hero-title">
            Next <span style={{ color: ACCENT }}>Event</span>
          </h1>

          <div className="flex-1 min-h-8 md:min-h-0" />

          {loading && (
            <div className="rounded-xl h-[72px] md:h-24 motion-skeleton shrink-0"
              style={{ border: `1px solid ${PALETTE.border}` }} />
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
                      <OdometerNumber value={val} style={{ color: ACCENT_GLOW, fontSize: 20, lineHeight: 1 }} className="font-extrabold tabular-nums" />
                      <div style={{ color: PALETTE.secondary, fontSize: 8 }} className="uppercase tracking-widest mt-1 font-bold md:text-[9px]">{k}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {!loading && btns.length > 0 && (
            <div className="md:hidden flex gap-2 mt-3 w-full shrink-0 motion-hero-actions">
              {btns.map((b, i) => (
                <EventCtaButton key={i} label={b.label} url={b.url} variant={getCtaVariant(i, btns.length)}
                  className="flex-1 px-2 py-2.5 text-xs min-w-0" />
              ))}
            </div>
          )}
        </div>

        <div ref={ctaRef} className="hidden md:flex relative z-10 w-[42%] shrink-0 flex-col justify-end items-end p-8 motion-parallax-layer">
          {!loading && btns.length > 0 && (
            <div className="flex gap-3 motion-hero-actions">
              {btns.map((b, i) => (
                <EventCtaButton key={i} label={b.label} url={b.url} variant={getCtaVariant(i, btns.length)}
                  className="px-5 py-2.5 text-sm whitespace-nowrap" />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
