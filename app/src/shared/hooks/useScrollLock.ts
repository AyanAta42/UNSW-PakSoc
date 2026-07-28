import { useEffect } from 'react'
import { isStandalone } from '@/shared/pwa/installPrompt'

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
 * Two techniques, picked per environment:
 *
 *  - Browser tab: freeze the body with `position: fixed` offset by the current
 *    scroll (plain `overflow: hidden` doesn't hold on iOS Safari, where the
 *    collapsing address bar keeps the document pannable), then restore the exact
 *    scroll position on release.
 *
 *  - Installed PWA: `overflow: hidden` on html+body only. Taking the body out of
 *    flow re-lays out the whole document on the same frame the sheet mounts, and
 *    in a standalone webview that reflow is what made a black layer flash in
 *    before the sheet finished sliding up (the html canvas — near-black #03040A —
 *    repainting while the compositor caught up). There's no collapsing chrome to
 *    fight in standalone and html/body already carry `overscroll-behavior: none`,
 *    so the cheap lock is enough and the sheet animates from the first frame.
 *
 * A module-level ref-count means several overlays stacked at once (e.g. a sheet
 * plus its confirm dialog) share one lock and only the last one to close
 * unfreezes the page.
 *
 * Pass `active` to gate it for always-mounted overlays (locked only while shown);
 * overlays that unmount when closed can call it bare.
 */

let lockCount = 0
let savedScrollY = 0
let cheapLock = false
let savedStyle: Partial<CSSStyleDeclaration> = {}
let savedRootOverflow = ''

function applyLock() {
  const body = document.body

  // Reflow-free lock for the installed app — see the note above.
  if (isStandalone()) {
    cheapLock = true
    savedRootOverflow = document.documentElement.style.overflow
    savedStyle = { overflow: body.style.overflow }
    document.documentElement.style.overflow = 'hidden'
    body.style.overflow = 'hidden'
    return
  }

  cheapLock = false
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

  if (cheapLock) {
    document.documentElement.style.overflow = savedRootOverflow
    body.style.overflow = savedStyle.overflow ?? ''
    return
  }

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
