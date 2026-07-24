import { useEffect } from 'react'

/**
 * Lock the page behind an overlay so a scroll gesture inside a modal/sheet can
 * never bleed through to the document — matching the installed-PWA feel in the
 * mobile browser too.
 *
 * `overscroll-behavior: contain` on a scroll body only stops *chaining* when the
 * finger is on that body; a drag on a modal's header/footer/backdrop, or on a
 * short non-scrollable popup, still pans `<body>`. The reliable cross-browser
 * (incl. iOS Safari) cure is to pin the body while an overlay is open.
 *
 * Technique: freeze the body with `position: fixed` offset by the current scroll
 * (plain `overflow: hidden` doesn't hold on iOS), then restore the exact scroll
 * position on release. A module-level ref-count means several overlays stacked
 * at once (e.g. a sheet + its confirm dialog) share one lock and only the last
 * one to close unfreezes the page.
 *
 * Pass `active` to gate it for always-mounted overlays (locked only while shown);
 * overlays that unmount when closed can call it bare.
 */

let lockCount = 0
let savedScrollY = 0
let savedStyle: Partial<CSSStyleDeclaration> = {}

function applyLock() {
  const body = document.body
  savedScrollY = window.scrollY
  // Compensate for the scrollbar vanishing (desktop) so content doesn't jump.
  const scrollbarW = window.innerWidth - document.documentElement.clientWidth

  savedStyle = {
    position:     body.style.position,
    top:          body.style.top,
    left:         body.style.left,
    right:        body.style.right,
    width:        body.style.width,
    overflow:     body.style.overflow,
    paddingRight: body.style.paddingRight,
  }

  body.style.position = 'fixed'
  body.style.top      = `-${savedScrollY}px`
  body.style.left     = '0'
  body.style.right    = '0'
  body.style.width    = '100%'
  body.style.overflow = 'hidden'
  if (scrollbarW > 0) body.style.paddingRight = `${scrollbarW}px`
}

function releaseLock() {
  const body = document.body
  body.style.position     = savedStyle.position     ?? ''
  body.style.top          = savedStyle.top          ?? ''
  body.style.left         = savedStyle.left         ?? ''
  body.style.right        = savedStyle.right        ?? ''
  body.style.width        = savedStyle.width        ?? ''
  body.style.overflow     = savedStyle.overflow     ?? ''
  body.style.paddingRight = savedStyle.paddingRight ?? ''
  // Jump straight back — `position: fixed` had scrolled the document to 0.
  window.scrollTo(0, savedScrollY)
}

export function useScrollLock(active = true) {
  useEffect(() => {
    if (!active) return
    if (lockCount === 0) applyLock()
    lockCount++
    return () => {
      lockCount = Math.max(0, lockCount - 1)
      if (lockCount === 0) releaseLock()
    }
  }, [active])
}
