import type { DbEvent } from '@/events/types/Event'
import { CachedMapEmbed, mapEmbedSrc } from '@/maps/components/CachedMapEmbed'
import { EventDetailContent }          from '@/public-site/home/components/EventDetailContent'
import { getEventButtons }             from '@/events/utils/getEventButtons'
import { EventCtaButton }              from '@/events/components/EventCtaButton'
import { PALETTE } from '@/config/theme'

interface Props { event: DbEvent; now: Date; onClose: () => void }

export function EventDetailModal({ event, now, onClose }: Props) {
  const upcoming = new Date(event.time) > now
  const btns     = getEventButtons(event.buttons)

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-6">
      <div className="absolute inset-0 bg-black/45 backdrop-blur-[2px]" onClick={onClose} />
      <div style={{ background: PALETTE.card, boxShadow: '0 8px 40px rgba(0,0,0,0.18)' }}
        className="relative w-full sm:max-w-lg rounded-t-[28px] sm:rounded-2xl max-h-[88vh] flex flex-col"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b shrink-0" style={{ borderColor: PALETTE.border }}>
          <span style={{ color: PALETTE.muted }} className="text-[11px] font-bold uppercase tracking-widest">Event Details</span>
          <button onClick={onClose} style={{ color: PALETTE.muted, border: `1px solid ${PALETTE.border}` }}
            className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-lg leading-none cursor-pointer">×</button>
        </div>
        <div className="overflow-y-auto px-5 py-5 flex flex-col gap-4">
          <EventDetailContent event={event} now={now} />
          <div>
            <div style={{ color: PALETTE.dark }} className="text-[11px] font-bold uppercase tracking-widest mb-2">Location</div>
            <div className="rounded-xl overflow-hidden border" style={{ height: 180, borderColor: PALETTE.border }}>
              <CachedMapEmbed cacheId={`all-events-${event.id}`} src={mapEmbedSrc(event.location)} title="Event location map" className="w-full h-full" />
            </div>
          </div>
          {upcoming && btns.length > 0 && (
            <div className="flex flex-col gap-2">
              {btns.map((b, i) => (
                <EventCtaButton key={i} label={b.label} url={b.url} variant={i === 0 ? 'filled' : 'outline'}
                  className="w-full py-3.5 text-sm" />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
