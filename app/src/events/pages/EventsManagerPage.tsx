import { useState, useEffect } from 'react'
import { useNavigate }       from 'react-router-dom'
import { fetchAllEvents }    from '@/events/services/fetchAllEvents'
import { setEventPublic }    from '@/events/services/setEventPublic'
import { deleteEvent }       from '@/events/services/deleteEvent'
import { AdminEventCard }    from '@/events/components/AdminEventCard'
import { AddEditEventModal } from '@/events/components/AddEditEventModal'
import type { DbEvent }      from '@/events/types/Event'

const G = '#22C55E'

function EventSection({ title, color, events, onAnnounce, onUnpublish, onEdit, onDelete }: {
  title: string; color: string; events: DbEvent[]
  onAnnounce: (id: string) => void; onUnpublish: (id: string) => void
  onEdit: (ev: DbEvent) => void;    onDelete: (id: string) => void
}) {
  return (
    <section className="mb-8">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-1 h-6 rounded-sm" style={{ background: color }} />
        <h2 className="text-base font-extrabold m-0" style={{ color: '#111827' }}>{title}</h2>
        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full" style={{ background: `${color}20`, color }}>{events.length}</span>
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
        {events.map(ev => <AdminEventCard key={ev.id} event={ev} onAnnounce={onAnnounce} onUnpublish={onUnpublish} onEdit={onEdit} onDelete={onDelete} />)}
      </div>
    </section>
  )
}

export default function EventsManagerPage() {
  const navigate              = useNavigate()
  const [events, setEvents]   = useState<DbEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [editingEv, setEditingEv] = useState<DbEvent | null>(null)

  useEffect(() => { fetchAllEvents().then(setEvents).catch(console.error).finally(() => setLoading(false)) }, [])

  const now    = new Date()
  const ended  = events.filter(e => new Date(e.time) <= now).sort((a, b) => +new Date(b.time) - +new Date(a.time))
  const active = events.filter(e => new Date(e.time) > now)
  const live   = active.filter(e => e.public)
  const drafts = active.filter(e => !e.public)

  const announce  = async (id: string) => { await setEventPublic(id, true);  setEvents(p => p.map(e => e.id === id ? { ...e, public: true  } : e)) }
  const unpublish = async (id: string) => { await setEventPublic(id, false); setEvents(p => p.map(e => e.id === id ? { ...e, public: false } : e)) }
  const handleDelete = async (id: string) => {
    if (!confirm('Delete this event? This cannot be undone.')) return
    await deleteEvent(id); setEvents(p => p.filter(e => e.id !== id))
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F3F4F6', fontFamily: 'system-ui,sans-serif' }}>
      <nav style={{ background: 'rgba(255,255,255,0.97)', borderBottom: '1px solid #E5E7EB' }} className="sticky top-0 z-50 h-14 flex items-center justify-between px-6 shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} style={{ color: '#6B7280' }} className="text-sm font-semibold bg-transparent border-none cursor-pointer hover:opacity-70">← Home</button>
          <div className="w-px h-4 bg-gray-200" />
          <span style={{ color: '#111827' }} className="font-extrabold text-[15px]">Events Manager</span>
        </div>
        <button onClick={() => setShowAdd(true)} style={{ background: G, color: '#fff' }} className="rounded-full px-5 py-1.5 font-bold text-sm cursor-pointer border-none hover:opacity-85 shadow-sm">+ New Event</button>
      </nav>
      <div className="max-w-[1100px] mx-auto px-8 py-8">
        {loading && <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">{[1,2,3,4].map(i => <div key={i} className="h-44 rounded-xl bg-white animate-pulse border border-gray-100" />)}</div>}
        {!loading && <>
          {live.length > 0   && <EventSection title="Live on Home Page" color={G}       events={live}   onAnnounce={announce} onUnpublish={unpublish} onEdit={setEditingEv} onDelete={handleDelete} />}
          {drafts.length > 0 && <EventSection title="Drafts"            color="#9CA3AF" events={drafts} onAnnounce={announce} onUnpublish={unpublish} onEdit={setEditingEv} onDelete={handleDelete} />}
          {ended.length > 0  && <EventSection title="Ended"             color="#9CA3AF" events={ended}  onAnnounce={announce} onUnpublish={unpublish} onEdit={setEditingEv} onDelete={handleDelete} />}
          {events.length === 0 && <div className="flex flex-col items-center justify-center py-28 text-center"><div className="text-base font-bold text-gray-400 mb-3">No events yet</div><button onClick={() => setShowAdd(true)} style={{ background: G, color: '#fff' }} className="border-none rounded-full px-6 py-2.5 text-sm font-bold cursor-pointer hover:opacity-85 shadow-sm">+ Create your first event</button></div>}
        </>}
      </div>
      {showAdd    && <AddEditEventModal onClose={() => setShowAdd(false)} onCreated={ev => { setEvents(p => [...p, ev]); setShowAdd(false) }} />}
      {editingEv  && <AddEditEventModal event={editingEv} onClose={() => setEditingEv(null)} onUpdated={updated => { setEvents(p => p.map(e => e.id === updated.id ? updated : e)); setEditingEv(null) }} />}
    </div>
  )
}
