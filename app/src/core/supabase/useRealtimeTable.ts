import { useEffect, useRef } from 'react'

let seq = 0

/**
 * Re-run `onChange` whenever rows in the given table(s) are inserted, updated
 * or deleted. Requires the table to be in the `supabase_realtime` publication.
 * supabase-js is loaded lazily so public pages keep their lean first paint.
 */
export function useRealtimeTable(tables: string | string[], onChange: () => void, enabled = true) {
  const cb = useRef(onChange)
  cb.current = onChange
  const key = Array.isArray(tables) ? tables.join(',') : tables

  useEffect(() => {
    if (!enabled) return
    let alive = true
    let timer: number | undefined
    let cleanup: (() => void) | undefined

    void import('./client').then(({ supabase }) => {
      if (!alive) return
      const channel = supabase.channel(`db-changes-${++seq}`)
      for (const table of key.split(',')) {
        channel.on('postgres_changes', { event: '*', schema: 'public', table }, () => {
          // Coalesce bursts (multi-row writes) into a single refetch
          window.clearTimeout(timer)
          timer = window.setTimeout(() => cb.current(), 250)
        })
      }
      channel.subscribe()
      cleanup = () => { void supabase.removeChannel(channel) }
    })

    return () => {
      alive = false
      window.clearTimeout(timer)
      cleanup?.()
    }
  }, [key, enabled])
}
