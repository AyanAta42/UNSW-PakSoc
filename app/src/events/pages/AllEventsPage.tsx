import { useState, useEffect, useMemo } from 'react'
import { usePublicEvents } from '@/events/context/PublicEventsContext'
import { AllEventsCard } from '@/events/components/AllEventsCard'
import { MobileEventSheet } from '@/public-site/home/components/MobileEventSheet'
import { EventDetailContent } from '@/public-site/home/components/EventDetailContent'
import type { DbEvent } from '@/events/types/Event'
import { ACCENT, PALETTE } from '@/config/theme'
import { AuroraPage } from '@/shared/components/AuroraPage'
import { HomeButton } from '@/shared/components/HomeButton'

function isPhone(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(max-width: 1023px)').matches
}

function EventSection({ title, color, events, onSelect }: {
  title: string; color: string; events: DbEvent[]; onSelect: (ev: DbEvent) => void
}) {
  if (events.length === 0) return null
  return (
    <section className="mb-10">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-1 h-6 rounded-sm" style={{ background: color }} />
        <h2 className="text-lg font-extrabold m-0" style={{ color: PALETTE.dark }}>{title}</h2>
        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full"
          style={{ background: `${color}22`, color }}>{events.length}</span>
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(min(260px,100%),1fr))] gap-4">
        {events.map(ev => <AllEventsCard key={ev.id} event={ev} onClick={() => onSelect(ev)} />)}
      </div>
    </section>
  )
}

export default function AllEventsPage() {
  const { events, loading } = usePublicEvents()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [modalEvent, setModalEvent] = useState<DbEvent | null>(null)

  useEffect(() => {
    const open = !!modalEvent
    document.body.style.overflow = open ? 'hidden' : ''
    document.documentElement.classList.toggle('modal-open', open)
    return () => {
      document.body.style.overflow = ''
      document.documentElement.classList.remove('modal-open')
    }
  }, [modalEvent])

  const now = new Date()
  const { upcoming, ended, featured } = useMemo(() => {
    const now = new Date()
    const upcoming = events.filter(e => new Date(e.time) > now).sort((a, b) => +new Date(a.time) - +new Date(b.time))
    const ended = events.filter(e => new Date(e.time) <= now).sort((a, b) => +new Date(b.time) - +new Date(a.time))
    const featured = events.find(e => e.id === selectedId) ?? upcoming[0] ?? ended[0] ?? null
    return { upcoming, ended, featured }
  }, [events, selectedId])

  /** Phone: open the popup. Desktop: no popup — select and show in the side panel. */
  function selectEvent(ev: DbEvent) {
    setSelectedId(ev.id)
    if (isPhone()) setModalEvent(ev)
  }

  return (
    <AuroraPage contentClassName="flex h-[100dvh] flex-col overflow-hidden">
      {/* Fixed navbar */}
      <nav style={{ background: PALETTE.navbarGlass, backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderBottom: `1px solid ${PALETTE.border}` }}
        className="shrink-0 min-h-[calc(68px_+_env(safe-area-inset-top))] pt-[env(safe-area-inset-top)] flex items-center px-4 md:px-6 gap-3">
        <HomeButton />
        <div className="w-px h-5 shrink-0" style={{ background: PALETTE.border }} />
        <span style={{ color: PALETTE.dark }} className="font-extrabold text-lg md:text-xl">All Events</span>
      </nav>

      <div className="flex-1 min-h-0 w-full max-w-[1400px] mx-auto px-4 sm:px-6 md:px-8 py-6 flex gap-6 items-stretch">
        {/* Scrollable events column */}
        <div className="flex-1 min-w-0 min-h-0 overflow-y-auto no-scrollbar">
          {loading && events.length === 0 && (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(min(260px,100%),1fr))] gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="motion-skeleton h-44" style={{ borderRadius: 18, border: `1px solid ${PALETTE.border}` }} />
              ))}
            </div>
          )}
          {!loading && events.length === 0 && (
            <div className="flex flex-col items-center justify-center py-28 text-center">
              <div className="text-base font-bold" style={{ color: PALETTE.muted }}>No events yet — check back soon.</div>
            </div>
          )}
          {events.length > 0 && <>
            <EventSection title="Upcoming" color={ACCENT} events={upcoming} onSelect={selectEvent} />
            <EventSection title="Ended" color={PALETTE.disabled} events={ended} onSelect={selectEvent} />
          </>}
        </div>

        {/* Fixed-height detail + timeline panel — constant height for every event, scrolls internally */}
        {featured && (
          <aside className="hidden lg:block w-[340px] shrink-0 min-h-0">
            <div style={{ background: PALETTE.card, border: `1px solid ${PALETTE.border}`, borderRadius: 18, boxShadow: PALETTE.shadowMd }}
              className="h-full overflow-hidden flex flex-col">
              <div className="px-5 py-5 flex flex-col gap-3.5 overflow-y-auto no-scrollbar">
                <EventDetailContent event={featured} now={now} />
              </div>
            </div>
          </aside>
        )}
      </div>

      {modalEvent && <MobileEventSheet event={modalEvent} now={now} mapCacheId="all-events-sheet" onClose={() => setModalEvent(null)} />}
    </AuroraPage>
  )
}
