import type { DbEvent } from '@/events/types/Event'
import { CachedMapEmbed, mapEmbedSrc } from '@/maps/components/CachedMapEmbed'
import { EventDetailContent }          from './EventDetailContent'
import { PALETTE } from '@/config/theme'

interface Props {
  mapEvent:  DbEvent | null
  featured:  DbEvent | null
  now:       Date
}

/** Desktop right sidebar: interactive map + currently selected event detail. */
export function LocationSidebar({ mapEvent, featured, now }: Props) {
  const desktopMapSrc = mapEvent ? mapEmbedSrc(mapEvent.location) : null

  return (
    <div className="hidden lg:flex flex-col gap-4 flex-[3] sticky top-[72px]">
      <div className="rounded-2xl bg-white border border-[#E5E7EB] shadow-[0_2px_8px_rgba(0,0,0,0.07),0_1px_2px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col">
        <div className="px-5 pt-5 pb-3">
          <span style={{ color: PALETTE.dark }} className="text-sm font-extrabold tracking-widest uppercase">Event Location</span>
        </div>
        <div className="mx-5 rounded-xl overflow-hidden border" style={{ height: 220, borderColor: PALETTE.border }}>
          {desktopMapSrc
            ? <CachedMapEmbed cacheId="home-map-desktop" src={desktopMapSrc} title="Event location map" className="w-full h-full" />
            : <div className="w-full h-full flex items-center justify-center" style={{ background: '#F3F4F6' }}><span style={{ color: PALETTE.muted }} className="text-sm">No events to show</span></div>
          }
        </div>
        {mapEvent
          ? <div className="px-5 py-3"><div style={{ color: PALETTE.dark }} className="font-extrabold text-base mb-0.5">{mapEvent.name}</div><div style={{ color: PALETTE.muted }} className="text-xs mb-0.5 flex items-center gap-1.5"><span style={{ color: '#22C55E' }}>◎</span>{mapEvent.location}</div><div style={{ color: '#9CA3AF' }} className="text-xs">Kensington Campus, UNSW</div></div>
          : <div className="px-5 py-3"><p style={{ color: PALETTE.muted }} className="text-sm m-0">No events scheduled.</p></div>
        }
      </div>
      {featured && (
        <div className="rounded-2xl bg-white border border-[#E5E7EB] shadow-[0_2px_8px_rgba(0,0,0,0.07),0_1px_2px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col">
          <div className="px-5 pt-5 pb-4 flex flex-col gap-3">
            <EventDetailContent event={featured} now={now} />
          </div>
        </div>
      )}
    </div>
  )
}
