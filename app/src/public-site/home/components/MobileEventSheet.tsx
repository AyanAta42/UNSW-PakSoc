import type { DbEvent } from '@/events/types/Event'
import { CachedMapEmbed, mapEmbedSrc } from '@/maps/components/CachedMapEmbed'
import { EventDetailContent }          from './EventDetailContent'
import { TICKETS_URL }    from '@/config/externalLinks'
import { PALETTE, ACCENT } from '@/config/theme'

interface Props {
  event:   DbEvent
  now:     Date
  onClose: () => void
}

/** Bottom-sheet shown on mobile when a user taps an event card. */
export function MobileEventSheet({ event, now, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-[60] lg:hidden">
      <div className="absolute inset-0 bg-black/45 backdrop-blur-[2px]" onClick={onClose} />
      <div style={{ background: PALETTE.card, boxShadow: '0 -8px 40px rgba(0,0,0,0.18)' }}
        className="absolute bottom-0 left-0 right-0 rounded-t-[28px] max-h-[88vh] flex flex-col animate-[slideUp_0.28s_ease-out]"
        onClick={e => e.stopPropagation()}>
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full" style={{ background: PALETTE.border }} />
        </div>
        <div className="flex items-center justify-between px-5 pb-3 shrink-0">
          <span style={{ color: PALETTE.muted }} className="text-[11px] font-bold uppercase tracking-widest">Event Schedule</span>
          <button onClick={onClose} style={{ color: PALETTE.muted, border: `1px solid ${PALETTE.border}` }}
            className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-lg leading-none cursor-pointer">×</button>
        </div>
        <div className="overflow-y-auto px-5 pb-6 flex flex-col gap-4">
          <EventDetailContent event={event} now={now} />
          {(event.timeline ?? []).length === 0 && <p style={{ color: PALETTE.muted }} className="text-sm m-0 py-2 text-center">No schedule posted yet for this event.</p>}
          <div>
            <div style={{ color: PALETTE.dark }} className="text-[11px] font-bold uppercase tracking-widest mb-2">Location</div>
            <div className="rounded-xl overflow-hidden border" style={{ height: 180, borderColor: PALETTE.border }}>
              <CachedMapEmbed cacheId="home-map-sheet" src={mapEmbedSrc(event.location)} title="Event location map" className="w-full h-full" />
            </div>
            <div style={{ color: PALETTE.muted }} className="text-xs mt-2 flex items-center gap-1.5"><span style={{ color: ACCENT }}>◎</span>{event.location}</div>
            <div style={{ color: '#9CA3AF' }} className="text-[11px] mt-1">Kensington Campus, UNSW</div>
          </div>
          {new Date(event.time) > now && (
            <a href={TICKETS_URL} target="_blank" rel="noopener noreferrer" style={{ background: '#C8FF00', color: '#111827' }}
              className="w-full flex items-center justify-center rounded-xl py-3.5 font-bold text-sm no-underline active:scale-[0.98] transition-transform">
              Get Your Tickets →
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
