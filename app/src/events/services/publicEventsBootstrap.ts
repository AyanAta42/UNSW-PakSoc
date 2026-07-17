import type { DbEvent } from '@/events/types/Event'
import { fetchPublicEvents } from '@/events/services/fetchPublicEvents'
import { parseTimeline } from '@/events/utils/parseTimeline'

const CACHE_KEY = 'paksoc:public-events:v1'
const FRESH_MS = 5 * 60 * 1000

type CachePayload = { at: number; events: DbEvent[] }

declare global {
  interface Window {
    __PAKSOC_EVENTS_P__?: Promise<unknown>
    __PAKSOC_STOP_BOOT__?: () => void
  }
}

let inflight: Promise<DbEvent[]> | null = null
/** In-memory session cache — survives route changes without refetch. */
let sessionEvents: DbEvent[] | null = null
let sessionAt = 0

export function normalizePublicEvents(rows: DbEvent[]): DbEvent[] {
  return rows.map(ev => ({
    ...ev,
    timeline: parseTimeline((ev as unknown as { timeline?: unknown }).timeline),
  }))
}

function readCache(): { events: DbEvent[]; at: number } | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as CachePayload
    if (!Array.isArray(parsed?.events) || typeof parsed.at !== 'number') return null
    return { events: normalizePublicEvents(parsed.events), at: parsed.at }
  } catch {
    return null
  }
}

function writeCache(events: DbEvent[]) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), events } satisfies CachePayload))
  } catch { /* quota */ }
}

function adoptBootPromise(): Promise<DbEvent[]> | null {
  const boot = typeof window !== 'undefined' ? window.__PAKSOC_EVENTS_P__ : undefined
  if (!boot) return null
  return Promise.resolve(boot).then((raw) => {
    const rows = raw as DbEvent[]
    if (!Array.isArray(rows)) throw new Error('boot events payload invalid')
    return normalizePublicEvents(rows)
  })
}

function commitSession(events: DbEvent[]) {
  sessionEvents = events
  sessionAt = Date.now()
  writeCache(events)
  return events
}

/** Instant paint source: memory → localStorage. */
export function getCachedPublicEvents(): DbEvent[] | null {
  if (sessionEvents?.length) return sessionEvents
  return readCache()?.events ?? null
}

export function hasFreshSessionEvents(): boolean {
  return !!sessionEvents && Date.now() - sessionAt < FRESH_MS
}

/** Kick off / reuse the earliest events request (once per session while fresh). */
export function prefetchPublicEvents(): Promise<DbEvent[]> {
  if (hasFreshSessionEvents() && sessionEvents) {
    return Promise.resolve(sessionEvents)
  }
  if (inflight) return inflight

  const fromBoot = adoptBootPromise()
  inflight = (fromBoot ?? fetchPublicEvents().then(normalizePublicEvents))
    .then(commitSession)
    .catch(async (err) => {
      if (fromBoot) {
        return commitSession(normalizePublicEvents(await fetchPublicEvents()))
      }
      const cached = getCachedPublicEvents()
      if (cached) return cached
      throw err
    })
    .finally(() => {
      /* keep resolved promise for concurrent awaiters */
    })

  return inflight
}

/**
 * Load events once for the SPA session. Reuses memory/cache; only hits network
 * if we have nothing fresh yet.
 */
export async function loadPublicEvents(): Promise<DbEvent[]> {
  if (hasFreshSessionEvents() && sessionEvents) return sessionEvents
  const cached = readCache()
  if (cached && Date.now() - cached.at < FRESH_MS) {
    sessionEvents = cached.events
    sessionAt = cached.at
    // Soft revalidate in background without blocking UI
    void prefetchPublicEvents()
    return cached.events
  }
  try {
    return await prefetchPublicEvents()
  } catch (err) {
    const fallback = getCachedPublicEvents()
    if (fallback) return fallback
    throw err
  }
}
