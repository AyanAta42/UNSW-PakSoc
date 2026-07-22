/**
 * Tracks which one-shot entrance animations have already played this session.
 *
 * React Router unmounts a page's whole tree on navigation and remounts it from
 * scratch on browser back/forward — which would otherwise replay every
 * mount-time entrance animation (the hero slide-in, the ambient fade-in). That
 * replay is exactly the "everything goes black and rebuilds" you see when
 * swiping back to a page. Gate those animations on `useEnterOnce(key)` so they
 * run the first time only; on return the page is simply *there*.
 */
import { useEffect, useState } from 'react'

const played = new Set<string>()

/**
 * True only on the first mount of `key` this session — use it to decide whether
 * to apply a mount-time entrance animation. Later remounts (back/forward) return
 * false, so the element renders at its final state with no replay.
 */
export function useEnterOnce(key: string): boolean {
  const [first] = useState(() => !played.has(key))
  useEffect(() => { played.add(key) }, [key])
  return first
}
