import type { DbEvent } from '@/events/types/Event'
import { DeferredMapEmbed } from '@/maps/components/DeferredMapEmbed'
import { mapEmbedSrc, mapLinkUrl } from '@/maps/components/CachedMapEmbed'
import { EventDetailContent }          from './EventDetailContent'
import { getEventButtons, getCtaVariant }             from '@/events/utils/getEventButtons'
import { EventCtaButton }              from '@/events/components/EventCtaButton'
import { ACCENT, PALETTE }             from '@/config/theme'
import { PinIcon }                     from '@/shared/components/MetaIcons'
import { useSheetSwipe }               from '@/shared/hooks/useSheetSwipe'
import { isStandalone }                from '@/shared/pwa/installPrompt'

interface Props { event: DbEvent; now: Date; onClose: () => void; mapCacheId?: string }

export function MobileEventSheet({ event, now, onClose, mapCacheId = 'home-map-sheet' }: Props) {
  const upcoming  = new Date(event.time) > now
  const btns      = getEventButtons(event.buttons)
  // This sheet only ever mounts on the home route, where `body`/`html` are
  // already locked permanently by CSS while in the installed standalone app
  // (index.css, `display-mode: standalone`) — the real scroll happens inside
  // `.home-scroll`, not the document. Locking scroll again here on top of that
  // is what was causing a laggy black layer to flash in as the sheet opened:
  // on iOS specifically, toggling `body.style.position` on an already-locked
  // document can make WKWebView reconsider its layout viewport and briefly
  // show its own chrome. Skip it there; only the mobile-browser-tab case
  // (not yet installed) actually needs this lock.
  const { sheetRef, scrollRef, close, backdropOpacity, sheetStyle, touchHandlers } = useSheetSwipe(onClose, true, !isStandalone())

  return (
    <div className="fixed inset-0 z-[60]">
      <div
        className="absolute inset-0 bg-black/55 transition-opacity duration-[220ms] touch-none"
        style={{ opacity: backdropOpacity }}
        onClick={close}
      />
      <div
        ref={sheetRef}
        style={{
          background:  PALETTE.modal,
          boxShadow:   '0 -8px 60px rgba(0,0,0,0.6)',
          borderTop:   `1px solid ${PALETTE.border}`,
          borderRadius: '24px 24px 0 0',
          ...sheetStyle,
        }}
        className="absolute bottom-0 left-0 right-0 max-h-[85dvh] flex flex-col animate-[slideUp_0.22s_ease-out]"
        onClick={e => e.stopPropagation()}
        {...touchHandlers}>

        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-2 shrink-0">
          <div className="w-10 h-1 rounded-full" style={{ background: PALETTE.border }} />
        </div>

        <div className="flex items-center justify-between px-5 pb-3 shrink-0">
          <span style={{ color: PALETTE.muted }} className="text-[10px] font-bold uppercase tracking-widest">Event Schedule</span>
          <button onClick={close}
            style={{ color: PALETTE.muted, border: `1px solid ${PALETTE.border}`, background: PALETTE.cardAlt, borderRadius: '50%' }}
            className="w-8 h-8 flex items-center justify-center text-lg leading-none cursor-pointer hover:border-white/30 transition-colors">×</button>
        </div>

        <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 pb-4 flex flex-col gap-5">
          {/* Details — buttons hidden here, pinned in footer below */}
          <EventDetailContent event={event} now={now} hideButtons />

          {(event.timeline ?? []).length === 0 && (
            <p style={{ color: PALETTE.muted }} className="text-sm m-0 py-1 text-center">No schedule posted yet.</p>
          )}

          {/* Map — shown for every event, past or upcoming, so it's useful as a
              record of where something happened too, not just directions. */}
          <div>
            <div style={{ color: PALETTE.muted }} className="text-[10px] font-bold uppercase tracking-widest mb-2.5">Location</div>
            <div style={{ height: 200, borderRadius: 16, border: `1px solid ${PALETTE.border}`, overflow: 'hidden', background: PALETTE.card }}>
              <DeferredMapEmbed cacheId={mapCacheId} src={mapEmbedSrc(event.location)} linkHref={mapLinkUrl(event.location)} title="Event location map" className="w-full h-full" delayMs={280} />
            </div>
            <div style={{ color: PALETTE.muted }} className="text-xs mt-2 flex items-center gap-1.5">
              <PinIcon color={ACCENT} />{event.location}
            </div>
          </div>
        </div>

        {/* Pinned CTA buttons — shown for every event so a past one still reads
            the same as an upcoming one; past events just get them stale/grayed
            out with no link, since there's nothing left to register/buy into. */}
        {btns.length > 0 && (
          <div
            className="shrink-0 px-5 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] flex flex-col gap-2.5"
          >
            {btns.map((b, i) => (
              <EventCtaButton key={i} label={b.label} url={b.url} variant={getCtaVariant(i, btns.length)}
                disabled={!upcoming} className="w-full py-3.5 text-sm" />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
