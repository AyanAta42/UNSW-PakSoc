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
 * Also catches up (via `onChange`) after a dropped connection rejoins, when
 * the tab becomes visible again, and on a slow safety poll while visible — so
 * devices still converge even if the realtime socket is silently dropped or
 * blocked (locked phones, flaky mobile networks, corporate/proxy WebSocket
 * blocking, or the table missing from the `supabase_realtime` publication).
 *
 * `pollMs` is that safety-net interval (0 disables it). It is deliberately slow:
 * the WebSocket carries live updates and we also refetch instantly on refocus /
 * reconnect, so the poll only needs to catch the rare *silent* stall. Keep this
 * high — a fast poll here is what burns free-tier egress at scale. Only use this
 * hook on the handful of logged-in exec surfaces that need live collaboration;
 * public/anonymous surfaces should use `useRefreshOnVisible` (no socket at all).
 */
export function useRealtimeTable(
  tables: string | string[],
  onChange: () => void,
  enabled = true,
  onRow?: (change: RealtimeRowChange) => void,
  pollMs = 60000,
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
      channel.subscribe(status => {
        if (status !== 'SUBSCRIBED') return
        // Reconcile on every (re)join, including the first: this closes the race
        // where a row is written between our initial fetch and the moment the
        // subscription actually starts capturing changes — otherwise that write
        // is silently missed until the next visibility/poll catch-up.
        scheduleSync()
      })
      cleanup = () => { void supabase.removeChannel(channel) }
    })

    // Locked phones / hidden tabs throttle the socket to death; refetch the
    // moment we're visible (or back online) so the UI is never stale.
    const catchUp = () => { if (document.visibilityState === 'visible') scheduleSync() }
    document.addEventListener('visibilitychange', catchUp)
    window.addEventListener('online', catchUp)

    // Safety net: even when the realtime socket is up, delivery can silently
    // stall. Poll on a *slow* interval while the tab is visible so every device
    // still converges within `pollMs`, independent of WebSocket health. This is
    // intentionally infrequent — live updates come over the socket; this only
    // backstops silent stalls.
    const poll = pollMs > 0
      ? window.setInterval(() => { if (document.visibilityState === 'visible') scheduleSync() }, pollMs)
      : undefined

    return () => {
      alive = false
      window.clearTimeout(timer)
      if (poll !== undefined) window.clearInterval(poll)
      document.removeEventListener('visibilitychange', catchUp)
      window.removeEventListener('online', catchUp)
      cleanup?.()
    }
  }, [key, enabled, pollMs])
}
