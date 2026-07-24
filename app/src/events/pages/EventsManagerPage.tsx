import { useState, useEffect } from 'react'
import { fetchAllEvents }    from '@/events/services/fetchAllEvents'
import { setEventPublic }    from '@/events/services/setEventPublic'
import { deleteEvent }       from '@/events/services/deleteEvent'
import { AdminEventCard }    from '@/events/components/AdminEventCard'
import { AddEditEventModal } from '@/events/components/AddEditEventModal'
import { usePermissions }    from '@/roles/hooks/usePermissions'
import { useRealtimeTable }  from '@/core/supabase/useRealtimeTable'
import { logInteraction }        from '@/interactions/services/logInteraction'
import { fetchEventInteractions } from '@/interactions/services/fetchEventInteractions'
import { HistoryButton }     from '@/interactions/components/HistoryButton'
import { HistoryPanel }      from '@/interactions/components/HistoryPanel'
import { applyEventChange }  from '@/events/utils/applyEventChange'
import type { DbEvent }      from '@/events/types/Event'
import { ACCENT, ACCENT_TEXT, PALETTE } from '@/config/theme'
import { AuroraPage } from '@/shared/components/AuroraPage'
import { HomeButton } from '@/shared/components/HomeButton'
import { toast, errorMessage } from '@/shared/toast/toast'

function EventSection({ title, color, events, canEdit, canAnnounce, onAnnounce, onUnannounce, onEdit }: {
  title: string; color: string; events: DbEvent[]; canEdit: boolean; canAnnounce: boolean
  onAnnounce: (id: string) => void; onUnannounce: (id: string) => void
  onEdit: (ev: DbEvent) => void
}) {
  return (
    <section className="mb-10">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-1 h-6 rounded-sm" style={{ background: color }} />
        <h2 className="text-lg font-extrabold m-0" style={{ color: PALETTE.dark }}>{title}</h2>
        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full"
          style={{ background: `${color}22`, color }}>{events.length}</span>
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(min(260px,100%),1fr))] gap-4">
        {events.map(ev => <AdminEventCard key={ev.id} event={ev} canEdit={canEdit} canAnnounce={canAnnounce}
          onAnnounce={onAnnounce} onUnannounce={onUnannounce} onEdit={onEdit} />)}
      </div>
    </section>
  )
}

export default function EventsManagerPage() {
  const { can }               = usePermissions()
  const [events, setEvents]   = useState<DbEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [editingEv, setEditingEv] = useState<DbEvent | null>(null)
  const [showHistory, setShowHistory] = useState(false)

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

  const announce = async (id: string) => {
    const name = events.find(e => e.id === id)?.name ?? 'an event'
    setEvents(p => p.map(e => e.id === id ? { ...e, public: true } : e))
    try {
      await setEventPublic(id, true)
      toast.success('Event announced')
      void logInteraction('event.published', 'event', id, id, `announced "${name}"`)
    } catch (e) {
      setEvents(p => p.map(e => e.id === id ? { ...e, public: false } : e))
      toast.error("Couldn't announce event", errorMessage(e, 'Please try again.'))
    }
  }
  const unannounce = async (id: string) => {
    const name = events.find(e => e.id === id)?.name ?? 'an event'
    setEvents(p => p.map(e => e.id === id ? { ...e, public: false } : e))
    try {
      await setEventPublic(id, false)
      toast.info('Event unannounced')
      // NOTE: the persisted action key stays 'event.unpublished' so the audit
      // trail is continuous with rows written before the rename.
      void logInteraction('event.unpublished', 'event', id, id, `unannounced "${name}"`)
    } catch (e) {
      setEvents(p => p.map(e => e.id === id ? { ...e, public: true } : e))
      toast.error("Couldn't unannounce event", errorMessage(e, 'Please try again.'))
    }
  }
  const handleDelete = async (id: string) => {
    const name = events.find(e => e.id === id)?.name ?? 'an event'
    try {
      await deleteEvent(id)
      setEvents(p => p.filter(e => e.id !== id))
      toast.success('Event deleted')
      void logInteraction('event.deleted', 'event', id, id, `deleted event "${name}"`)
    } catch (e) { toast.error("Couldn't delete event", errorMessage(e, 'Please try again.')) }
  }

  const sectionProps = { canEdit: can.editEvents, canAnnounce: can.announceEvents, onAnnounce: announce, onUnannounce: unannounce, onEdit: setEditingEv }

  return (
    <AuroraPage contentClassName="flex h-[100dvh] flex-col overflow-hidden">
      <nav style={{ background: PALETTE.navbarGlass, backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderBottom: `1px solid ${PALETTE.border}` }}
        className="shrink-0 min-h-[calc(68px_+_env(safe-area-inset-top))] pt-[env(safe-area-inset-top)] flex items-center justify-between gap-2 px-4 md:px-6">
        <div className="flex items-center gap-3 min-w-0">
          <HomeButton />
          <div className="w-px h-5 shrink-0" style={{ background: PALETTE.border }} />
          <span style={{ color: PALETTE.dark }} className="font-extrabold text-lg md:text-xl truncate">Events Manager</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <HistoryButton onClick={() => setShowHistory(true)} label="View event history" />
          {can.editEvents && (
            <button onClick={() => setShowAdd(true)} aria-label="New Event" title="New Event"
              style={{ background: ACCENT, color: ACCENT_TEXT, boxShadow: '0 0 20px rgba(34,197,94,0.3)' }}
              className="flex items-center justify-center gap-1.5 shrink-0 border-none cursor-pointer hover:opacity-85 transition-opacity font-bold text-sm whitespace-nowrap w-9 h-9 rounded-full md:w-auto md:h-auto md:px-4 md:py-2 md:rounded-[14px]">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M12 5v14M5 12h14" /></svg>
              <span className="hidden md:inline">New Event</span>
            </button>
          )}
        </div>
      </nav>

      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 md:px-8 py-8">
          {loading && (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(min(260px,100%),1fr))] gap-4">
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
      </div>

      {showAdd   && <AddEditEventModal
        onClose={() => setShowAdd(false)}
        onCreated={ev => { setEvents(p => [...p, ev]); setShowAdd(false) }}
        onCreateSettled={(tempId, ev) => setEvents(p => ev ? p.map(e => e.id === tempId ? ev : e) : p.filter(e => e.id !== tempId))}
      />}
      {editingEv && <AddEditEventModal event={editingEv}
        onClose={() => setEditingEv(null)}
        onUpdated={updated => { setEvents(p => p.map(e => e.id === updated.id ? updated : e)); setEditingEv(null) }}
        onDelete={can.deleteEvents ? id => { handleDelete(id); setEditingEv(null) } : undefined}
      />}
      {showHistory && (
        <HistoryPanel title="Event History" onClose={() => setShowHistory(false)}
          fetcher={fetchEventInteractions} emptyMessage="No event activity yet." />
      )}
    </AuroraPage>
  )
}
