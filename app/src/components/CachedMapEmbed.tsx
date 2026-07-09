import { useEffect, useRef } from 'react'

const iframeCache = new Map<string, HTMLIFrameElement>()

interface Props {
  src: string
  cacheId: string
  title?: string
  className?: string
  style?: React.CSSProperties
}

function ensureIframe(cacheId: string, title: string) {
  let iframe = iframeCache.get(cacheId)
  if (!iframe) {
    iframe = document.createElement('iframe')
    iframe.title = title
    iframe.width = '100%'
    iframe.height = '100%'
    iframe.style.border = '0'
    iframe.style.display = 'block'
    iframe.setAttribute('loading', 'eager')
    iframe.setAttribute('referrerPolicy', 'no-referrer-when-downgrade')
    iframe.setAttribute('allowfullscreen', '')
    iframeCache.set(cacheId, iframe)
  }

  iframe.title = title
  return iframe
}

function setIframeSrc(iframe: HTMLIFrameElement, src: string) {
  if (iframe.getAttribute('data-src') === src && iframe.src) return false
  iframe.src = src
  iframe.setAttribute('data-src', src)
  return true
}

/** Force Maps to reload — re-attaching a cached iframe can drop the place pin. */
function reloadIframeSrc(iframe: HTMLIFrameElement, src: string) {
  iframe.src = ''
  iframe.src = src
  iframe.setAttribute('data-src', src)
}

/** Reuses the same iframe DOM node across route changes so Google Maps doesn't reload. */
export function CachedMapEmbed({ src, cacheId, title = 'Event location map', className, style }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const iframe = ensureIframe(cacheId, title)
    const hadLoaded = iframe.getAttribute('data-src') === src && !!iframe.src

    if (iframe.parentElement && iframe.parentElement !== container) {
      iframe.parentElement.removeChild(iframe)
    }

    const reattached = iframe.parentElement !== container
    if (reattached) {
      container.appendChild(iframe)
    }

    const srcChanged = setIframeSrc(iframe, src)
    if (reattached && hadLoaded && !srcChanged) {
      reloadIframeSrc(iframe, src)
    }

    return () => {
      if (iframe.parentElement === container) {
        container.removeChild(iframe)
      }
    }
  }, [src, cacheId, title])

  return <div ref={containerRef} className={className} style={style} />
}

export function mapEmbedSrc(location?: string) {
  const query = encodeURIComponent((location || 'UNSW Sydney') + ', Kensington NSW Australia')
  return `https://www.google.com/maps?q=${query}&hl=en&z=16&output=embed`
}
