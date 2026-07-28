/**
 * The local overlay: every write the app makes in sandbox mode lands here
 * instead of Postgres. Persisted to localStorage so a reload keeps your test
 * state, and cleared with `Reset` on the sandbox badge (or `sandbox.reset()`).
 */

import { getMeta, type Row } from './schema'

const KEY = 'paksoc:sandbox:v1'
/** Cap on remembered real rows per table, so the blob can't grow unbounded. */
const SEEN_CAP = 400

export interface TableOverlay {
  /** Rows created locally, keyed by primary key. */
  inserted: Record<string, Row>
  /** Column patches for rows that live in the real database, keyed by pk. */
  updated: Record<string, Row>
  /** Primary keys of real rows hidden locally. */
  deleted: string[]
}

export interface SandboxState {
  tables: Record<string, TableOverlay>
  /** Locally "uploaded" files: `${bucket}/${path}` → data URL. */
  files: Record<string, string>
  /** Real rows kept around so local rows can resolve many-to-one embeds. */
  seen: Record<string, Record<string, Row>>
  /** Number of writes intercepted — shown on the badge. */
  writes: number
}

function empty(): SandboxState {
  return { tables: {}, files: {}, seen: {}, writes: 0 }
}

let state: SandboxState = load()
const listeners = new Set<() => void>()

function load(): SandboxState {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return empty()
    const parsed = JSON.parse(raw) as Partial<SandboxState>
    return { ...empty(), ...parsed }
  } catch {
    return empty()
  }
}

let saveTimer: number | undefined
function save() {
  window.clearTimeout(saveTimer)
  saveTimer = window.setTimeout(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state))
    } catch {
      // Quota — almost always a big data-URL upload. Drop the files and retry
      // so the row overlay (the part that actually matters) still persists.
      state.files = {}
      try { localStorage.setItem(KEY, JSON.stringify(state)) } catch { /* give up */ }
      console.warn('[sandbox] localStorage full — dropped locally uploaded images')
    }
  }, 100)
  for (const fn of listeners) fn()
}

export function getState(): SandboxState {
  return state
}

export function onSandboxChange(fn: () => void): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function overlay(table: string): TableOverlay {
  return (state.tables[table] ??= { inserted: {}, updated: {}, deleted: [] })
}

/** Total rows touched locally — drives the badge counter. */
export function writeCount(): number {
  return state.writes
}

export function resetSandbox(): void {
  state = empty()
  try { localStorage.removeItem(KEY) } catch { /* private mode */ }
  for (const fn of listeners) fn()
}

// ── Row mutations ──────────────────────────────────────────────────────────

export function insertRow(table: string, row: Row): void {
  const o = overlay(table)
  const pk = String(row[getMeta(table).pk])
  o.inserted[pk] = row
  // A locally re-created pk is no longer "deleted".
  o.deleted = o.deleted.filter(id => id !== pk)
  state.writes++
  save()
}

/** Merge a patch into a row, whether it lives locally or in the real database. */
export function patchRow(table: string, pk: string, patch: Row): void {
  const o = overlay(table)
  if (o.inserted[pk]) o.inserted[pk] = { ...o.inserted[pk], ...patch }
  else o.updated[pk] = { ...(o.updated[pk] ?? {}), ...patch }
  state.writes++
  save()
}

/** Hide a row: drops it locally, or masks the real one, plus cascade children. */
export function removeRow(table: string, pk: string): void {
  const o = overlay(table)
  if (o.inserted[pk]) delete o.inserted[pk]
  else if (!o.deleted.includes(pk)) o.deleted.push(pk)
  delete o.updated[pk]

  // Emulate ON DELETE CASCADE for rows we created locally. Real children need
  // no bookkeeping: they are only ever read through their (now hidden) parent.
  for (const [child, fk] of getMeta(table).cascades) {
    const co = overlay(child)
    for (const [childPk, row] of Object.entries(co.inserted)) {
      if (String(row[fk]) === pk) removeRow(child, childPk)
    }
  }
  state.writes++
  save()
}

/** Local rows for a table, as an array. */
export function localRows(table: string): Row[] {
  return Object.values(overlay(table).inserted)
}

// ── Remembered real rows (embed targets) ───────────────────────────────────

export function rememberRows(table: string, rows: Row[], force = false): void {
  if ((!force && !getMeta(table).remember) || !rows.length) return
  const bucket = (state.seen[table] ??= {})
  const pkCol = getMeta(table).pk
  let changed = false
  for (const row of rows) {
    const pk = String(row?.[pkCol] ?? '')
    if (!pk || !row) continue
    bucket[pk] = row
    changed = true
  }
  if (!changed) return
  const keys = Object.keys(bucket)
  for (const k of keys.slice(0, Math.max(0, keys.length - SEEN_CAP))) delete bucket[k]
  save()
}

/** A real row previously seen in a read, used to resolve embeds for local rows. */
export function recallRow(table: string, pk: string): Row | null {
  return overlay(table).inserted[pk] ?? state.seen[table]?.[pk] ?? null
}

// ── Fake storage uploads ───────────────────────────────────────────────────

export function putFile(key: string, dataUrl: string): void {
  state.files[key] = dataUrl
  state.writes++
  save()
}

export function getFile(key: string): string | null {
  return state.files[key] ?? null
}
