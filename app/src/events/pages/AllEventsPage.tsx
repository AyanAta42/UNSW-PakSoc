import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchPublicEvents } from '@/events/services/fetchPublicEvents'
import { AllEventsCard }     from '@/events/components/AllEventsCard'
import { EventDetailModal }  from '@/events/components/EventDetailModal'
import type { DbEvent }      from '@/events/types/Event'
import { ACCENT, PALETTE }   from '@/config/theme'

function EventSection({ title, color, events, onSelect }: {
  title: string; color: string; events: DbEvent[]; onSelect: (ev: DbEvent) => void
}) {
  if (events.length === 0) return null
  return (
    <section className="mb-10">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-1 h-5 rounded-sm" style={{ background: color }} />
        <h2 className="text-base font-extrabold m-0" style={{ color: PALETTE.dark }}>{title}</h2>
        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full"
          style={{ background: `${color}22`, color }}>{events.length}</span>
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
        {events.map(ev => <AllEventsCard key={ev.id} event={ev} onClick={() => onSelect(ev)} />)}
      </div>
    </section>
  )
}

export default function AllEventsPage() {
  const navigate              = useNavigate()
  const [events, setEvents]   = useState<DbEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<DbEvent | null>(null)

  useEffect(() => { fetchPublicEvents().then(setEvents).catch(console.error).finally(() => setLoading(false)) }, [])

  const now      = new Date()
  const upcoming = events.filter(e => new Date(e.time) > now).sort((a, b) => +new Date(a.time) - +new Date(b.time))
  const ended    = events.filter(e => new Date(e.time) <= now).sort((a, b) => +new Date(b.time) - +new Date(a.time))

  return (
    <div style={{ minHeight: '100vh', background: PALETTE.page, fontFamily: 'system-ui, sans-serif' }}>
      <nav style={{ background: PALETTE.navbarGlass, backdropFilter: 'blur(16px)', borderBottom: `1px solid ${PALETTE.border}` }}
        className="sticky top-0 z-50 h-14 flex items-center px-6 gap-3">
        <button onClick={() => navigate('/')}
          style={{ color: PALETTE.muted, background: 'transparent' }}
          className="text-sm font-semibold border-none cursor-pointer hover:text-green-400 transition-colors">← Home</button>
        <div className="w-px h-4" style={{ background: PALETTE.border }} />
        <span style={{ color: PALETTE.dark }} className="font-extrabold text-[15px]">All Events</span>
      </nav>

      <div className="max-w-[1100px] mx-auto px-6 md:px-8 py-8">
        {loading && (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
            {[1,2,3,4].map(i => (
              <div key={i} className="motion-skeleton h-44" style={{ borderRadius: 18, border: `1px solid ${PALETTE.border}` }} />
            ))}
          </div>
        )}
        {!loading && events.length === 0 && (
          <div className="flex flex-col items-center justify-center py-28 text-center">
            <div className="text-base font-bold" style={{ color: PALETTE.muted }}>No events yet — check back soon.</div>
          </div>
        )}
        {!loading && <>
          <EventSection title="Upcoming" color={ACCENT}          events={upcoming} onSelect={setSelected} />
          <EventSection title="Ended"    color={PALETTE.disabled} events={ended}    onSelect={setSelected} />
        </>}
      </div>

      {selected && <EventDetailModal event={selected} now={now} onClose={() => setSelected(null)} />}
    </div>
  )
}
