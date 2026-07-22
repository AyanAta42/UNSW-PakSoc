import { useEffect, useRef } from 'react'
import type { DbEvent } from '@/events/types/Event'
import { DeferredMapEmbed } from '@/maps/components/DeferredMapEmbed'
import { mapEmbedSrc, mapLinkUrl } from '@/maps/components/CachedMapEmbed'
import { EventDetailContent }          from './EventDetailContent'
import { ACCENT, PALETTE } from '@/config/theme'
import { PinIcon } from '@/shared/components/MetaIcons'

interface Props { mapEvent: DbEvent | null; featured: DbEvent | null; now: Date }

export function LocationSidebar({ mapEvent, featured, now }: Props) {
  const desktopMapSrc = mapEvent ? mapEmbedSrc(mapEvent.location) : null
  const ref = useRef<HTMLDivElement>(null)

  // The sidebar and the events + social wall column differ in height, so
  // scroll the sidebar at a different rate: the height gap is fed back in
  // proportionally to page scroll, so its bottom lands level with the social
  // wall's bottom exactly when the wall's bottom reaches the viewport.
  //
  // The scroll surface differs by build: a plain browser tab scrolls the
  // DOCUMENT (index.css unlocks `html.home-mounted` and drops `.home-scroll`
  // to `overflow: visible`), while the installed app locks the document and
  // scrolls INSIDE the `.home-scroll` container. Driving off `window.scrollY`
  // alone silently no-ops in the installed app (window never scrolls), which
  // left the sidebar's bottom un-aligned there. Resolve the real scroller.
  useEffect(() => {
    const el = ref.current
    const parent = el?.parentElement
    const left = parent?.previousElementSibling as HTMLElement | null
    if (!el || !parent || !left) return

    // `.home-scroll` is the container scroller only when it actually scrolls;
    // in a browser tab it's `overflow: visible`, so fall back to the document.
    const host = el.closest('.home-scroll') as HTMLElement | null
    const useContainer = !!host && /(auto|scroll)/.test(getComputedStyle(host).overflowY)
    const scroller = useContainer
      ? host!
      : ((document.scrollingElement as HTMLElement) ?? document.documentElement)
    const scrollTarget: Window | HTMLElement = useContainer ? host! : window

    let raf = 0
    const apply = () => {
      raf = 0
      const slack = left.offsetHeight - el.offsetHeight
      const viewport = useContainer ? scroller.clientHeight : window.innerHeight
      const scrollTop = useContainer ? scroller.scrollTop : window.scrollY
      // Left column's top in the scroller's own scroll-space (0 for the document).
      const originTop = useContainer ? scroller.getBoundingClientRect().top : 0
      const leftTop = left.getBoundingClientRect().top - originTop + scrollTop
      const end = leftTop + left.offsetHeight - viewport
      if (slack <= 0 || end <= 0) { el.style.transform = ''; return }
      const progress = Math.min(1, Math.max(0, scrollTop / end))
      el.style.transform = `translate3d(0, ${(progress * slack).toFixed(1)}px, 0)`
    }
    const schedule = () => { if (!raf) raf = requestAnimationFrame(apply) }
    apply()
    const ro = new ResizeObserver(schedule)
    ro.observe(el)
    ro.observe(left)
    scrollTarget.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      if (raf) cancelAnimationFrame(raf)
      ro.disconnect()
      scrollTarget.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      el.style.transform = ''
    }
  }, [])

  return (
    <div ref={ref} className="hidden lg:flex flex-col gap-4 flex-[3] will-change-transform">
      <div className="motion-glow">
      <div style={{ background: PALETTE.card, border: `1px solid ${PALETTE.border}`, borderRadius: 18, boxShadow: PALETTE.shadowMd }}
        className="overflow-hidden flex flex-col">
        <div className="px-5 pt-5 pb-3">
          <span style={{ color: PALETTE.muted }} className="text-[10px] font-bold tracking-widest uppercase">Event Location</span>
        </div>
        <div className="motion-map mx-5" style={{ height: 220, borderRadius: 16, border: `1px solid ${PALETTE.border}`, overflow: 'hidden' }}>
          {desktopMapSrc
            ? <DeferredMapEmbed cacheId="home-map-desktop" src={desktopMapSrc} linkHref={mapEvent ? mapLinkUrl(mapEvent.location) : undefined} title="Event location map" className="w-full h-full" delayMs={400} />
            : <div className="w-full h-full flex items-center justify-center" style={{ background: PALETTE.cardAlt }}>
                <span style={{ color: PALETTE.muted }} className="text-sm">No events to show</span>
              </div>
          }
        </div>
        {mapEvent
          ? <div className="px-5 py-3.5">
              <div style={{ color: PALETTE.dark }} className="font-bold text-sm mb-1">{mapEvent.name}</div>
              <div style={{ color: PALETTE.muted }} className="text-xs flex items-center gap-1.5">
                <PinIcon color={ACCENT} />{mapEvent.location}
              </div>
            </div>
          : <div className="px-5 py-3.5">
              <p style={{ color: PALETTE.muted }} className="text-sm m-0">No events scheduled.</p>
            </div>
        }
      </div>
      </div>

      {featured && (
        <div style={{ background: PALETTE.card, border: `1px solid ${PALETTE.border}`, borderRadius: 18, boxShadow: PALETTE.shadowMd }}
          className="overflow-hidden flex flex-col">
          <div className="px-5 pt-5 pb-5 flex flex-col gap-3.5">
            <EventDetailContent event={featured} now={now} />
          </div>
        </div>
      )}
    </div>
  )
}
