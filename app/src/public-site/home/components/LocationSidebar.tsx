import { useEffect, useRef } from 'react'
import type { DbEvent } from '@/events/types/Event'
import { DeferredMapEmbed } from '@/maps/components/DeferredMapEmbed'
import { mapEmbedSrc } from '@/maps/components/CachedMapEmbed'
import { EventDetailContent }          from './EventDetailContent'
import { ACCENT, PALETTE } from '@/config/theme'

interface Props { mapEvent: DbEvent | null; featured: DbEvent | null; now: Date }

const STICKY_TOP = 72
const BOTTOM_GAP = 20

export function LocationSidebar({ mapEvent, featured, now }: Props) {
  const desktopMapSrc = mapEvent ? mapEmbedSrc(mapEvent.location) : null
  const ref = useRef<HTMLDivElement>(null)

  // When the sidebar is taller than the viewport, shift the sticky anchor up so
  // it pins by its bottom edge — the timeline ends level with the story wall.
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const update = () => {
      const overflow = el.offsetHeight + STICKY_TOP + BOTTOM_GAP - window.innerHeight
      el.style.top = `${overflow > 0 ? STICKY_TOP - overflow : STICKY_TOP}px`
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    window.addEventListener('resize', update)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', update)
    }
  }, [])

  return (
    <div ref={ref} className="hidden lg:flex flex-col gap-4 flex-[3] sticky top-[72px]">
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
