import { useRef } from 'react'
import type { DbEvent } from '@/events/types/Event'
import { CachedMapEmbed, mapEmbedSrc } from '@/maps/components/CachedMapEmbed'
import { EventDetailContent }          from './EventDetailContent'
import { getEventButtons }             from '@/events/utils/getEventButtons'
import { EventCtaButton }              from '@/events/components/EventCtaButton'
import { ACCENT, PALETTE }             from '@/config/theme'

interface Props { event: DbEvent; now: Date; onClose: () => void }

const CLOSE_THRESHOLD = 60

export function MobileEventSheet({ event, now, onClose }: Props) {
  const upcoming  = new Date(event.time) > now
  const btns      = getEventButtons(event.buttons)
  const scrollRef = useRef<HTMLDivElement>(null)
  const startYRef = useRef<number | null>(null)

  function onTouchStart(e: React.TouchEvent) { startYRef.current = e.touches[0].clientY }
  function onTouchEnd(e: React.TouchEvent) {
    if (startYRef.current === null) return
    const delta = e.changedTouches[0].clientY - startYRef.current
    if ((scrollRef.current?.scrollTop ?? 0) === 0 && delta > CLOSE_THRESHOLD) onClose()
    startYRef.current = null
  }

  return (
    <div className="fixed inset-0 z-[60] lg:hidden">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[3px]" onClick={onClose} />
      <div
        style={{
          background:  PALETTE.modal,
          boxShadow:   '0 -8px 60px rgba(0,0,0,0.6)',
          borderTop:   `1px solid ${PALETTE.border}`,
          borderRadius: '24px 24px 0 0',
        }}
        className="absolute bottom-0 left-0 right-0 max-h-[88vh] flex flex-col animate-[slideUp_0.28s_ease-out]"
        onClick={e => e.stopPropagation()}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}>

        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-2 shrink-0">
          <div className="w-10 h-1 rounded-full" style={{ background: PALETTE.border }} />
        </div>

        <div className="flex items-center justify-between px-5 pb-3 shrink-0">
          <span style={{ color: PALETTE.muted }} className="text-[10px] font-bold uppercase tracking-widest">Event Schedule</span>
          <button onClick={onClose}
            style={{ color: PALETTE.muted, border: `1px solid ${PALETTE.border}`, background: PALETTE.cardAlt, borderRadius: '50%' }}
            className="w-8 h-8 flex items-center justify-center text-lg leading-none cursor-pointer hover:border-white/30 transition-colors">×</button>
        </div>

        <div ref={scrollRef} className="overflow-y-auto px-5 pb-8 flex flex-col gap-5">
          {/* Details — buttons hidden here, only shown below map */}
          <EventDetailContent event={event} now={now} hideButtons />

          {(event.timeline ?? []).length === 0 && (
            <p style={{ color: PALETTE.muted }} className="text-sm m-0 py-1 text-center">No schedule posted yet.</p>
          )}

          {/* Map */}
          <div>
            <div style={{ color: PALETTE.muted }} className="text-[10px] font-bold uppercase tracking-widest mb-2.5">Location</div>
            <div style={{ height: 200, borderRadius: 16, border: `1px solid ${PALETTE.border}`, overflow: 'hidden', background: PALETTE.card }}>
              <CachedMapEmbed cacheId="home-map-sheet" src={mapEmbedSrc(event.location)} title="Event location map" className="w-full h-full" />
            </div>
            <div style={{ color: PALETTE.muted }} className="text-xs mt-2 flex items-center gap-1.5">
              <span style={{ color: ACCENT }}>◎</span>{event.location}
            </div>
          </div>

          {/* CTA buttons — only here */}
          {upcoming && btns.length > 0 && (
            <div className="flex flex-col gap-2.5">
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
