/**
 * Session-wide image warm cache.
 *
 * React Router unmounts a page's whole tree on navigation, so every <img> is
 * destroyed and recreated when you come back — which re-requests and re-decodes
 * the picture and flashes empty/black in the gap. This keeps decoded images alive
 * for the session and remembers which URLs have finished loading, so components
 * can paint them instantly (and skip any fade-in) on remount.
 */

const readyUrls = new Set<string>()
// Strong refs so the browser keeps the decoded bitmaps in memory (an unreferenced
// `new Image()` can be garbage-collected before it's ever reused).
const retained = new Map<string, HTMLImageElement>()

/** True once this URL has fully loaded at least once this session. */
export function isImageReady(url?: string | null): boolean {
  return !!url && readyUrls.has(url)
}

/** Record that a URL is loaded (call from an <img> onLoad). */
export function markImageReady(url?: string | null): void {
  if (url) readyUrls.add(url)
}

/**
 * Preload images in the background and keep them warm. Safe to call repeatedly —
 * already-warm URLs are skipped.
 */
export function warmImages(urls: (string | null | undefined)[]): void {
  if (typeof window === 'undefined') return
  for (const url of urls) {
    if (!url || retained.has(url)) continue
    const img = new Image()
    img.decoding = 'async'
    img.onload = () => markImageReady(url)
    img.src = url
    retained.set(url, img)
    // Force it into the decoded cache so the first real paint is instant too.
    img.decode?.()?.then(() => markImageReady(url)).catch(() => {})
  }
}
