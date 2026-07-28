/**
 * Sandbox mode — local-write testing against live data.
 *
 * Reads go to the real Supabase project, so you always see current production
 * data. Every write (row insert/update/delete and file upload) is captured in a
 * localStorage overlay and folded back into subsequent reads, so the app behaves
 * exactly as if the change had been saved — while the database, and therefore
 * every real user, is untouched.
 *
 * Turn it on with `npm run dev:sandbox`, or from the badge / devtools console.
 * See app/src/core/supabase/sandbox/README.md.
 */

import { isSandboxOn, setSandboxEnabled } from './enabled'
import { handleRest, isRestRequest } from './rest'
import { patchStorage } from './storage'
import { mountLiveWarning, mountSandboxBadge } from './badge'
import { getState, resetSandbox } from './store'

/** Public events are cached before our patch installs — see clearBootCache(). */
const EVENTS_CACHE = 'paksoc:public-events:v1'
const TAINT_KEY = 'paksoc:sandbox:tainted'

declare global {
  interface Window {
    sandbox?: {
      reset: () => void
      state: () => unknown
      off: () => void
      on: () => void
    }
  }
}

/**
 * The events request is fired from an inline script in index.html, before any
 * module JS runs — so it bypasses the interceptor and its cached result holds
 * un-overlaid rows. Drop both so the app refetches through the sandbox.
 */
function clearBootCache() {
  try { localStorage.removeItem(EVENTS_CACHE) } catch { /* private mode */ }
  delete window.__PAKSOC_EVENTS_P__
}

function normalize(input: RequestInfo | URL, init?: RequestInit): { url: string; init: RequestInit } {
  if (typeof input === 'string') return { url: input, init: init ?? {} }
  if (input instanceof URL) return { url: input.toString(), init: init ?? {} }
  return {
    url: input.url,
    init: { method: input.method, headers: input.headers, ...init },
  }
}

function installFetch() {
  const realFetch = globalThis.fetch.bind(globalThis)

  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const { url: href, init: opts } = normalize(input, init)

    let url: URL
    try { url = new URL(href, location.origin) } catch { return realFetch(input as RequestInfo, init) }

    const method = (opts.method ?? 'GET').toUpperCase()

    if (isRestRequest(url)) {
      // A Request body is a stream; read it so handleRest sees plain JSON text.
      if (input instanceof Request && method !== 'GET' && method !== 'HEAD' && opts.body === undefined) {
        opts.body = await input.clone().text()
      }
      return handleRest(url, opts, realFetch)
    }

    // Belt and braces: the client-level storage patch already handles uploads,
    // but anything reaching the bucket by raw fetch is stopped here too.
    if (url.pathname.includes('/storage/v1/object/') && method !== 'GET' && method !== 'HEAD') {
      console.warn(`[sandbox] blocked ${method} ${url.pathname}`)
      return new Response(JSON.stringify({ Key: url.pathname }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    return realFetch(input as RequestInfo, init)
  }
}

/** Supabase paths that must never see a write while the sandbox is on. */
function isProtectedWrite(method: string, pathname: string): boolean {
  if (method === 'GET' || method === 'HEAD') return false
  return pathname.includes('/rest/v1/') || pathname.includes('/storage/v1/')
}

/**
 * supabase-js only ever uses `fetch`, so nothing in the app reaches the
 * database another way — but the whole promise of sandbox mode is that a write
 * *cannot* escape, so the other two ways a browser can send one are stopped
 * too. These throw rather than fake a result: they should never fire, and if
 * they ever do it should be impossible to miss.
 */
function installNetworkGuards() {
  const openXhr = XMLHttpRequest.prototype.open
  const sendXhr = XMLHttpRequest.prototype.send
  const marked = new WeakMap<XMLHttpRequest, string>()

  XMLHttpRequest.prototype.open = function (
    this: XMLHttpRequest,
    method: string,
    xhrUrl: string | URL,
    ...rest: unknown[]
  ) {
    try {
      const parsed = new URL(String(xhrUrl), location.origin)
      if (isProtectedWrite(String(method).toUpperCase(), parsed.pathname)) {
        marked.set(this, `${String(method).toUpperCase()} ${parsed.pathname}`)
      }
    } catch { /* opaque url — let it through to the real open */ }
    return (openXhr as (...a: unknown[]) => void).call(this, method, xhrUrl, ...rest)
  } as typeof XMLHttpRequest.prototype.open

  XMLHttpRequest.prototype.send = function (this: XMLHttpRequest, ...args: unknown[]) {
    const blocked = marked.get(this)
    if (blocked) throw new Error(`[sandbox] blocked XHR write: ${blocked}`)
    return (sendXhr as (...a: unknown[]) => void).apply(this, args)
  } as typeof XMLHttpRequest.prototype.send

  const beacon = navigator.sendBeacon?.bind(navigator)
  if (beacon) {
    navigator.sendBeacon = (beaconUrl: string | URL, data?: BodyInit | null) => {
      try {
        if (isProtectedWrite('POST', new URL(String(beaconUrl), location.origin).pathname)) {
          console.warn(`[sandbox] blocked sendBeacon: ${String(beaconUrl)}`)
          return false
        }
      } catch { /* fall through */ }
      return beacon(beaconUrl, data)
    }
  }
}

function mountWhenReady(mount: () => void) {
  if (document.body) mount()
  else document.addEventListener('DOMContentLoaded', mount, { once: true })
}

/**
 * A service worker left registered on this origin by an earlier production
 * build (`vite preview`, a Docker run, an installed PWA on localhost) serves
 * its own precached bundle — one built before the sandbox existed — so the page
 * silently talks to the live database no matter which dev script you started.
 * Clear any out. Returns true if one was actually controlling this page, in
 * which case the current document is already the stale one and must be
 * reloaded before the app is allowed to run.
 */
async function purgeServiceWorkers(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) return false
  try {
    const regs = await navigator.serviceWorker.getRegistrations()
    const controlled = !!navigator.serviceWorker.controller
    if (!regs.length && !controlled) return false

    await Promise.all(regs.map(r => r.unregister()))
    if ('caches' in window) {
      const keys = await caches.keys()
      await Promise.all(keys.map(k => caches.delete(k)))
    }
    console.warn(`[sandbox] removed ${regs.length} stale service worker(s) and their caches from this dev origin`)
    return controlled
  } catch {
    return false
  }
}

/** Full-screen stop sign — the app must not run if the sandbox failed to install. */
function blockApp(reason: string): void {
  mountWhenReady(() => {
    const el = document.createElement('div')
    el.setAttribute('style', [
      'position:fixed; inset:0; z-index:2147483647; background:#7f0b12; color:#fff',
      'display:flex; flex-direction:column; align-items:center; justify-content:center; gap:14px',
      'font:600 14px/1.6 ui-monospace,SFMono-Regular,Menlo,monospace; text-align:center; padding:32px',
    ].join('; '))
    el.innerHTML =
      '<div style="font-size:20px">SANDBOX FAILED TO START</div>'
      + '<div style="max-width:52ch;opacity:.9">The app was stopped instead of being allowed to write to the '
      + 'live database. Fix the error below and reload.</div>'
      + `<pre style="max-width:80ch;overflow:auto;opacity:.85;font-size:12px">${reason}</pre>`
    document.body.append(el)
  })
}

/**
 * Dev-only safety boot. Always called from main.tsx; the app is only started
 * once this resolves.
 *
 * Sandbox is the default in dev — you have to opt out with `npm run dev:live`
 * or `sandbox.off()`. If it is off, a red banner says so, because a silent
 * absence of the sandbox badge is exactly how a real write slipped through
 * once already.
 */
export async function bootSandbox(): Promise<void> {
  if (!import.meta.env.DEV) return

  // Escape a stale precached bundle before deciding anything else.
  if (await purgeServiceWorkers()) {
    const RELOAD_KEY = 'paksoc:sandbox:sw-reloaded'
    if (!sessionStorage.getItem(RELOAD_KEY)) {
      sessionStorage.setItem(RELOAD_KEY, '1')
      location.reload()
      // Never resolve: the document is going away, and the app must not start
      // on the stale bundle in the meantime.
      await new Promise<never>(() => {})
    }
  }

  if (!isSandboxOn()) {
    try {
      if (localStorage.getItem(TAINT_KEY)) {
        localStorage.removeItem(EVENTS_CACHE)
        localStorage.removeItem(TAINT_KEY)
      }
    } catch { /* private mode */ }
    mountWhenReady(mountLiveWarning)
    console.warn(
      '%c[sandbox] OFF — writes from this tab go to the REAL database.',
      'background:#c0121b;color:#fff;padding:2px 6px;border-radius:4px;font-weight:700',
    )
    return
  }

  try {
    try { localStorage.setItem(TAINT_KEY, '1') } catch { /* private mode */ }
    clearBootCache()
    installFetch()
    installNetworkGuards()

    const { supabase } = await import('../client')
    patchStorage(supabase)

    window.sandbox = {
      reset: () => { resetSandbox(); location.reload() },
      state: () => getState(),
      off: () => { setSandboxEnabled(false); location.reload() },
      on: () => { setSandboxEnabled(true); location.reload() },
    }
  } catch (err) {
    blockApp(String(err instanceof Error ? err.stack ?? err.message : err))
    throw err
  }

  mountWhenReady(mountSandboxBadge)

  console.info(
    '%c[sandbox] ON — reads are live, writes stay in this browser. window.sandbox.reset() to clear.',
    'background:#ffd230;color:#000;padding:2px 6px;border-radius:4px;font-weight:700',
  )
}
