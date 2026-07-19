import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { DbEvent } from '@/events/types/Event'
import {
  getCachedPublicEvents,
  loadPublicEvents,
  refreshPublicEvents,
} from '@/events/services/publicEventsBootstrap'
import { useRealtimeTable } from '@/core/supabase/useRealtimeTable'
import { applyEventChange } from '@/events/utils/applyEventChange'

interface PublicEventsCtx {
  events: DbEvent[]
  loading: boolean
  ready: boolean
}

const PublicEventsContext = createContext<PublicEventsCtx | null>(null)

/**
 * App-level events store — fetch once, share across Home / All Events.
 * Seeded from cache so the countdown + cards paint on the first frame.
 */
export function PublicEventsProvider({ children }: { children: React.ReactNode }) {
  const cached = getCachedPublicEvents()
  const [events, setEvents] = useState<DbEvent[]>(() => cached ?? [])
  const [loading, setLoading] = useState(() => !cached?.length)
  const [ready, setReady] = useState(() => !!cached?.length)

  useEffect(() => {
    let alive = true
    loadPublicEvents()
      .then(next => {
        if (!alive) return
        setEvents(next)
        setReady(true)
      })
      .catch(console.error)
      .finally(() => {
        if (!alive) return
        setLoading(false)
        setReady(true)
        window.dispatchEvent(new Event('paksoc:events-ready'))
      })
    return () => { alive = false }
  }, [])

  // Live sync: every admin action (create / edit / publish / unpublish / delete)
  // lands instantly from the change payload; the debounced refetch reconciles after.
  useRealtimeTable(
    'events',
    () => { refreshPublicEvents().then(setEvents).catch(console.error) },
    ready,
    change => setEvents(prev => applyEventChange(prev, change, true)),
  )

  const value = useMemo(() => ({ events, loading, ready }), [events, loading, ready])

  return (
    <PublicEventsContext.Provider value={value}>
      {children}
    </PublicEventsContext.Provider>
  )
}

export function usePublicEvents(): PublicEventsCtx {
  const ctx = useContext(PublicEventsContext)
  if (!ctx) throw new Error('usePublicEvents must be used within PublicEventsProvider')
  return ctx
}
