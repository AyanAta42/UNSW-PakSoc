import { useState, useEffect } from 'react'
import { useNavigate }       from 'react-router-dom'
import { fetchAllEvents }    from '@/events/services/fetchAllEvents'
import { setEventPublic }    from '@/events/services/setEventPublic'
import { deleteEvent }       from '@/events/services/deleteEvent'
import { AdminEventCard }    from '@/events/components/AdminEventCard'
import { AddEditEventModal } from '@/events/components/AddEditEventModal'
import { usePermissions }    from '@/roles/hooks/usePermissions'
import { useRealtimeTable }  from '@/core/supabase/useRealtimeTable'
import { applyEventChange }  from '@/events/utils/applyEventChange'
import type { DbEvent }      from '@/events/types/Event'
import { ACCENT, ACCENT_TEXT, PALETTE } from '@/config/theme'
import { toast, errorMessage } from '@/shared/toast/toast'

function EventSection({ title, color, events, canEdit, onAnnounce, onUnpublish, onEdit, onDelete }: {
  title: string; color: string; events: DbEvent[]; canEdit: boolean
  onAnnounce: (id: string) => void; onUnpublish: (id: string) => void
  onEdit: (ev: DbEvent) => void;    onDelete: (id: string) => void
}) {
  return (
    <section className="mb-10">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-1 h-5 rounded-sm" style={{ background: color }} />
        <h2 className="text-base font-extrabold m-0" style={{ color: PALETTE.dark }}>{title}</h2>
        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full"
          style={{ background: `${color}22`, color }}>{events.length}</span>
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
        {events.map(ev => <AdminEventCard key={ev.id} event={ev} canEdit={canEdit}
          onAnnounce={onAnnounce} onUnpublish={onUnpublish} onEdit={onEdit} onDelete={onDelete} />)}
      </div>
    </section>
  )
}

export default function EventsManagerPage() {
  const navigate              = useNavigate()
  const { can }               = usePermissions()
  const [events, setEvents]   = useState<DbEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [editingEv, setEditingEv] = useState<DbEvent | null>(null)

  useEffect(() => { fetchAllEvents().then(setEvents).catch(console.error).finally(() => setLoading(false)) }, [])

  // Live updates from other execs: apply each change instantly, then reconcile
  useRealtimeTable(
    'events',
    () => { fetchAllEvents().then(setEvents).catch(console.error) },
    !loading,
    change => setEvents(prev => applyEventChange(prev, change)),
  )

  const now    = new Date()
  const ended  = events.filter(e => new Date(e.time) <= now).sort((a, b) => +new Date(b.time) - +new Date(a.time))
  const active = events.filter(e => new Date(e.time) > now)
  const live   = active.filter(e => e.public)
  const drafts = active.filter(e => !e.public)

  const announce  = async (id: string) => {
    try { await setEventPublic(id, true); setEvents(p => p.map(e => e.id === id ? { ...e, public: true } : e)); toast.success('Event announced') }
    catch (e) { toast.error("Couldn't announce event", errorMessage(e, 'Please try again.')) }
  }
  const unpublish = async (id: string) => {
    try { await setEventPublic(id, false); setEvents(p => p.map(e => e.id === id ? { ...e, public: false } : e)); toast.info('Event unannounced') }
    catch (e) { toast.error("Couldn't unannounce event", errorMessage(e, 'Please try again.')) }
  }
  const handleDelete = async (id: string) => {
    try { await deleteEvent(id); setEvents(p => p.filter(e => e.id !== id)); toast.success('Event deleted') }
    catch (e) { toast.error("Couldn't delete event", errorMessage(e, 'Please try again.')) }
  }

  const sectionProps = { canEdit: can.editEvents, onAnnounce: announce, onUnpublish: unpublish, onEdit: setEditingEv, onDelete: handleDelete }

  return (
    <div style={{ minHeight: '100vh', background: PALETTE.page, fontFamily: 'system-ui, sans-serif' }}>
      <nav style={{ background: PALETTE.navbarGlass, backdropFilter: 'blur(16px)', borderBottom: `1px solid ${PALETTE.border}` }}
        className="sticky top-0 z-50 min-h-[3.5rem] pt-[env(safe-area-inset-top)] flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')}
            style={{ color: PALETTE.muted, background: 'transparent' }}
            className="text-sm font-semibold border-none cursor-pointer hover:text-green-400 transition-colors">← Home</button>
          <div className="w-px h-4" style={{ background: PALETTE.border }} />
          <span style={{ color: PALETTE.dark }} className="font-extrabold text-[15px]">Events Manager</span>
        </div>
        {can.editEvents && (
          <button onClick={() => setShowAdd(true)}
            style={{ background: ACCENT, color: ACCENT_TEXT, borderRadius: 14, boxShadow: '0 0 20px rgba(34,197,94,0.3)' }}
            className="px-5 py-1.5 font-bold text-sm cursor-pointer border-none hover:opacity-85 transition-opacity">
            + New Event
          </button>
        )}
      </nav>

      <div className="max-w-[1100px] mx-auto px-6 md:px-8 py-8">
        {loading && (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
            {[1,2,3,4].map(i => (
              <div key={i} className="motion-skeleton h-44" style={{ borderRadius: 18, border: `1px solid ${PALETTE.border}` }} />
            ))}
          </div>
        )}
        {!loading && <>
          {live.length > 0   && <EventSection title="Live on Home Page" color={ACCENT}          events={live}   {...sectionProps} />}
          {drafts.length > 0 && <EventSection title="Drafts"            color={PALETTE.disabled} events={drafts} {...sectionProps} />}
          {ended.length > 0  && <EventSection title="Ended"             color={PALETTE.disabled} events={ended}  {...sectionProps} />}
          {events.length === 0 && (
            <div className="flex flex-col items-center justify-center py-28 text-center">
              <div className="text-base font-bold mb-4" style={{ color: PALETTE.muted }}>No events yet</div>
              {can.editEvents && (
                <button onClick={() => setShowAdd(true)}
                  style={{ background: ACCENT, color: ACCENT_TEXT, borderRadius: 14 }}
                  className="border-none px-6 py-2.5 text-sm font-bold cursor-pointer hover:opacity-85">
                  + Create your first event
                </button>
              )}
            </div>
          )}
        </>}
      </div>

      {showAdd   && <AddEditEventModal onClose={() => setShowAdd(false)} onCreated={ev => { setEvents(p => [...p, ev]); setShowAdd(false); toast.success('Event created') }} />}
      {editingEv && <AddEditEventModal event={editingEv} onClose={() => setEditingEv(null)} onUpdated={updated => { setEvents(p => p.map(e => e.id === updated.id ? updated : e)); setEditingEv(null); toast.success('Event updated') }} />}
    </div>
  )
}
