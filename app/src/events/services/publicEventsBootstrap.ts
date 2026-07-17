import type { DbEvent } from '@/events/types/Event'
import { fetchPublicEvents } from '@/events/services/fetchPublicEvents'

const CACHE_KEY = 'paksoc:public-events:v1'
const CACHE_MAX_AGE_MS = 5 * 60 * 1000

type CachePayload = { at: number; events: DbEvent[] }

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
    const payload: CachePayload = { at: Date.now(), events }
    localStorage.setItem(CACHE_KEY, JSON.stringify(payload))
  } catch {
    /* quota / private mode */
  }
}

function cacheIsFresh(): boolean {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return false
    const parsed = JSON.parse(raw) as CachePayload
    return typeof parsed?.at === 'number' && Date.now() - parsed.at < CACHE_MAX_AGE_MS
  } catch {
    return false
  }
}

/** Kick off the network fetch as early as possible (call from main.tsx). */
export function prefetchPublicEvents(): Promise<DbEvent[]> {
  if (!inflight) {
    inflight = fetchPublicEvents()
      .then(events => {
        writeCache(events)
        return events
      })
      .finally(() => {
        /* keep resolved promise for awaiters; allow refresh later */
      })
  }
  return inflight
}

/** Instant cache (may be stale) for first paint. */
export function getCachedPublicEvents(): DbEvent[] | null {
  return readCache()
}

export function hasFreshPublicEventsCache(): boolean {
  return cacheIsFresh()
}

/**
 * Prefer fresh network data; fall back to cache if the request fails.
 * If cache exists, callers can paint it immediately while this resolves.
 */
export async function loadPublicEvents(): Promise<DbEvent[]> {
  try {
    return await prefetchPublicEvents()
  } catch (err) {
    const cached = readCache()
    if (cached) return cached
    throw err
  }
}
