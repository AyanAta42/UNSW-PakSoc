import { useEffect, useRef, useState } from 'react'
import type { CSSProperties, TouchEvent as ReactTouchEvent } from 'react'

const CLOSE_THRESHOLD = 60
const CLOSE_DURATION_MS = 220

/**
 * Swipe-to-dismiss for a bottom sheet — the same feel as the home-screen event
 * sheet ({@link MobileEventSheet}). Drag begins only when the inner content is
 * scrolled to the top, so scrolling and dismissing never fight each other.
 *
 * Wiring:
 *  - `ref={sheetRef}` on the sheet element, `ref={scrollRef}` on its scroll body
 *  - `{...touchHandlers}` on the sheet, `style={{ ...sheetStyle }}` to drive it
 *  - `style={{ opacity: backdropOpacity }}` on the backdrop
 *  - call `close()` (not the raw onClose) from the ×, backdrop and action buttons
 *    so the slide-down animation plays instead of the sheet vanishing
 *
 * `open` only matters for sheets that stay mounted while hidden (gated by an
 * early `return null`): it resets the transient drag/close state each time they
 * reopen. Sheets that unmount when hidden can leave it at its default.
 */
export function useSheetSwipe(onClose: () => void, open = true) {
  const sheetRef      = useRef<HTMLDivElement>(null)
  const scrollRef     = useRef<HTMLDivElement>(null)
  const startYRef     = useRef<number | null>(null)
  const closeTimerRef = useRef<ReturnType<typeof setTimeout>>()
  const [dragY, setDragY]       = useState(0)
  const [dragging, setDragging] = useState(false)
  const [closing, setClosing]   = useState(false)

  useEffect(() => () => clearTimeout(closeTimerRef.current), [])

  // Fresh start each time the sheet opens, so an always-mounted sheet never
  // reappears frozen mid-close from a previous dismissal.
  useEffect(() => {
    if (!open) return
    clearTimeout(closeTimerRef.current)
    startYRef.current = null
    setDragY(0)
    setDragging(false)
    setClosing(false)
  }, [open])

  // React registers touch listeners as passive, so preventDefault inside the
  // synthetic onTouchMove is ignored and the drag also pans the page behind the
  // sheet. A native non-passive listener actually blocks that.
  useEffect(() => {
    const el = sheetRef.current
    if (!el) return
    const blockPan = (e: TouchEvent) => {
      if (startYRef.current === null) return
      if (e.touches[0].clientY - startYRef.current > 0) e.preventDefault()
    }
    el.addEventListener('touchmove', blockPan, { passive: false })
    return () => el.removeEventListener('touchmove', blockPan)
  }, [open])

  function close() {
    if (closing) return
    setClosing(true)
    closeTimerRef.current = setTimeout(onClose, CLOSE_DURATION_MS)
  }

  function onTouchStart(e: ReactTouchEvent) {
    if ((scrollRef.current?.scrollTop ?? 0) > 0 || closing) return
    startYRef.current = e.touches[0].clientY
    setDragging(true)
  }

  function onTouchMove(e: ReactTouchEvent) {
    if (startYRef.current === null || closing) return
    const delta = e.touches[0].clientY - startYRef.current
    if (delta <= 0) return
    setDragY(delta)
  }

  function onTouchEnd(e: ReactTouchEvent) {
    if (startYRef.current === null) return
    const delta = e.changedTouches[0].clientY - startYRef.current
    startYRef.current = null
    setDragging(false)
    if (delta > CLOSE_THRESHOLD) { close(); return }
    setDragY(0)
  }

  const sheetStyle: CSSProperties = {
    transform:  closing ? 'translateY(100%)' : dragY > 0 ? `translateY(${dragY}px)` : undefined,
    transition: dragging ? 'none' : `transform ${CLOSE_DURATION_MS}ms cubic-bezier(0.4, 0, 1, 1)`,
    willChange: 'transform',
  }

  return {
    sheetRef,
    scrollRef,
    closing,
    close,
    backdropOpacity: closing ? 0 : Math.max(0, 1 - dragY / 500),
    sheetStyle,
    touchHandlers: { onTouchStart, onTouchMove, onTouchEnd },
  }
}
