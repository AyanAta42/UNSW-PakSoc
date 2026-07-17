import type { DbEvent } from '@/events/types/Event'
import { parseTimeline } from '@/events/utils/parseTimeline'
import { getPublicSupabaseEnv } from '@/core/supabase/publicEnv'

/** Columns the public home / cards / detail UI actually need. */
const PUBLIC_EVENT_COLUMNS = [
  'id', 'name', 'time', 'end_time', 'location', 'price', 'public',
  'image_url', 'buttons', 'timeline',
].join(',')

function mapEvent(row: Record<string, unknown>): DbEvent {
  return { ...(row as unknown as DbEvent), timeline: parseTimeline(row.timeline) }
}

/**
 * Public events via PostgREST `fetch` — keeps @supabase/supabase-js off the
 * anonymous homepage critical path (~200 KB).
 */
export async function fetchPublicEvents(): Promise<DbEvent[]> {
  const { url: base, anonKey } = getPublicSupabaseEnv()

  const url =
    `${base}/rest/v1/events`
    + `?select=${encodeURIComponent(PUBLIC_EVENT_COLUMNS)}`
    + `&public=eq.true`
    + `&order=time.asc`

  const res = await fetch(url, {
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      Accept: 'application/json',
    },
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`fetchPublicEvents failed: ${res.status} ${body}`)
  }
  const data = (await res.json()) as Record<string, unknown>[]
  return data.map(mapEvent)
}
