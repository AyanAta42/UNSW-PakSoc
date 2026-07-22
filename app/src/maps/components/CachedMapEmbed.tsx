import { useEffect, useState } from 'react'

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

/**
 * Google Maps embed with a dark skeleton that covers the iframe until it fires `load`.
 *
 * Each mount renders a fresh iframe. We used to cache the iframe node and re-parent it
 * across route changes to avoid reloads, but re-attaching a detached cross-origin iframe
 * forces Chromium to reload its browsing context anyway — and in the installed desktop PWA
 * that reload repaints blank white while still firing `load` (fading the skeleton away and
 * exposing the blank). A fresh iframe is never re-parented, so it always paints.
 *
 * `cacheId` is kept in the props for call-site compatibility but is no longer used.
 */
export function CachedMapEmbed({ src, title = 'Event location map', className, style, linkHref }: Props) {
  const [loaded, setLoaded] = useState(false)
  const [overlayGone, setOverlayGone] = useState(false)

  // Re-cover the frame whenever the destination changes so a new location can't
  // flash the previous map (or a blank frame) while it reloads.
  useEffect(() => {
    setLoaded(false)
    setOverlayGone(false)
  }, [src])

  return (
    <div className={className} style={{ position: 'relative', ...style }}>
      {/* key={src} remounts the iframe on location change so its load event (and the
          skeleton cover) reset cleanly instead of reusing a half-navigated frame. */}
      <iframe
        key={src}
        src={src}
        title={title}
        width="100%"
        height="100%"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
        onLoad={() => setLoaded(true)}
        style={{
          border: 0,
          display: 'block',
          width: '100%',
          height: '100%',
          // When a tap layer owns the click, kill the iframe's own pointer events. On iOS a
          // touch over an iframe can otherwise slip past a transparent overlay and hit Google's
          // internal breakout links, which pop a blank window loading the embed URL at top level.
          pointerEvents: linkHref ? 'none' : undefined,
        }}
      />
      {!overlayGone && (
        <div className="motion-skeleton" aria-hidden
          onTransitionEnd={() => setOverlayGone(true)}
          style={{ position: 'absolute', inset: 0, opacity: loaded ? 0 : 1, transition: 'opacity 220ms ease', pointerEvents: 'none' }} />
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
