import { useEffect, useRef, useState } from 'react'

const iframeCache = new Map<string, HTMLIFrameElement>()

interface Props {
  src:       string
  cacheId:   string
  title?:    string
  className?: string
  style?:    React.CSSProperties
  /** When set, the whole map becomes a tap target that opens this URL (only after the map loads). */
  linkHref?: string
}

/** True inside an installed PWA (standalone display), where target="_blank" leaves a stray blank window. */
function isStandalonePWA() {
  if (typeof window === 'undefined') return false
  return window.matchMedia?.('(display-mode: standalone)').matches
    || (window.navigator as unknown as { standalone?: boolean }).standalone === true
}

function ensureIframe(cacheId: string, title: string) {
  let iframe = iframeCache.get(cacheId)
  if (!iframe) {
    iframe = document.createElement('iframe')
    iframe.width = '100%'; iframe.height = '100%'
    iframe.style.border = '0'; iframe.style.display = 'block'
    iframe.setAttribute('loading', 'lazy')
    iframe.setAttribute('referrerPolicy', 'no-referrer-when-downgrade')
    iframe.setAttribute('allowfullscreen', '')
    iframeCache.set(cacheId, iframe)
  }
  iframe.title = title
  return iframe
}

function setIframeSrc(iframe: HTMLIFrameElement, src: string) {
  if (iframe.getAttribute('data-src') === src && iframe.src) return false
  iframe.src = src; iframe.setAttribute('data-src', src); return true
}

/** Force Maps to reload — re-attaching a cached iframe can drop the place pin. */
function reloadIframeSrc(iframe: HTMLIFrameElement, src: string) {
  iframe.src = ''; iframe.src = src; iframe.setAttribute('data-src', src)
}

/** Reuses the same iframe DOM node across route changes so Google Maps doesn't reload. */
export function CachedMapEmbed({ src, cacheId, title = 'Event location map', className, style, linkHref }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [loaded, setLoaded] = useState(false)
  const [overlayGone, setOverlayGone] = useState(false)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const iframe   = ensureIframe(cacheId, title)
    // When a tap layer owns the click, kill the iframe's own pointer events. On iOS a touch
    // over an iframe can otherwise slip past a transparent overlay and hit Google's internal
    // breakout links, which pop a blank window loading the embed URL at top level.
    iframe.style.pointerEvents = linkHref ? 'none' : ''
    const hadLoaded = iframe.getAttribute('data-src') === src && !!iframe.src
    if (iframe.parentElement && iframe.parentElement !== container) iframe.parentElement.removeChild(iframe)
    const reattached = iframe.parentElement !== container
    if (reattached) container.appendChild(iframe)
    const srcChanged = setIframeSrc(iframe, src)
    if (reattached && hadLoaded && !srcChanged) reloadIframeSrc(iframe, src)

    if (srcChanged || (reattached && hadLoaded)) iframe.removeAttribute('data-loaded')
    const alreadyLoaded = iframe.getAttribute('data-loaded') === src
    setLoaded(alreadyLoaded)
    setOverlayGone(alreadyLoaded)
    const onLoad = () => { iframe.setAttribute('data-loaded', src); setLoaded(true) }
    iframe.addEventListener('load', onLoad)
    return () => {
      iframe.removeEventListener('load', onLoad)
      if (iframe.parentElement === container) container.removeChild(iframe)
    }
  }, [src, cacheId, title, linkHref])

  return (
    <div className={className} style={{ position: 'relative', ...style }}>
      <div ref={containerRef} className="w-full h-full" />
      {!overlayGone && (
        <div className="motion-skeleton" aria-hidden
          onTransitionEnd={() => setOverlayGone(true)}
          style={{ position: 'absolute', inset: 0, opacity: loaded ? 0 : 1, transition: 'opacity 450ms ease', pointerEvents: 'none' }} />
      )}
      {linkHref && (
        // Full-cover tap layer: swallows clicks until the map has loaded (so an early tap
        // can't hit a half-loaded Google frame), then opens Maps. In an installed PWA it
        // navigates the same window so the OS hands off to the Maps app without leaving a
        // stray blank window behind.
        <a
          href={loaded ? linkHref : undefined}
          target={loaded && !isStandalonePWA() ? '_blank' : undefined}
          rel="noopener noreferrer"
          aria-label="Open in Google Maps"
          aria-disabled={!loaded}
          onClick={e => { if (!loaded) e.preventDefault() }}
          style={{ position: 'absolute', inset: 0, cursor: loaded ? 'pointer' : 'default' }}
        />
      )}
    </div>
  )
}

/** Builds a Google Maps embed URL for a given location string. */
export function mapEmbedSrc(location?: string) {
  const query = encodeURIComponent((location || 'UNSW Sydney') + ', Kensington NSW Australia')
  return `https://www.google.com/maps?q=${query}&hl=en&z=16&output=embed`
}

/** Universal Maps link that deep-links to the native Maps app on mobile when tapped. */
export function mapLinkUrl(location?: string) {
  const query = encodeURIComponent((location || 'UNSW Sydney') + ', Kensington NSW Australia')
  return `https://www.google.com/maps/search/?api=1&query=${query}`
}
