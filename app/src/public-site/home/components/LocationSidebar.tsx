import { useEffect, useRef } from 'react'
import type { DbEvent } from '@/events/types/Event'
import { DeferredMapEmbed } from '@/maps/components/DeferredMapEmbed'
import { mapEmbedSrc } from '@/maps/components/CachedMapEmbed'
import { EventDetailContent }          from './EventDetailContent'
import { ACCENT, PALETTE } from '@/config/theme'

interface Props { mapEvent: DbEvent | null; featured: DbEvent | null; now: Date }

export function LocationSidebar({ mapEvent, featured, now }: Props) {
  const desktopMapSrc = mapEvent ? mapEmbedSrc(mapEvent.location) : null
  const ref = useRef<HTMLDivElement>(null)

  // The sidebar and the events + social wall column differ in height, so
  // scroll the sidebar at a different rate: the height gap is fed back in
  // proportionally to page scroll, so its bottom lands level with the social
  // wall's bottom exactly when the wall's bottom reaches the viewport.
  useEffect(() => {
    const el = ref.current
    const parent = el?.parentElement
    const left = parent?.previousElementSibling as HTMLElement | null
    if (!el || !parent || !left) return
    let raf = 0
    const apply = () => {
      raf = 0
      const slack = left.offsetHeight - el.offsetHeight
      const leftTop = left.getBoundingClientRect().top + window.scrollY
      const end = leftTop + left.offsetHeight - window.innerHeight
      if (slack === 0 || end <= 0) { el.style.transform = ''; return }
      const progress = Math.min(1, Math.max(0, window.scrollY / end))
      el.style.transform = `translate3d(0, ${(progress * slack).toFixed(1)}px, 0)`
    }
    const schedule = () => { if (!raf) raf = requestAnimationFrame(apply) }
    apply()
    const ro = new ResizeObserver(schedule)
    ro.observe(el)
    ro.observe(left)
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      if (raf) cancelAnimationFrame(raf)
      ro.disconnect()
      window.removeEventListener('scroll', schedule)
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
            ? <DeferredMapEmbed cacheId="home-map-desktop" src={desktopMapSrc} title="Event location map" className="w-full h-full" delayMs={400} />
            : <div className="w-full h-full flex items-center justify-center" style={{ background: PALETTE.cardAlt }}>
                <span style={{ color: PALETTE.muted }} className="text-sm">No events to show</span>
              </div>
          }
        </div>
        {mapEvent
          ? <div className="px-5 py-3.5">
              <div style={{ color: PALETTE.dark }} className="font-bold text-sm mb-1">{mapEvent.name}</div>
              <div style={{ color: PALETTE.muted }} className="text-xs flex items-center gap-1.5">
                <span style={{ color: ACCENT }}>◎</span>{mapEvent.location}
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
