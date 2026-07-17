import { useEffect, useRef, useState } from 'react'
import type { DbEvent } from '@/events/types/Event'
import { DeferredMapEmbed } from '@/maps/components/DeferredMapEmbed'
import { mapEmbedSrc } from '@/maps/components/CachedMapEmbed'
import { EventDetailContent }          from './EventDetailContent'
import { getEventButtons, getCtaVariant }             from '@/events/utils/getEventButtons'
import { EventCtaButton }              from '@/events/components/EventCtaButton'
import { ACCENT, PALETTE }             from '@/config/theme'

interface Props { event: DbEvent; now: Date; onClose: () => void }

const CLOSE_THRESHOLD = 60
const CLOSE_DURATION_MS = 220

export function MobileEventSheet({ event, now, onClose }: Props) {
  const upcoming  = new Date(event.time) > now
  const btns      = getEventButtons(event.buttons)
  const scrollRef = useRef<HTMLDivElement>(null)
  const startYRef = useRef<number | null>(null)
  const closeTimerRef = useRef<ReturnType<typeof setTimeout>>()
  const [dragY, setDragY] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [closing, setClosing] = useState(false)

  useEffect(() => () => clearTimeout(closeTimerRef.current), [])

  function closeWithAnimation() {
    if (closing) return
    setClosing(true)
    closeTimerRef.current = setTimeout(onClose, CLOSE_DURATION_MS)
  }

  function onTouchStart(e: React.TouchEvent) {
    if ((scrollRef.current?.scrollTop ?? 0) > 0 || closing) return
    startYRef.current = e.touches[0].clientY
    setDragging(true)
  }

  function onTouchMove(e: React.TouchEvent) {
    if (startYRef.current === null || closing) return
    const delta = e.touches[0].clientY - startYRef.current
    if (delta <= 0) return
    e.preventDefault()
    setDragY(delta)
  }

  function onTouchEnd(e: React.TouchEvent) {
    if (startYRef.current === null) return
    const delta = e.changedTouches[0].clientY - startYRef.current
    startYRef.current = null
    setDragging(false)
    if (delta > CLOSE_THRESHOLD) {
      closeWithAnimation()
      return
    }
    setDragY(0)
  }

  return (
    <div className="fixed inset-0 z-[60]">
      <div
        className="absolute inset-0 bg-black/55 transition-opacity duration-[220ms]"
        style={{ opacity: closing ? 0 : Math.max(0, 1 - dragY / 500) }}
        onClick={closeWithAnimation}
      />
      <div
        style={{
          background:  PALETTE.modal,
          boxShadow:   '0 -8px 60px rgba(0,0,0,0.6)',
          borderTop:   `1px solid ${PALETTE.border}`,
          borderRadius: '24px 24px 0 0',
          transform: closing ? 'translateY(100%)' : dragY > 0 ? `translateY(${dragY}px)` : undefined,
          transition: dragging ? 'none' : `transform ${CLOSE_DURATION_MS}ms cubic-bezier(0.4, 0, 1, 1)`,
          willChange: 'transform',
        }}
        className="absolute bottom-0 left-0 right-0 max-h-[88vh] flex flex-col animate-[slideUp_0.22s_ease-out]"
        onClick={e => e.stopPropagation()}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}>

        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-2 shrink-0">
          <div className="w-10 h-1 rounded-full" style={{ background: PALETTE.border }} />
        </div>

        <div className="flex items-center justify-between px-5 pb-3 shrink-0">
          <span style={{ color: PALETTE.muted }} className="text-[10px] font-bold uppercase tracking-widest">Event Schedule</span>
          <button onClick={closeWithAnimation}
            style={{ color: PALETTE.muted, border: `1px solid ${PALETTE.border}`, background: PALETTE.cardAlt, borderRadius: '50%' }}
            className="w-8 h-8 flex items-center justify-center text-lg leading-none cursor-pointer hover:border-white/30 transition-colors">×</button>
        </div>

        <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto px-5 pb-4 flex flex-col gap-5">
          {/* Details — buttons hidden here, pinned in footer below */}
          <EventDetailContent event={event} now={now} hideButtons />

          {(event.timeline ?? []).length === 0 && (
            <p style={{ color: PALETTE.muted }} className="text-sm m-0 py-1 text-center">No schedule posted yet.</p>
          )}

          {/* Map */}
          <div>
            <div style={{ color: PALETTE.muted }} className="text-[10px] font-bold uppercase tracking-widest mb-2.5">Location</div>
            <div style={{ height: 200, borderRadius: 16, border: `1px solid ${PALETTE.border}`, overflow: 'hidden', background: PALETTE.card }}>
              <DeferredMapEmbed cacheId="home-map-sheet" src={mapEmbedSrc(event.location)} title="Event location map" className="w-full h-full" delayMs={280} />
            </div>
            <div style={{ color: PALETTE.muted }} className="text-xs mt-2 flex items-center gap-1.5">
              <span style={{ color: ACCENT }}>◎</span>{event.location}
            </div>
          </div>
        </div>

        {/* Pinned CTA buttons — always visible */}
        {upcoming && btns.length > 0 && (
          <div
            style={{
              background: PALETTE.modal,
              borderTop: `1px solid ${PALETTE.border}`,
              boxShadow: '0 -8px 24px rgba(0,0,0,0.35)',
            }}
            className="shrink-0 px-5 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] flex flex-col gap-2.5"
          >
            {btns.map((b, i) => (
              <EventCtaButton key={i} label={b.label} url={b.url} variant={getCtaVariant(i, btns.length)}
                className="w-full py-3.5 text-sm" />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
