import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { DbEvent } from '@/events/types/Event'
import {
  getCachedPublicEvents,
  loadPublicEvents,
  refreshPublicEvents,
} from '@/events/services/publicEventsBootstrap'
import { useRefreshOnVisible } from '@/core/supabase/useRefreshOnVisible'
import { eventImageUrl } from '@/events/utils/eventImageUrl'
import { warmImages } from '@/shared/utils/imageCache'

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
    loadPublicEvents(next => { if (alive) setEvents(next) })
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

  // Public surfaces don't hold a realtime socket: that would open a WebSocket and
  // pull supabase-js in for every anonymous visitor, and threaten the free-tier
  // connection cap at scale. Events change a few times a week, so fetching on load
  // and again whenever the visitor returns to the tab is plenty fresh.
  useRefreshOnVisible(
    () => { refreshPublicEvents().then(setEvents).catch(console.error) },
    ready,
  )

  // Keep *upcoming* event posters decoded and in memory so route changes repaint
  // them instantly instead of flashing empty. Only upcoming ones are warmed —
  // preloading every past poster on every visit is wasted image egress.
  useEffect(() => {
    const now = Date.now()
    warmImages(events.filter(e => new Date(e.time).getTime() >= now).map(eventImageUrl))
  }, [events])

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
