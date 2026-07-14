import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchPublicEvents } from '@/events/services/fetchPublicEvents'
import { AllEventsCard }     from '@/events/components/AllEventsCard'
import { EventDetailModal }  from '@/events/components/EventDetailModal'
import type { DbEvent }      from '@/events/types/Event'

const G = '#22C55E'

function EventSection({ title, color, events, onSelect }: {
  title: string; color: string; events: DbEvent[]; onSelect: (ev: DbEvent) => void
}) {
  if (events.length === 0) return null
  return (
    <section className="mb-8">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-1 h-6 rounded-sm" style={{ background: color }} />
        <h2 className="text-base font-extrabold m-0" style={{ color: '#111827' }}>{title}</h2>
        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full" style={{ background: `${color}20`, color }}>{events.length}</span>
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
    <div style={{ minHeight: '100vh', background: '#F3F4F6', fontFamily: 'system-ui,sans-serif' }}>
      <nav style={{ background: 'rgba(255,255,255,0.97)', borderBottom: '1px solid #E5E7EB' }} className="sticky top-0 z-50 h-14 flex items-center px-6 shadow-sm">
        <button onClick={() => navigate('/')} style={{ color: '#6B7280' }} className="text-sm font-semibold bg-transparent border-none cursor-pointer hover:opacity-70">← Home</button>
        <div className="w-px h-4 bg-gray-200 mx-3" />
        <span style={{ color: '#111827' }} className="font-extrabold text-[15px]">All Events</span>
      </nav>
      <div className="max-w-[1100px] mx-auto px-8 py-8">
        {loading && <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">{[1,2,3,4].map(i => <div key={i} className="h-44 rounded-xl bg-white animate-pulse border border-gray-100" />)}</div>}
        {!loading && events.length === 0 && (
          <div className="flex flex-col items-center justify-center py-28 text-center">
            <div className="text-base font-bold text-gray-400">No events yet — check back soon.</div>
          </div>
        )}
        {!loading && <>
          <EventSection title="Upcoming" color={G}       events={upcoming} onSelect={setSelected} />
          <EventSection title="Ended"    color="#9CA3AF" events={ended}    onSelect={setSelected} />
        </>}
      </div>
      {selected && <EventDetailModal event={selected} now={now} onClose={() => setSelected(null)} />}
    </div>
  )
}
