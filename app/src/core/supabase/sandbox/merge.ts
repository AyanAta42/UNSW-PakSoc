/**
 * Folds the local overlay into a real PostgREST response, so a read shows live
 * database rows *plus* whatever you changed locally — deletions hidden, updates
 * patched in, locally-created rows appended (with their embedded children).
 */

import { getMeta, pkOf, type Row } from './schema'
import {
  localRows, overlay, recallRow, rememberRows,
} from './store'
import {
  parseFilters, parseOrder, parseSelect, rowMatches, sortRows,
  type SelectNode,
} from './query'

/** Fetch used to re-read rows the server filtered out — never intercepted. */
export type RawFetch = (url: string) => Promise<Response>

// ── Embeds ─────────────────────────────────────────────────────────────────

function hydrate(table: string, row: Row, nodes: SelectNode[], params: URLSearchParams, path: string): Row {
  const meta = getMeta(table)
  const out: Row = { ...row }

  for (const node of nodes) {
    if (!node.children.length) continue
    const rel = meta.relations[node.name]
    if (!rel) continue
    const childPath = path ? `${path}.${node.key}` : node.key

    // Many-to-one (`task_assignments.members`): follow the FK on this row.
    if (rel.via) {
      const raw = out[node.key]
      const target = (raw && typeof raw === 'object' && !Array.isArray(raw) ? raw as Row : null)
        ?? recallRow(rel.table, String(out[rel.via] ?? ''))
      out[node.key] = target ? patchOne(rel.table, target, node.children, params, childPath) : null
      continue
    }

    // One-to-many (`tasks.subtasks`): real children from the response, then any
    // created locally that point at this row.
    const fk = rel.fk!
    const base = Array.isArray(out[node.key]) ? (out[node.key] as Row[]) : []
    const o = overlay(rel.table)
    const kept: Row[] = []
    for (const child of base) {
      const pk = pkOf(rel.table, child)
      if (o.deleted.includes(pk)) continue
      kept.push(hydrate(rel.table, { ...child, ...(o.updated[pk] ?? {}) }, node.children, params, childPath))
    }
    const seen = new Set(kept.map(c => pkOf(rel.table, c)))
    for (const child of localRows(rel.table)) {
      if (String(child[fk]) !== pkOf(table, row) || seen.has(pkOf(rel.table, child))) continue
      kept.push(hydrate(rel.table, child, node.children, params, childPath))
    }
    out[node.key] = sortRows(kept, parseOrder(params.get(`${childPath}.order`)))
  }

  return out
}

/** Apply the overlay to a single embedded row (many-to-one target). */
function patchOne(table: string, row: Row, nodes: SelectNode[], params: URLSearchParams, path: string): Row | null {
  const o = overlay(table)
  const pk = pkOf(table, row)
  if (o.deleted.includes(pk)) return null
  return hydrate(table, { ...row, ...(o.updated[pk] ?? {}) }, nodes, params, path)
}

// ── Remembering real rows ──────────────────────────────────────────────────

/** Cache real rows of embed-target tables so local rows can resolve their FKs. */
function remember(table: string, rows: Row[], nodes: SelectNode[]): void {
  rememberRows(table, rows)
  const meta = getMeta(table)
  for (const node of nodes) {
    const rel = meta.relations[node.name]
    if (!rel || !node.children.length) continue
    const nested: Row[] = []
    for (const row of rows) {
      const v = row?.[node.key]
      if (Array.isArray(v)) nested.push(...(v as Row[]))
      else if (v && typeof v === 'object') nested.push(v as Row)
    }
    if (nested.length) remember(rel.table, nested, node.children)
  }
}

// ── Resolving embeds for local rows ────────────────────────────────────────

/**
 * Walk the rows about to be hydrated and note every many-to-one embed we can't
 * satisfy from the overlay. A row created locally carries only the foreign key
 * — the row it points at (a member, say) lives in the real database, and may
 * not have been read yet this session.
 */
function collectMissing(
  table: string,
  rows: Row[],
  nodes: SelectNode[],
  out: Record<string, Set<string>>,
): void {
  const meta = getMeta(table)
  for (const node of nodes) {
    if (!node.children.length) continue
    const rel = meta.relations[node.name]
    if (!rel) continue

    if (rel.via) {
      for (const row of rows) {
        const embedded = row[node.key]
        if (embedded && typeof embedded === 'object') continue
        const pk = String(row[rel.via] ?? '')
        if (!pk || pk === 'null' || recallRow(rel.table, pk)) continue
        ;(out[rel.table] ??= new Set()).add(pk)
      }
      continue
    }

    const parents = new Set(rows.map(r => pkOf(table, r)))
    const children: Row[] = []
    for (const row of rows) {
      const v = row[node.key]
      if (Array.isArray(v)) children.push(...(v as Row[]))
    }
    for (const child of localRows(rel.table)) {
      if (parents.has(String(child[rel.fk!]))) children.push(child)
    }
    if (children.length) collectMissing(rel.table, children, node.children, out)
  }
}

/** Build the URL of a different table on the same PostgREST endpoint. */
function siblingUrl(url: URL, table: string): URL {
  const out = new URL(url.toString())
  out.search = ''
  out.pathname = `${out.pathname.split('/rest/v1/')[0]}/rest/v1/${table}`
  return out
}

/** Fetch and cache the embed targets `collectMissing` turned up. */
async function fetchMissing(url: URL, missing: Record<string, Set<string>>, rawFetch: RawFetch): Promise<void> {
  for (const [table, pks] of Object.entries(missing)) {
    if (!pks.size) continue
    const target = siblingUrl(url, table)
    target.searchParams.set('select', '*')
    target.searchParams.set(getMeta(table).pk, `in.(${[...pks].map(p => `"${p}"`).join(',')})`)
    try {
      const res = await rawFetch(target.toString())
      if (!res.ok) continue
      const body = (await res.json()) as unknown
      if (Array.isArray(body)) rememberRows(table, body as Row[], true)
    } catch { /* embed stays null — the UI degrades, nothing breaks */ }
  }
}

// ── De-duplication ─────────────────────────────────────────────────────────

/** Key a row by its first satisfiable unique constraint, for upsert de-duping. */
function uniqueKeys(table: string, row: Row): string[] {
  return getMeta(table).unique
    .filter(cols => cols.every(c => row[c] !== null && row[c] !== undefined))
    .map(cols => `${cols.join('|')}=${cols.map(c => String(row[c])).join('|')}`)
}

// ── Entry point ────────────────────────────────────────────────────────────

/**
 * Merge overlay state into the rows PostgREST returned for `table`.
 * `rawFetch` is used to re-read rows the server's own filters excluded but that
 * a local update would now bring into range (e.g. publishing a draft event).
 */
export async function mergeRead(
  table: string,
  rows: Row[],
  url: URL,
  rawFetch: RawFetch,
): Promise<Row[]> {
  const params = url.searchParams
  const nodes = parseSelect(params.get('select'))
  const filters = parseFilters(params)
  const o = overlay(table)

  remember(table, rows, nodes)

  // Rows created locally that this query should return.
  const candidates = localRows(table).filter(row => rowMatches(row, filters))

  // Pull in any embed target these rows reference but we've never read.
  const missing: Record<string, Set<string>> = {}
  collectMissing(table, [...rows, ...candidates], nodes, missing)
  if (Object.keys(missing).length) await fetchMissing(url, missing, rawFetch)

  const present = new Set<string>()
  const out: Row[] = []

  for (const row of rows) {
    const pk = pkOf(table, row)
    present.add(pk)
    if (o.deleted.includes(pk)) continue
    const patch = o.updated[pk]
    const merged = patch ? { ...row, ...patch } : row
    // A local edit can push a row out of the query's range (unpublishing an
    // event that was fetched with `public=eq.true`). Only re-test patched rows:
    // unpatched ones already passed the real, complete filter engine.
    if (patch && !rowMatches(merged, filters)) continue
    out.push(hydrate(table, merged, nodes, params, ''))
  }

  // The mirror case: rows the server excluded that a local patch now qualifies.
  const unseen = Object.keys(o.updated).filter(pk => !present.has(pk))
  if (unseen.length && filters.length) {
    const revived = await refetchByPk(table, unseen, url, rawFetch)
    remember(table, revived, nodes)
    for (const row of revived) {
      const pk = pkOf(table, row)
      if (o.deleted.includes(pk)) continue
      const merged = { ...row, ...o.updated[pk] }
      if (!rowMatches(merged, filters)) continue
      out.push(hydrate(table, merged, nodes, params, ''))
      present.add(pk)
    }
  }

  // Rows created locally. Skip any that duplicate a real row on a unique key —
  // that is what an upsert would have done server-side.
  const realKeys = new Set(out.flatMap(r => uniqueKeys(table, r)))
  for (const row of candidates) {
    if (present.has(pkOf(table, row))) continue
    if (uniqueKeys(table, row).some(k => realKeys.has(k))) continue
    out.push(hydrate(table, row, nodes, params, ''))
  }

  const sorted = sortRows(out, parseOrder(params.get('order')))
  const limit = Number(params.get('limit'))
  return limit > 0 ? sorted.slice(0, limit) : sorted
}

/** Re-read specific rows by primary key, ignoring the original filters. */
async function refetchByPk(table: string, pks: string[], url: URL, rawFetch: RawFetch): Promise<Row[]> {
  const target = new URL(url.toString())
  const keep = new Set(['select', 'order'])
  for (const key of [...target.searchParams.keys()]) {
    if (!keep.has(key) && !key.includes('.')) target.searchParams.delete(key)
  }
  target.searchParams.set(getMeta(table).pk, `in.(${pks.map(p => `"${p}"`).join(',')})`)
  try {
    const res = await rawFetch(target.toString())
    if (!res.ok) return []
    const body = (await res.json()) as unknown
    return Array.isArray(body) ? (body as Row[]) : []
  } catch {
    return []
  }
}
