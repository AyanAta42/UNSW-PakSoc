/**
 * PWA feel: kill the elastic rubber-band at the TOP of any page scroller while
 * leaving the BOTTOM bounce intact. Pure CSS can only disable overscroll on a
 * whole axis (both edges), so we cancel the top edge by hand:
 *
 *  - On touchstart we resolve the scroller the gesture belongs to (the nearest
 *    vertically-scrollable ancestor, else the document).
 *  - On touchmove, if that scroller is already at the very top and the finger is
 *    dragging further down with a vertical-dominant motion, we preventDefault —
 *    so the top never rubber-bands. Scrolling, the bottom bounce, and horizontal
 *    carousels are all left alone.
 *
 * Overlays (modals, bottom sheets, toasts) are `position: fixed` and run their
 * own touch gestures (e.g. swipe-to-dismiss). We detect a fixed ancestor and
 * bail so we never interfere with them.
 *
 * Install once, globally, at boot.
 */
export function installTopOverscrollLock(): void {
  let scroller: Element | null = null
  let startY = 0
  let startX = 0

  function resolveScroller(node: EventTarget | null): Element | null {
    let el = node as Element | null
    while (el && el !== document.body && el !== document.documentElement) {
      const cs = getComputedStyle(el)
      if (cs.position === 'fixed') return null // inside an overlay — leave its gestures untouched
      const oy = cs.overflowY
      if ((oy === 'auto' || oy === 'scroll') && el.scrollHeight > el.clientHeight) return el
      el = el.parentElement
    }
    return document.scrollingElement || document.documentElement
  }

  window.addEventListener(
    'touchstart',
    e => {
      if (e.touches.length !== 1) { scroller = null; return }
      startY = e.touches[0].clientY
      startX = e.touches[0].clientX
      scroller = resolveScroller(e.target)
    },
    { passive: true },
  )

  window.addEventListener(
    'touchmove',
    e => {
      if (!scroller || e.touches.length !== 1) return
      const dy = e.touches[0].clientY - startY
      const dx = e.touches[0].clientX - startX
      // At the very top, pulling down, and clearly a vertical drag → block the top bounce.
      if (scroller.scrollTop <= 0 && dy > 0 && dy > Math.abs(dx) && e.cancelable) {
        e.preventDefault()
      }
    },
    { passive: false },
  )
}
