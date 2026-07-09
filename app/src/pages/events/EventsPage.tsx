import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchAllEvents, setEventPublic, deleteEvent, type DbEvent } from '@/lib/db'
import { EventCard }     from './EventCard'
import { AddEventModal } from './AddEventModal'

export default function EventsPage() {
  const navigate              = useNavigate()
  const [events, setEvents]   = useState<DbEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [editingEv, setEditingEv] = useState<DbEvent | null>(null)

  useEffect(() => {
    fetchAllEvents().then(setEvents).catch(console.error).finally(() => setLoading(false))
  }, [])

  async function handleAnnounce(id: string) {
    await setEventPublic(id, true)
    setEvents(p => p.map(e => e.id === id ? { ...e, public: true } : e))
  }

  async function handleUnpublish(id: string) {
    await setEventPublic(id, false)
    setEvents(p => p.map(e => e.id === id ? { ...e, public: false } : e))
  }

  function handleUpdated(updated: DbEvent) {
    setEvents(p => p.map(e => e.id === updated.id ? updated : e))
    setEditingEv(null)
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this event? This cannot be undone.')) return
    await deleteEvent(id)
    setEvents(p => p.filter(e => e.id !== id))
  }

  const now    = new Date()
  const ended  = events.filter(e => new Date(e.time) <= now).sort((a, b) => +new Date(b.time) - +new Date(a.time))
  const active = events.filter(e => new Date(e.time) > now)
  const live   = active.filter(e => e.public)
  const drafts = active.filter(e => !e.public)

  return (
    <div style={{ minHeight: '100vh', background: '#F3F4F6', fontFamily: 'system-ui,sans-serif' }}>

      <nav style={{ background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(14px)', borderBottom: '1px solid #E5E7EB' }}
        className="sticky top-0 z-50 h-14 flex items-center justify-between px-6 shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} style={{ color: '#6B7280' }}
            className="text-sm font-semibold bg-transparent border-none cursor-pointer hover:opacity-70 transition-opacity">← Home</button>
          <div className="w-px h-4 bg-gray-200" />
          <span style={{ color: '#111827' }} className="font-extrabold text-[15px]">Events Manager</span>
        </div>
        <button onClick={() => setShowAdd(true)}
          style={{ background: '#22C55E', color: '#fff' }}
          className="rounded-full px-5 py-1.5 font-bold text-sm cursor-pointer border-none hover:opacity-85 transition-opacity shadow-sm">
          + New Event
        </button>
      </nav>

      <div className="max-w-[1100px] mx-auto px-8 py-8" style={{ fontFamily: 'system-ui,sans-serif' }}>

        {loading && (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
            {[1,2,3,4].map(i => <div key={i} className="h-44 rounded-xl bg-white animate-pulse border border-gray-100" />)}
          </div>
        )}

        {!loading && (
          <>
            {live.length > 0 && (
              <section className="mb-8">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-1 h-6 rounded-sm" style={{ background: '#22C55E' }} />
                  <h2 className="text-base font-extrabold m-0" style={{ color: '#111827' }}>Live on Home Page</h2>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full" style={{ background: 'rgba(34,197,94,0.12)', color: '#16A34A' }}>{live.length}</span>
                </div>
                <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
                  {live.map(ev => <EventCard key={ev.id} event={ev} onAnnounce={handleAnnounce} onUnpublish={handleUnpublish} onEdit={setEditingEv} onDelete={handleDelete} />)}
                </div>
              </section>
            )}

            {drafts.length > 0 && (
              <section className="mb-8">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-1 h-6 bg-gray-300 rounded-sm" />
                  <h2 className="text-base font-extrabold m-0" style={{ color: '#111827' }}>Drafts</h2>
                  <span className="text-xs bg-gray-100 text-gray-500 font-bold px-2.5 py-0.5 rounded-full">{drafts.length}</span>
                </div>
                <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
                  {drafts.map(ev => <EventCard key={ev.id} event={ev} onAnnounce={handleAnnounce} onUnpublish={handleUnpublish} onEdit={setEditingEv} onDelete={handleDelete} />)}
                </div>
              </section>
            )}

            {ended.length > 0 && (
              <section>
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-1 h-6 rounded-sm" style={{ background: '#9CA3AF' }} />
                  <h2 className="text-base font-extrabold m-0" style={{ color: '#111827' }}>Ended</h2>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full" style={{ background: '#F3F4F6', color: '#9CA3AF' }}>{ended.length}</span>
                </div>
                <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
                  {ended.map(ev => <EventCard key={ev.id} event={ev} onAnnounce={handleAnnounce} onUnpublish={handleUnpublish} onEdit={setEditingEv} onDelete={handleDelete} />)}
                </div>
              </section>
            )}

            {events.length === 0 && (
              <div className="flex flex-col items-center justify-center py-28 text-center">
                <div className="text-base font-bold text-gray-400 mb-3">No events yet</div>
                <button onClick={() => setShowAdd(true)}
                  style={{ background: '#22C55E', color: '#fff' }}
                  className="border-none rounded-full px-6 py-2.5 text-sm font-bold cursor-pointer hover:opacity-85 transition-opacity shadow-sm">
                  + Create your first event
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {showAdd && (
        <AddEventModal
          onClose={() => setShowAdd(false)}
          onCreated={ev => { setEvents(p => [...p, ev]); setShowAdd(false) }}
        />
      )}

      {editingEv && (
        <AddEventModal
          event={editingEv}
          onClose={() => setEditingEv(null)}
          onUpdated={handleUpdated}
        />
      )}
    </div>
  )
}
