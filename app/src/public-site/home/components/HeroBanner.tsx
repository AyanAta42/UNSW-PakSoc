import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import type { DbEvent } from '@/events/types/Event'
import { useCountdown }    from '@/shared/hooks/useCountdown'
import { getEventButtons, getCtaVariant } from '@/events/utils/getEventButtons'
import { EventCtaButton }  from '@/events/components/EventCtaButton'
import { prefersReducedMotion, useParallaxLayers, type ParallaxLayer } from '@/shared/motion'
import { ACCENT, ACCENT_GLOW, PALETTE } from '@/config/theme'

const HeroCelestialTrail = lazy(() =>
  import('./HeroCelestialTrail').then(m => ({ default: m.HeroCelestialTrail })),
)

interface Props { banner: DbEvent | null; loading: boolean }

const BG_DEPTH = 8
const GLOW_DEPTH = 16
const CONTENT_DEPTH = 3

export function HeroBanner({ banner, loading }: Props) {
  const cd   = useCountdown(banner?.time)
  const heroRef = useRef<HTMLDivElement>(null)
  const bgRef = useRef<HTMLDivElement>(null)
  const glowRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const ctaRef = useRef<HTMLDivElement>(null)
  const layersRef = useRef<ParallaxLayer[]>([])
  const [trailReady, setTrailReady] = useState(false)

  layersRef.current = [
    { depth: BG_DEPTH, el: bgRef.current },
    { depth: GLOW_DEPTH, el: glowRef.current },
    { depth: CONTENT_DEPTH, el: contentRef.current },
    { depth: CONTENT_DEPTH, el: ctaRef.current },
  ]
  useParallaxLayers(heroRef, layersRef)

  // Defer canvas trail until idle so first paint + popups stay free
  useEffect(() => {
    if (prefersReducedMotion()) return
    let idleId: number | undefined
    let timeoutId: ReturnType<typeof setTimeout> | undefined
    const go = () => setTrailReady(true)
    if (typeof window.requestIdleCallback === 'function') {
      idleId = window.requestIdleCallback(go, { timeout: 1200 })
    } else {
      timeoutId = setTimeout(go, 450)
    }
    return () => {
      if (idleId !== undefined && typeof window.cancelIdleCallback === 'function') {
        window.cancelIdleCallback(idleId)
      }
      if (timeoutId !== undefined) clearTimeout(timeoutId)
    }
  }, [])

  if (!banner && !loading) return null
  const btns = banner ? getEventButtons(banner.buttons) : []

  return (
    <div className="motion-glow motion-glow-hero px-4 pt-4 lg:p-0">
      <div className="motion-hero-enter">
      <div
        ref={heroRef}
        className="hero-clip overflow-hidden relative flex flex-col min-h-[200px] md:flex-row md:min-h-[250px] rounded-[18px]"
        style={{ borderRadius: 18, border: `1px solid ${PALETTE.border}`, boxShadow: PALETTE.shadowLg }}
      >

        {/* Layer 1: Dark emerald gradient */}
        <div ref={bgRef} aria-hidden className="absolute inset-0 motion-parallax-layer motion-hero-gradient" />

        {/* Layer 2: Soft aurora + right-side spotlight */}
        <div ref={glowRef} aria-hidden className="absolute inset-0 motion-parallax-layer">
          <div className="absolute -left-[8%] -top-[35%] w-[55%] h-[160%] motion-hero-aurora"
            style={{ background: 'radial-gradient(closest-side, rgba(34,197,94,0.35), transparent 72%)', filter: 'blur(70px)', opacity: 0.45 }} />
          <div className="motion-hero-spotlight" />
        </div>

        {/* Layer 3: Celestial trail (idle + lazy chunk) + faint grain */}
        {trailReady && (
          <Suspense fallback={null}>
            <HeroCelestialTrail />
          </Suspense>
        )}
        <div aria-hidden className="motion-hero-grain" />

        {/* Layer 4: Content */}
        <div ref={contentRef} className="relative z-10 flex flex-col p-5 md:p-8 flex-1 min-h-[200px] md:min-h-0 motion-parallax-layer">
          <h1 style={{ fontFamily: '"Satoshi", sans-serif', fontWeight: 900, color: '#F8FAFC' }}
            className="text-2xl md:text-[40px] tracking-tight m-0 leading-none shrink-0 motion-hero-title">
            Next <span style={{ color: ACCENT }}>Event</span>
          </h1>

          <div className="flex-1 min-h-6 md:min-h-0" />

          {(loading || !banner) && (
            <div className="rounded-xl h-[80px] md:h-28 motion-skeleton shrink-0"
              style={{ border: `1px solid ${PALETTE.border}` }} />
          )}

          {!loading && banner && (
            <div className="w-full md:w-fit shrink-0 motion-hero-details">
              <div style={{ color: '#F8FAFC' }} className="text-[15px] md:text-lg font-extrabold mb-3.5 truncate">{banner.name}</div>
              <div className="flex gap-2.5 w-fit">
                {(['days','hrs','mins','secs'] as const).map((k, i) => {
                  const val = [cd.days, cd.hrs, cd.mins, cd.secs][i]
                  const digits = String(Math.max(0, val)).padStart(2, '0').slice(-2)
                  return (
                    <div key={k} className="text-center min-w-[54px] md:min-w-[66px] shrink-0 px-2.5 py-2 md:px-3.5 md:py-2.5"
                      style={{ background: 'rgba(10,10,10,0.92)', border: `1px solid ${PALETTE.border}`, borderRadius: 14 }}>
                      {/* Plain digits — visible before CSS/odometer; never blocked on stylesheet */}
                      <div
                        style={{ color: ACCENT_GLOW, lineHeight: 1, fontWeight: 900, fontVariantNumeric: 'tabular-nums', fontSize: 'inherit' }}
                        className="font-black tabular-nums text-2xl md:text-[30px]"
                      >
                        {digits}
                      </div>
                      <div style={{ color: PALETTE.secondary, fontSize: 8 }} className="uppercase tracking-widest mt-1.5 font-bold md:text-[9px]">{k}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {!loading && btns.length > 0 && (
            <div className="md:hidden flex gap-2 mt-3 w-full shrink-0 motion-hero-actions">
              {btns.map((b, i) => {
                const variant = getCtaVariant(i, btns.length)
                return (
                  <EventCtaButton key={i} label={b.label} url={b.url} variant={variant}
                    className={`${variant === 'primary' ? 'flex-[1.18]' : 'flex-1'} px-2 py-2.5 text-xs min-w-0`} />
                )
              })}
            </div>
          )}
        </div>

        <div ref={ctaRef} className="hidden md:flex relative z-10 w-[42%] shrink-0 flex-col justify-end items-end p-7 motion-parallax-layer">
          {!loading && btns.length > 0 && (
            <div className="flex gap-3 items-stretch motion-hero-actions">
              {btns.map((b, i) => {
                const variant = getCtaVariant(i, btns.length)
                return (
                  <EventCtaButton key={i} label={b.label} url={b.url} variant={variant}
                    className={`${variant === 'primary' ? 'px-7' : 'px-5'} py-2.5 text-sm whitespace-nowrap`} />
                )
              })}
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  )
}

