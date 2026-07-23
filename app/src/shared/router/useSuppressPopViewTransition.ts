import { useEffect } from 'react'

/** A no-op stand-in for a ViewTransition — resolves once the DOM update runs. */
function passthrough(done: Promise<void>): ViewTransition {
  return {
    ready: done,
    finished: done,
    updateCallbackDone: done,
    types: new Set<string>(),
    skipTransition() {},
  }
}

/**
 * Every client navigation opts into the View Transitions API (see useAppNavigate),
 * and React Router *replays* that transition on browser back/forward (POP). On a
 * PUSH — e.g. tapping the Home button — that lone cross-fade is clean. But on a
 * swipe-back the browser also runs its OWN native back-gesture animation, and
 * React Router's replayed cross-fade stacks on top of it: the two fight and it
 * reads as a black blink / the home page "re-spawning" with the countdown
 * hitching — even though HomePage never unmounts and stays fully live.
 *
 * HomePage is kept mounted for the whole session (see App), so returning to it
 * needs no transition at all — the previous page is already fully formed. This
 * hook suppresses the View Transition *only while a popstate is being processed*,
 * so a back-swipe becomes an instant, tick-through reveal (matching the Home
 * button) while forward/PUSH navigations keep their cross-fade. No-op where the
 * API is unavailable.
 */
export function useSuppressPopViewTransition(): void {
  useEffect(() => {
    const original = document.startViewTransition
    if (typeof original !== 'function') return // API unsupported → nothing to guard

    let popping = false
    let clearId: number | undefined

    const onPopState = () => {
      popping = true
      // Safety net: if this POP never actually starts a transition (e.g. it
      // popped to a route that never opted in), don't leave the flag stuck and
      // swallow the *next* forward transition.
      if (clearId) clearTimeout(clearId)
      clearId = window.setTimeout(() => { popping = false }, 150)
    }

    document.startViewTransition = function patched(this: Document, ...args: unknown[]) {
      if (!popping) {
        return (original as (...a: unknown[]) => ViewTransition).apply(this, args)
      }
      popping = false
      if (clearId) { clearTimeout(clearId); clearId = undefined }
      // Skip the animation: run React Router's DOM-update callback straight away.
      // `finished` mirrors the callback so RR's cleanup still fires post-commit.
      const cb = args[0]
      try {
        const result = typeof cb === 'function' ? (cb as () => unknown)() : undefined
        return passthrough(Promise.resolve(result).then(() => undefined))
      } catch (err) {
        return passthrough(Promise.reject(err))
      }
    } as typeof document.startViewTransition

    // Capture phase so the flag is set regardless of listener registration order;
    // React Router starts the transition later (in an effect), so this always
    // runs first within the same popstate task.
    window.addEventListener('popstate', onPopState, true)
    return () => {
      window.removeEventListener('popstate', onPopState, true)
      document.startViewTransition = original
      if (clearId) clearTimeout(clearId)
    }
  }, [])
}
