import { lazy, Suspense, useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { DbEvent } from '@/events/types/Event'
import { useCountdown }    from '@/shared/hooks/useCountdown'
import { getEventButtons, getCtaVariant } from '@/events/utils/getEventButtons'
import { EventCtaButton }  from '@/events/components/EventCtaButton'
import { prefersReducedMotion, useParallaxLayers, useEnterOnce, type ParallaxLayer } from '@/shared/motion'
import { ACCENT, ACCENT_GLOW, PALETTE } from '@/config/theme'

const HeroCelestialTrail = lazy(() =>
  import('./HeroCelestialTrail').then(m => ({ default: m.HeroCelestialTrail })),
)

interface Props { banner: DbEvent | null; loading: boolean }

/** Banner note red — one colour and one weight for the whole line; the amount
 *  inside it leads on size alone. Clears 5:1 on the hero's near-black backdrop. */
const NOTE_COLOR = '#F87171'

const BG_DEPTH = 8
const GLOW_DEPTH = 16
const CONTENT_DEPTH = 3

export function HeroBanner({ banner, loading }: Props) {
  const cd   = useCountdown(banner?.time)
  const heroRef = useRef<HTMLDivElement>(null)
  const bgRef = useRef<HTMLDivElement>(null)
  const glowRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const layersRef = useRef<ParallaxLayer[]>([])
  const titleRef = useRef<HTMLHeadingElement>(null)
  const [trailReady, setTrailReady] = useState(false)
  // Only slide the hero in on the first visit this session — on a back/forward
  // remount it should already be there, not re-animate from black.
  const animateEnter = useEnterOnce('hero')

  // Shrink the headline font just enough that the full name fits on one line
  useLayoutEffect(() => {
    const el = titleRef.current
    if (!el) return
    const fit = () => {
      el.style.fontSize = ''
      if (el.scrollWidth > el.clientWidth) {
        const base = parseFloat(getComputedStyle(el).fontSize)
        const ratio = Math.max(el.clientWidth / el.scrollWidth, 0.35)
        el.style.fontSize = `${base * ratio * 0.98}px`
      }
    }
    fit()
    document.fonts?.ready.then(fit)
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [banner?.name, loading])

  layersRef.current = [
    { depth: BG_DEPTH, el: bgRef.current },
    { depth: GLOW_DEPTH, el: glowRef.current },
    { depth: CONTENT_DEPTH, el: contentRef.current },
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

  // Free-text note under the CTAs, e.g. "Final Release At $75". The first
  // currency amount in it is split out so it keeps the weight and hotter shade
  // the price had back when this was a separate numeric field; the surrounding
  // text is left exactly as typed, punctuation and spacing included.
  const note = banner?.banner_note?.trim() ?? ''
  const amountMatch = note.match(/\$\s?\d[\d,]*(?:\.\d{1,2})?/)
  const noteHead   = amountMatch ? note.slice(0, amountMatch.index) : note
  const noteAmount = amountMatch?.[0] ?? ''
  const noteTail   = amountMatch ? note.slice(amountMatch.index! + noteAmount.length) : ''

  return (
    <div className="motion-glow motion-glow-hero px-3 pt-4 md:px-4 lg:p-0">
      <div className={animateEnter ? 'motion-hero-enter' : undefined}>
      <div
        ref={heroRef}
        className="hero-clip overflow-hidden relative flex flex-col min-h-[220px] md:flex-row md:min-h-[250px] rounded-[18px] border"
        style={{ borderColor: PALETTE.border, boxShadow: PALETTE.shadowLg }}
      >

        {/* Layer 1: Dark emerald gradient */}
        <div ref={bgRef} aria-hidden className="absolute inset-0 motion-parallax-layer motion-hero-gradient" />

        {/* Layer 2: Soft aurora (right) + spotlight + crescent moon */}
        <div ref={glowRef} aria-hidden className="absolute inset-0 motion-parallax-layer">
          <div className="absolute -right-[8%] -top-[35%] w-[55%] h-[160%] motion-hero-aurora"
            style={{ background: 'radial-gradient(closest-side, rgba(34,197,94,0.3), rgba(34,211,238,0.08) 55%, transparent 80%)', opacity: 0.5 }} />
          <div className="motion-hero-spotlight" />
          <div className="hero-moon-wrap">
            <div className="hero-moon" />
          </div>
        </div>

        {/* Layer 3: Celestial trail (idle + lazy chunk) + faint grain */}
        {trailReady && (
          <Suspense fallback={null}>
            <HeroCelestialTrail />
          </Suspense>
        )}
        <div aria-hidden className="motion-hero-grain" />

        {/* Layer 4: Content */}
        {/* Content is bottom-anchored, so trailing padding is the only thing
            below the last line. The teaser's descender-light text made the
            default gap read as dead space — trim it when the teaser is on. */}
        <div ref={contentRef} className={`relative z-10 flex flex-col p-5 md:p-8 ${note ? 'pb-3.5 md:pb-6' : ''} flex-1 min-w-0 min-h-[220px] md:min-h-0 motion-parallax-layer`}>
          <div className="flex items-center gap-2.5 shrink-0 motion-hero-title">
            <span aria-hidden className="h-px w-7"
              style={{ background: `linear-gradient(90deg, ${ACCENT}, transparent)` }} />
            <span style={{ fontFamily: '"Satoshi", sans-serif', color: ACCENT_GLOW, letterSpacing: '0.3em' }}
              className="uppercase text-[10px] md:text-[11px] font-bold">
              Next Event
            </span>
          </div>

          <div className="flex-1 min-h-5 md:min-h-0" />

          {(loading || !banner) && (
            <div className="rounded-xl h-[110px] md:h-32 motion-skeleton shrink-0"
              style={{ border: `1px solid ${PALETTE.border}` }} />
          )}

          {!loading && banner && (
            <div className="w-full shrink-0 motion-hero-details">
              <h1 ref={titleRef}
                className="hero-title-text m-0 whitespace-nowrap max-w-[87%] md:max-w-[560px] text-[34px] leading-[1.2] md:text-[54px] md:leading-[1.15] pr-1">
                {banner.name}
              </h1>

              {/* Timer + CTAs share one wrapping row: the buttons sit beside the
                  countdown while they fit on a single line, and drop to their own
                  full row underneath the moment the two labels can't. */}
              <div className="flex flex-wrap items-end gap-x-4 gap-y-3 mt-3.5 md:mt-4">
                <div className="flex gap-2.5 shrink-0">
                  {(['days','hrs','mins','secs'] as const).map((k, i) => {
                    const val = [cd.days, cd.hrs, cd.mins, cd.secs][i]
                    const digits = String(Math.max(0, val)).padStart(2, '0').slice(-2)
                    return (
                      <div key={k} className="text-center min-w-[52px] md:min-w-[66px] shrink-0 px-2.5 py-2 md:px-3.5 md:py-2.5"
                        style={{ background: 'rgba(10,10,10,0.92)', border: `1px solid ${PALETTE.border}`, borderRadius: 14 }}>
                        <div
                          style={{ fontFamily: '"Satoshi", sans-serif', color: ACCENT_GLOW, lineHeight: 1, fontWeight: 900, fontVariantNumeric: 'tabular-nums' }}
                          className="font-black tabular-nums text-2xl md:text-[30px]"
                        >
                          {digits}
                        </div>
                        <div style={{ color: PALETTE.secondary, fontSize: 8 }} className="uppercase tracking-widest mt-1.5 font-bold md:text-[9px]">{k}</div>
                      </div>
                    )
                  })}
                </div>

                {(btns.length > 0 || !!note) && (
                  <div className="flex flex-col gap-2 w-full md:w-auto md:ml-auto motion-hero-actions">
                    {btns.length > 0 && (
                      <div className="flex flex-col md:flex-row gap-2 md:gap-2.5 items-stretch">
                        {btns.map((b, i) => {
                          const variant = getCtaVariant(i, btns.length)
                          return (
                            <EventCtaButton key={i} label={b.label} url={b.url} variant={variant}
                              className={`w-full md:w-auto md:flex-none ${variant === 'primary' ? 'px-3 md:px-5' : 'px-3 md:px-4'} py-2 text-sm whitespace-nowrap text-center`} />
                          )
                        })}
                      </div>
                    )}
                    {/* Plain inline text, not flex — a flex gap would inject space
                        around the amount and break notes like "$75....". Inline
                        boxes already share a baseline with the larger amount. */}
                    {note && (
                      <p style={{ color: NOTE_COLOR }}
                        className="m-0 mt-0.5 text-[15px] md:text-base font-semibold text-center md:text-right">
                        {noteHead}
                        {noteAmount && (
                          <span className="tabular-nums text-[17px] md:text-[18px]">
                            {noteAmount}
                          </span>
                        )}
                        {noteTail}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  )
}

