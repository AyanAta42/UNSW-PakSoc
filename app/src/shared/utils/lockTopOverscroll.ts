/**
 * PWA feel: two touch-gesture locks installed once at boot.
 *
 *  1. Top rubber-band — kill the elastic bounce at the TOP of any page scroller
 *     while leaving the BOTTOM bounce intact. Pure CSS can only disable overscroll
 *     on a whole axis (both edges), so we cancel the top edge by hand: on touchstart
 *     we resolve the scroller the gesture belongs to (the nearest vertically-scrollable
 *     ancestor, else the document); on touchmove, if that scroller is already at the
 *     very top and the finger is dragging further down with a vertical-dominant motion,
 *     we preventDefault — so the top never rubber-bands.
 *
 *  2. Swipe-nav — block the browser back/forward gesture (swipe left/right to change
 *     history). CSS `overscroll-behavior-x: none` already stops Chrome's overscroll
 *     navigation, but iOS Safari's edge-swipe and some WebAPK engines ignore it, so we
 *     also cancel any horizontal-dominant swipe by hand. Genuine horizontal surfaces
 *     (a `.allow-pan-x` carousel, an overflow-x scroller) and overlays that run their
 *     own gestures are detected and left alone.
 *
 * Overlays (modals, bottom sheets, toasts) are `position: fixed` and run their
 * own touch gestures (e.g. swipe-to-dismiss). We detect a fixed ancestor and
 * bail so we never interfere with them.
 *
 * Install once, globally, at boot.
 */
export function installTouchGestureLocks(): void {
  let scroller: Element | null = null
  let allowHorizontal = false
  let startY = 0
  let startX = 0

  function resolveScroller(node: EventTarget | null): Element | null {
    let el = node as Element | null
    while (el && el !== document.body && el !== document.documentElement) {
      const cs = getComputedStyle(el)
      if (cs.position === 'fixed') return null // inside an overlay — leave its gestures untouched
      // Opt-out: a scroller can keep its native top rubber-band via
      // `data-native-overscroll` (e.g. the home app-shell, whose nav now scrolls
      // away in-flow, so there's nothing left for the top pull to drag).
      if (el instanceof HTMLElement && el.dataset.nativeOverscroll !== undefined) return null
      const oy = cs.overflowY
      if ((oy === 'auto' || oy === 'scroll') && el.scrollHeight > el.clientHeight) return el
      el = el.parentElement
    }
    return document.scrollingElement || document.documentElement
  }

  // Is the gesture inside something that legitimately moves horizontally — a real
  // overflow-x scroller, an element opted into horizontal panning (`touch-action:
  // pan-x`), or any fixed overlay running its own swipe? If so we must NOT treat the
  // swipe as browser navigation.
  function insideHorizontalSurface(node: EventTarget | null): boolean {
    let el = node as Element | null
    while (el && el !== document.body && el !== document.documentElement) {
      const cs = getComputedStyle(el)
      if (cs.position === 'fixed') return true // overlay owns its gestures
      const ox = cs.overflowX
      if ((ox === 'auto' || ox === 'scroll') && el.scrollWidth > el.clientWidth) return true
      if (cs.touchAction.includes('pan-x')) return true
      el = el.parentElement
    }
    return false
  }

  window.addEventListener(
    'touchstart',
    e => {
      if (e.touches.length !== 1) { scroller = null; return }
      startY = e.touches[0].clientY
      startX = e.touches[0].clientX
      scroller = resolveScroller(e.target)
      allowHorizontal = insideHorizontalSurface(e.target)
    },
    { passive: true },
  )

  window.addEventListener(
    'touchmove',
    e => {
      if (e.touches.length !== 1) return
      const dy = e.touches[0].clientY - startY
      const dx = e.touches[0].clientX - startX

      // Horizontal-dominant drag not owned by a scroller/overlay → this is the
      // browser's swipe-to-navigate gesture. Cancel it.
      if (!allowHorizontal && Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 4 && e.cancelable) {
        e.preventDefault()
        return
      }

      // At the very top, pulling down, and clearly a vertical drag → block the top bounce.
      if (scroller && scroller.scrollTop <= 0 && dy > 0 && dy > Math.abs(dx) && e.cancelable) {
        e.preventDefault()
      }
    },
    { passive: false },
  )
}
