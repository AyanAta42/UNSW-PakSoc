import type { DbEvent } from '@/events/types/Event'
import { parseTimeline } from '@/events/utils/parseTimeline'
import { getPublicSupabaseEnv } from '@/core/supabase/publicEnv'

/** Columns the public home / cards / detail UI actually need. */
const BASE_COLUMNS = [
  'id', 'name', 'time', 'end_time', 'location', 'price', 'public',
  'image_url', 'buttons', 'timeline',
]

/**
 * Added by migration 20260811000001_banner_note. Kept separate so
 * a deploy that lands before the SQL has run degrades to "no release teaser"
 * instead of an empty homepage — PostgREST rejects the *whole* request when a
 * single selected column is unknown. Fold these into BASE_COLUMNS once the
 * migration has run everywhere.
 */
const OPTIONAL_COLUMNS = ['banner_note']

function mapEvent(row: Record<string, unknown>): DbEvent {
  return { ...(row as unknown as DbEvent), timeline: parseTimeline(row.timeline) }
}

/**
 * Public events via PostgREST `fetch` — keeps @supabase/supabase-js off the
 * anonymous homepage critical path (~200 KB).
 */
export async function fetchPublicEvents(): Promise<DbEvent[]> {
  const { url: base, anonKey } = getPublicSupabaseEnv()

  const request = (columns: string[]) => fetch(
    `${base}/rest/v1/events`
    + `?select=${encodeURIComponent(columns.join(','))}`
    + `&public=eq.true`
    + `&order=time.asc`,
    {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        Accept: 'application/json',
      },
    },
  )

  let res = await request([...BASE_COLUMNS, ...OPTIONAL_COLUMNS])

  // 42703 = undefined_column: this database predates the migration above.
  if (res.status === 400) {
    const body = await res.text().catch(() => '')
    if (!body.includes('42703')) throw new Error(`fetchPublicEvents failed: 400 ${body}`)
    res = await request(BASE_COLUMNS)
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`fetchPublicEvents failed: ${res.status} ${body}`)
  }
  const data = (await res.json()) as Record<string, unknown>[]
  return data.map(mapEvent)
}
