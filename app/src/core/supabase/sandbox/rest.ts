/**
 * PostgREST interception.
 *
 * GET  → forwarded to the real database, then the local overlay is folded in.
 * POST / PATCH / DELETE → never forwarded. The change is recorded in the
 * overlay and a PostgREST-shaped response is synthesised so supabase-js (and
 * therefore every service in the app) cannot tell the difference.
 */

import { getMeta, pkOf, type Row } from './schema'
import { insertRow, localRows, overlay, patchRow, removeRow } from './store'
import { mergeRead, type RawFetch } from './merge'

const REST = '/rest/v1/'

export function isRestRequest(url: URL): boolean {
  return url.pathname.includes(REST)
}

function tableOf(url: URL): string {
  return url.pathname.split(REST)[1]?.split('/')[0] ?? ''
}

function json(body: unknown, status: number, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...extra },
  })
}

/** PostgREST's "one row expected" error — supabase-js maps it for maybeSingle(). */
function singleRowError(count: number): Response {
  return json({
    code: 'PGRST116',
    details: `Results contain ${count} rows, application/vnd.pgrst.object+json requires 1 row`,
    hint: null,
    message: 'JSON object requested, multiple (or no) rows returned',
  }, 406)
}

function wantsSingle(headers: Headers): boolean {
  return (headers.get('Accept') ?? '').includes('vnd.pgrst.object')
}

// ── Reads ──────────────────────────────────────────────────────────────────

async function handleRead(
  table: string,
  url: URL,
  init: RequestInit,
  headers: Headers,
  rawFetch: typeof fetch,
): Promise<Response> {
  const res = await rawFetch(url.toString(), init)
  // 406 means "single row requested, none found" — a local insert may still
  // satisfy it, so fall through with an empty row set instead of returning.
  if (!res.ok && res.status !== 406) return res

  const text = await res.text()
  let body: unknown = null
  try { body = text ? JSON.parse(text) : null } catch { return new Response(text, { status: res.status }) }

  const single = wantsSingle(headers)
  const rows: Row[] = Array.isArray(body)
    ? body as Row[]
    : (res.ok && body && typeof body === 'object' ? [body as Row] : [])

  const raw: RawFetch = u => rawFetch(u, { method: 'GET', headers: readHeaders(headers) })
  const merged = await mergeRead(table, rows, url, raw)

  if (single) return merged.length === 1 ? json(merged[0], 200) : singleRowError(merged.length)

  const extra: Record<string, string> = {}
  if (res.headers.get('content-range')) {
    extra['content-range'] = merged.length ? `0-${merged.length - 1}/${merged.length}` : `*/0`
  }
  return json(merged, 200, extra)
}

/**
 * Headers for a re-read we issue ourselves. Keeps the caller's `apikey` /
 * `Authorization` (Supabase rejects the request without them) but drops the
 * write-shaped bits and forces the plain array response form.
 */
function readHeaders(headers: Headers): Headers {
  const out = new Headers(headers)
  out.set('Accept', 'application/json')
  out.delete('Prefer')
  out.delete('Content-Type')
  out.delete('Content-Length')
  return out
}

// ── Writes ─────────────────────────────────────────────────────────────────

/**
 * Rows a PATCH/DELETE targets. Resolved by *reading* the same filters back —
 * the merged view, so locally-created rows and local deletions are respected.
 */
async function resolveTargets(
  table: string,
  url: URL,
  headers: Headers,
  rawFetch: typeof fetch,
): Promise<Row[]> {
  const target = new URL(url.toString())
  target.searchParams.set('select', '*')
  const get: RawFetch = u => rawFetch(u, { method: 'GET', headers: readHeaders(headers) })

  const res = await get(target.toString())
  let real: Row[] = []
  if (res.ok) {
    const body = await res.json().catch(() => null)
    if (Array.isArray(body)) real = body as Row[]
  }
  return mergeRead(table, real, target, get)
}

/** Find the row an upsert would collide with, locally or in the real database. */
async function findConflict(
  table: string,
  cols: string[],
  row: Row,
  url: URL,
  headers: Headers,
  rawFetch: typeof fetch,
): Promise<string | null> {
  const meta = getMeta(table)
  if (cols.some(c => row[c] === undefined || row[c] === null)) return null

  for (const local of localRows(table)) {
    if (cols.every(c => String(local[c]) === String(row[c]))) return pkOf(table, local)
  }

  const target = new URL(url.toString())
  target.search = ''
  target.searchParams.set('select', meta.pk)
  for (const c of cols) target.searchParams.set(c, `eq.${String(row[c])}`)
  target.searchParams.set('limit', '1')
  try {
    const res = await rawFetch(target.toString(), { method: 'GET', headers: readHeaders(headers) })
    if (!res.ok) return null
    const body = await res.json().catch(() => null)
    const first = Array.isArray(body) ? body[0] as Row : null
    if (!first) return null
    const pk = String(first[meta.pk])
    return overlay(table).deleted.includes(pk) ? null : pk
  } catch {
    return null
  }
}

async function handleInsert(
  table: string,
  url: URL,
  headers: Headers,
  bodyText: string,
  rawFetch: typeof fetch,
): Promise<Row[]> {
  const meta = getMeta(table)
  const prefer = headers.get('Prefer') ?? ''
  const merge = prefer.includes('merge-duplicates')
  const ignore = prefer.includes('ignore-duplicates')
  const conflict = url.searchParams.get('on_conflict')?.split(',') ?? meta.unique[0] ?? null

  let parsed: unknown = []
  try { parsed = JSON.parse(bodyText || '[]') } catch { /* empty insert */ }
  const inputs: Row[] = Array.isArray(parsed) ? parsed as Row[] : [parsed as Row]

  const created: Row[] = []
  for (const input of inputs) {
    const row: Row = { ...meta.defaults(), ...input }
    if (meta.genPk && (row[meta.pk] === undefined || row[meta.pk] === null)) {
      row[meta.pk] = crypto.randomUUID()
    }

    const existing = (merge || ignore) && conflict
      ? await findConflict(table, conflict, row, url, headers, rawFetch)
      : null

    if (existing) {
      if (!ignore) patchRow(table, existing, input)
      created.push({ ...row, [meta.pk]: existing })
      continue
    }
    insertRow(table, row)
    created.push(row)
  }
  return created
}

async function handleUpdate(
  table: string,
  url: URL,
  headers: Headers,
  bodyText: string,
  rawFetch: typeof fetch,
): Promise<Row[]> {
  let patch: Row = {}
  try { patch = JSON.parse(bodyText || '{}') as Row } catch { /* no-op update */ }
  const targets = await resolveTargets(table, url, headers, rawFetch)
  for (const row of targets) patchRow(table, pkOf(table, row), patch)
  return targets.map(row => ({ ...row, ...patch }))
}

async function handleDelete(
  table: string,
  url: URL,
  headers: Headers,
  rawFetch: typeof fetch,
): Promise<Row[]> {
  const targets = await resolveTargets(table, url, headers, rawFetch)
  for (const row of targets) removeRow(table, pkOf(table, row))
  return targets
}

function writeResponse(rows: Row[], headers: Headers, status: number): Response {
  const prefer = headers.get('Prefer') ?? ''
  if (!prefer.includes('return=representation')) return new Response('', { status })
  if (!wantsSingle(headers)) return json(rows, status)
  return rows.length === 1 ? json(rows[0], status) : singleRowError(rows.length)
}

// ── Entry point ────────────────────────────────────────────────────────────

export async function handleRest(
  url: URL,
  init: RequestInit,
  rawFetch: typeof fetch,
): Promise<Response> {
  const table = tableOf(url)
  const headers = new Headers(init.headers)
  const method = (init.method ?? 'GET').toUpperCase()

  if (method === 'GET') return handleRead(table, url, init, headers, rawFetch)
  if (method === 'HEAD') return rawFetch(url.toString(), init)

  // Stored procedures are opaque to us — they could write anything, so they are
  // refused outright rather than guessed at. (Nothing in the app calls one.)
  if (table === 'rpc') {
    console.warn(`[sandbox] blocked rpc call ${url.pathname} — not supported in sandbox mode`)
    return json({ message: 'sandbox: rpc calls are blocked' }, 403)
  }

  const bodyText = typeof init.body === 'string' ? init.body : ''
  const label = `${method} ${table}`

  switch (method) {
    case 'POST':
    case 'PUT': {
      const rows = await handleInsert(table, url, headers, bodyText, rawFetch)
      console.info(`[sandbox] kept local: ${label} (${rows.length} row${rows.length === 1 ? '' : 's'})`)
      return writeResponse(rows, headers, 201)
    }
    case 'PATCH': {
      const rows = await handleUpdate(table, url, headers, bodyText, rawFetch)
      console.info(`[sandbox] kept local: ${label} (${rows.length} row${rows.length === 1 ? '' : 's'})`)
      return writeResponse(rows, headers, 200)
    }
    case 'DELETE': {
      const rows = await handleDelete(table, url, headers, rawFetch)
      console.info(`[sandbox] kept local: ${label} (${rows.length} row${rows.length === 1 ? '' : 's'})`)
      return writeResponse(rows, headers, 200)
    }
    default:
      // Unknown verb — refuse rather than risk letting a write through.
      console.warn(`[sandbox] blocked unsupported ${label}`)
      return json({ message: `sandbox blocked ${method}` }, 405)
  }
}
