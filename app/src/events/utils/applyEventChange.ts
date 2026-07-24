import type { DbEvent } from '@/events/types/Event'
import type { RealtimeRowChange } from '@/core/supabase/useRealtimeTable'
import { parseTimeline } from './parseTimeline'

const byTime = (a: DbEvent, b: DbEvent) => +new Date(a.time) - +new Date(b.time)

/**
 * Apply one realtime row change to an events list so every device reflects an
 * admin action the instant it happens, without waiting for the reconcile fetch.
 * With `publicOnly`, rows that are (or become) drafts are removed — that keeps
 * unannounce and delete live on the public home page.
 * Returns `prev` unchanged when the payload is a no-op, so React skips the render.
 */
export function applyEventChange(prev: DbEvent[], change: RealtimeRowChange, publicOnly = false): DbEvent[] {
  if (change.eventType === 'DELETE') {
    const id = (change.old as Partial<DbEvent>).id
    if (!id || !prev.some(e => e.id === id)) return prev
    return prev.filter(e => e.id !== id)
  }

  const raw = change.new as Record<string, unknown>
  if (typeof raw?.id !== 'string') return prev
  const row: DbEvent = { ...(raw as unknown as DbEvent), timeline: parseTimeline(raw.timeline) }

  if (publicOnly && !row.public) {
    return prev.some(e => e.id === row.id) ? prev.filter(e => e.id !== row.id) : prev
  }

  const next = prev.some(e => e.id === row.id)
    ? prev.map(e => (e.id === row.id ? { ...e, ...row } : e))
    : [...prev, row]
  return next.sort(byTime)
}
