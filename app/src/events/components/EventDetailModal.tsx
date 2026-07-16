import type { DbEvent } from '@/events/types/Event'
import { CachedMapEmbed, mapEmbedSrc } from '@/maps/components/CachedMapEmbed'
import { EventDetailContent }          from '@/public-site/home/components/EventDetailContent'
import { getEventButtons }             from '@/events/utils/getEventButtons'
import { EventCtaButton }              from '@/events/components/EventCtaButton'
import { ACCENT, PALETTE } from '@/config/theme'

interface Props { event: DbEvent; now: Date; onClose: () => void }

export function EventDetailModal({ event, now, onClose }: Props) {
  const upcoming = new Date(event.time) > now
  const btns     = getEventButtons(event.buttons)

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-6">
      <div className="motion-backdrop absolute inset-0 bg-black/60 backdrop-blur-[3px]" onClick={onClose} />
      <div style={{ background: PALETTE.modal, boxShadow: PALETTE.shadowLg, borderRadius: 24, border: `1px solid ${PALETTE.border}` }}
        className="motion-modal relative w-full sm:max-w-lg rounded-t-[24px] sm:rounded-[24px] max-h-[88vh] flex flex-col"
        onClick={e => e.stopPropagation()}>

        <div className="flex items-center justify-between px-6 py-4 shrink-0"
          style={{ borderBottom: `1px solid ${PALETTE.border}` }}>
          <span style={{ color: PALETTE.muted }} className="text-[11px] font-bold uppercase tracking-widest">Event Details</span>
          <button onClick={onClose}
            style={{ color: PALETTE.muted, border: `1px solid ${PALETTE.border}`, background: PALETTE.cardAlt, borderRadius: '50%' }}
            className="w-8 h-8 flex items-center justify-center text-lg leading-none cursor-pointer hover:border-white/30 transition-colors">×</button>
        </div>

        <div className="overflow-y-auto px-6 py-5 flex flex-col gap-4">
          <EventDetailContent event={event} now={now} />
          <div>
            <div style={{ color: PALETTE.muted }} className="text-[10px] font-bold uppercase tracking-widest mb-2">Location</div>
            <div style={{ height: 180, borderRadius: 16, border: `1px solid ${PALETTE.border}`, overflow: 'hidden' }}>
              <CachedMapEmbed cacheId={`all-events-${event.id}`} src={mapEmbedSrc(event.location)} title="Event location map" className="w-full h-full" />
            </div>
            <div style={{ color: PALETTE.muted }} className="text-xs mt-2 flex items-center gap-1.5">
              <span style={{ color: ACCENT }}>◎</span>{event.location}
            </div>
          </div>
          {upcoming && btns.length > 0 && (
            <div className="flex flex-col gap-2">
              {btns.map((b, i) => (
                <EventCtaButton key={i} label={b.label} url={b.url} variant={i === 0 ? 'primary' : 'secondary'}
                  className="w-full py-3.5 text-sm" />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
