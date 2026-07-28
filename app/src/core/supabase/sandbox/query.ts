/**
 * Just enough PostgREST query-string understanding to decide, locally, whether
 * a row a) matches the request's filters and b) where it sorts.
 *
 * Only the operators this app actually uses are implemented. Anything else is
 * reported once and treated as "does not match", which is the safe direction:
 * a locally-created row stays hidden rather than showing up where the real
 * database would not have returned it.
 */

import type { Row } from './schema'

const RESERVED = new Set(['select', 'order', 'limit', 'offset', 'on_conflict', 'columns'])

export interface Filter { col: string; op: string; raw: string; not: boolean }
export interface OrderTerm { col: string; asc: boolean }

const warned = new Set<string>()
function warnOnce(op: string) {
  if (warned.has(op)) return
  warned.add(op)
  console.warn(`[sandbox] unsupported PostgREST operator "${op}" — locally-created rows may not show up in this query`)
}

// ── Filters ────────────────────────────────────────────────────────────────

export function parseFilters(params: URLSearchParams): Filter[] {
  const out: Filter[] = []
  for (const [key, value] of params.entries()) {
    if (RESERVED.has(key) || key === 'and' || key === 'or') continue
    // `subtasks.order=…` style modifiers target an embedded table, not this row.
    if (key.includes('.')) continue
    let rest = value
    let not = false
    if (rest.startsWith('not.')) {
      not = true
      rest = rest.slice(4)
    }
    const dot = rest.indexOf('.')
    if (dot < 0) continue
    out.push({ col: key, op: rest.slice(0, dot), raw: rest.slice(dot + 1), not })
  }
  return out
}

function unquote(value: string): string {
  return value.length > 1 && value.startsWith('"') && value.endsWith('"')
    ? value.slice(1, -1)
    : value
}

function looseEq(rowVal: unknown, raw: string): boolean {
  const want = unquote(raw)
  if (rowVal === null || rowVal === undefined) return want === 'null'
  return String(rowVal) === want
}

function compare(rowVal: unknown, raw: string): number {
  const a = Number(rowVal)
  const b = Number(unquote(raw))
  if (!Number.isNaN(a) && !Number.isNaN(b)) return a - b
  const da = Date.parse(String(rowVal))
  const db = Date.parse(unquote(raw))
  if (!Number.isNaN(da) && !Number.isNaN(db)) return da - db
  return String(rowVal).localeCompare(unquote(raw))
}

/** `in.(a,b,"c,d")` → ['a','b','c,d'] */
function parseList(raw: string): string[] {
  const inner = raw.replace(/^\(/, '').replace(/\)$/, '')
  const out: string[] = []
  let buf = ''
  let quoted = false
  for (const ch of inner) {
    if (ch === '"') { quoted = !quoted; continue }
    if (ch === ',' && !quoted) { out.push(buf); buf = ''; continue }
    buf += ch
  }
  if (buf) out.push(buf)
  return out
}

function likeMatch(rowVal: unknown, raw: string, insensitive: boolean): boolean {
  const pattern = unquote(raw).replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/[*%]/g, '.*')
  return new RegExp(`^${pattern}$`, insensitive ? 'i' : '').test(String(rowVal ?? ''))
}

function testOne(f: Filter, row: Row): boolean {
  const v = row[f.col]
  switch (f.op) {
    case 'eq':    return looseEq(v, f.raw)
    case 'neq':   return !looseEq(v, f.raw)
    case 'gt':    return compare(v, f.raw) > 0
    case 'gte':   return compare(v, f.raw) >= 0
    case 'lt':    return compare(v, f.raw) < 0
    case 'lte':   return compare(v, f.raw) <= 0
    case 'is':    return f.raw === 'null' ? v === null || v === undefined : String(v) === f.raw
    case 'in':    return parseList(f.raw).some(x => looseEq(v, x))
    case 'like':  return likeMatch(v, f.raw, false)
    case 'ilike': return likeMatch(v, f.raw, true)
    default:      warnOnce(f.op); return false
  }
}

/** True when a row satisfies every filter on the request. */
export function rowMatches(row: Row, filters: Filter[]): boolean {
  return filters.every(f => (f.not ? !testOne(f, row) : testOne(f, row)))
}

// ── Ordering ───────────────────────────────────────────────────────────────

/** `created_at.desc,id.asc` → order terms. Bare `time` means ascending. */
export function parseOrder(value: string | null): OrderTerm[] {
  if (!value) return []
  return value.split(',').map(part => {
    const [col, ...mods] = part.split('.')
    return { col, asc: !mods.includes('desc') }
  })
}

export function sortRows(rows: Row[], terms: OrderTerm[]): Row[] {
  if (!terms.length) return rows
  return [...rows].sort((a, b) => {
    for (const t of terms) {
      const av = a[t.col]
      const bv = b[t.col]
      if (av === bv) continue
      // Postgres sorts NULLs last for ASC, first for DESC.
      if (av === null || av === undefined) return t.asc ? 1 : -1
      if (bv === null || bv === undefined) return t.asc ? -1 : 1
      const d = compare(av, String(bv))
      if (d !== 0) return t.asc ? d : -d
    }
    return 0
  })
}

// ── select= trees ──────────────────────────────────────────────────────────

export interface SelectNode {
  /** Key the value appears under in the response (the alias, if any). */
  key: string
  /** Relation name to look up in the schema (before aliasing). */
  name: string
  children: SelectNode[]
}

/**
 * Parses `id,title,subtasks(id,title),task_assignments(members(name))` into a
 * tree. Only the embedded (parenthesised) entries matter to the overlay; plain
 * columns are kept so callers can tell "no embeds" from "not parsed".
 */
export function parseSelect(select: string | null): SelectNode[] {
  if (!select) return []
  const nodes: SelectNode[] = []
  let buf = ''
  let depth = 0
  let inner = ''

  const flush = () => {
    const raw = buf.trim()
    buf = ''
    if (!raw) return
    // `alias:relation` — the response uses the alias as the key.
    const colon = raw.indexOf(':')
    const key = colon > 0 ? raw.slice(0, colon) : raw
    // `!inner` / `!left` hints are not part of the relation name.
    const name = (colon > 0 ? raw.slice(colon + 1) : raw).split('!')[0]
    nodes.push({ key: colon > 0 ? key : name, name, children: parseSelect(inner || null) })
    inner = ''
  }

  for (const ch of select) {
    if (ch === '(') {
      depth++
      if (depth === 1) continue
    } else if (ch === ')') {
      depth--
      if (depth === 0) continue
    }
    if (depth > 0) { inner += ch; continue }
    if (ch === ',') { flush(); continue }
    buf += ch
  }
  flush()
  return nodes
}
