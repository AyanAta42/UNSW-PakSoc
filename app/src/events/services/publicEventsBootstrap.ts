import type { DbEvent } from '@/events/types/Event'
import { fetchPublicEvents } from '@/events/services/fetchPublicEvents'

const CACHE_KEY = 'paksoc:public-events:v1'

type CachePayload = { at: number; events: DbEvent[] }

declare global {
  interface Window {
    /** Set by the inline head boot script — starts before React downloads. */
    __PAKSOC_EVENTS_P__?: Promise<unknown>
    __PAKSOC_EVENTS_CACHE_KEY__?: string
  }
}

let inflight: Promise<DbEvent[]> | null = null

function readCache(): DbEvent[] | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as CachePayload
    if (!Array.isArray(parsed?.events)) return null
    return parsed.events
  } catch {
    return null
  }
}

function writeCache(events: DbEvent[]) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), events } satisfies CachePayload))
  } catch {
    /* quota / private mode */
  }
}

function adoptBootPromise(): Promise<DbEvent[]> | null {
  const boot = typeof window !== 'undefined' ? window.__PAKSOC_EVENTS_P__ : undefined
  if (!boot) return null
  return Promise.resolve(boot).then((raw) => {
    const rows = raw as Record<string, unknown>[]
    if (!Array.isArray(rows)) throw new Error('boot events payload invalid')
    // Timeline is already JSON from PostgREST; HomePage parse happens in fetchPublicEvents path.
    // Boot script returns raw rows — map lightly here.
    return rows as unknown as DbEvent[]
  })
}

/** Kick off / reuse the earliest possible events request. */
export function prefetchPublicEvents(): Promise<DbEvent[]> {
  if (inflight) return inflight

  const fromBoot = adoptBootPromise()
  inflight = (fromBoot ?? fetchPublicEvents())
    .then(events => {
      writeCache(events)
      return events
    })
    .catch(async (err) => {
      // If boot failed, fall through to the module fetch once
      if (fromBoot) {
        const events = await fetchPublicEvents()
        writeCache(events)
        return events
      }
      throw err
    })

  return inflight
}

export function getCachedPublicEvents(): DbEvent[] | null {
  return readCache()
}

export async function loadPublicEvents(): Promise<DbEvent[]> {
  try {
    return await prefetchPublicEvents()
  } catch (err) {
    const cached = readCache()
    if (cached) return cached
    throw err
  }
}
