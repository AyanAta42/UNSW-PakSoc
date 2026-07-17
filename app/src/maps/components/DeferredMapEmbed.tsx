import { useEffect, useState } from 'react'
import { CachedMapEmbed } from './CachedMapEmbed'

interface Props {
  src: string
  cacheId: string
  title?: string
  className?: string
  style?: React.CSSProperties
  /** Delay before mounting the heavy Maps iframe so the parent modal paints first. */
  delayMs?: number
}

/**
 * Renders a lightweight placeholder first, then mounts CachedMapEmbed after a
 * short delay so sheet/modal open animations stay smooth.
 */
export function DeferredMapEmbed({ src, cacheId, title, className, style, delayMs = 450 }: Props) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let idleId: number | undefined
    let timeoutId: ReturnType<typeof setTimeout> | undefined
    const go = () => setReady(true)

    if (typeof window.requestIdleCallback === 'function') {
      idleId = window.requestIdleCallback(go, { timeout: delayMs + 100 })
    } else {
      timeoutId = setTimeout(go, delayMs)
    }

    // Always ensure we mount after delayMs even if idle never fires
    const fallback = setTimeout(go, delayMs + 80)

    return () => {
      if (idleId !== undefined && typeof window.cancelIdleCallback === 'function') {
        window.cancelIdleCallback(idleId)
      }
      if (timeoutId !== undefined) clearTimeout(timeoutId)
      clearTimeout(fallback)
    }
  }, [delayMs])

  if (!ready) {
    return (
      <div
        className={className}
        style={{
          ...style,
          background: 'linear-gradient(135deg, #0A0A0A 25%, #121812 50%, #0A0A0A 75%)',
          backgroundSize: '200% 100%',
        }}
        aria-hidden
      />
    )
  }

  return <CachedMapEmbed src={src} cacheId={cacheId} title={title} className={className} style={style} />
}
