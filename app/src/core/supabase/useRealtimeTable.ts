import { useEffect, useRef } from 'react'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'

let seq = 0

/** A single row change streamed from Postgres (INSERT / UPDATE / DELETE). */
export type RealtimeRowChange = RealtimePostgresChangesPayload<Record<string, unknown>>

/**
 * Re-run `onChange` whenever rows in the given table(s) are inserted, updated
 * or deleted. Requires the table to be in the `supabase_realtime` publication.
 * supabase-js is loaded lazily so public pages keep their lean first paint.
 *
 * Pass `onRow` to receive each change payload immediately (no debounce) and
 * patch local state in place — the debounced `onChange` refetch still runs
 * afterwards as the authoritative reconcile.
 *
 * Also catches up (via `onChange`) after a dropped connection rejoins and when
 * the tab becomes visible again, so backgrounded phones never stay stale.
 */
export function useRealtimeTable(
  tables: string | string[],
  onChange: () => void,
  enabled = true,
  onRow?: (change: RealtimeRowChange) => void,
) {
  const cb = useRef(onChange)
  cb.current = onChange
  const rowCb = useRef(onRow)
  rowCb.current = onRow
  const key = Array.isArray(tables) ? tables.join(',') : tables

  useEffect(() => {
    if (!enabled) return
    let alive = true
    let timer: number | undefined
    let cleanup: (() => void) | undefined

    // Coalesce bursts (multi-row writes) into a single refetch
    const scheduleSync = () => {
      window.clearTimeout(timer)
      timer = window.setTimeout(() => cb.current(), 250)
    }

    void import('./client').then(({ supabase }) => {
      if (!alive) return
      const channel = supabase.channel(`db-changes-${++seq}`)
      for (const table of key.split(',')) {
        channel.on('postgres_changes', { event: '*', schema: 'public', table }, payload => {
          rowCb.current?.(payload as RealtimeRowChange)
          scheduleSync()
        })
      }
      let joined = false
      channel.subscribe(status => {
        if (status !== 'SUBSCRIBED') return
        // Rejoined after a drop — refetch whatever we missed while offline
        if (joined) scheduleSync()
        joined = true
      })
      cleanup = () => { void supabase.removeChannel(channel) }
    })

    // Locked phones / hidden tabs throttle the socket to death; refetch the
    // moment we're visible (or back online) so the UI is never stale.
    const catchUp = () => { if (document.visibilityState === 'visible') scheduleSync() }
    document.addEventListener('visibilitychange', catchUp)
    window.addEventListener('online', catchUp)

    return () => {
      alive = false
      window.clearTimeout(timer)
      document.removeEventListener('visibilitychange', catchUp)
      window.removeEventListener('online', catchUp)
      cleanup?.()
    }
  }, [key, enabled])
}
