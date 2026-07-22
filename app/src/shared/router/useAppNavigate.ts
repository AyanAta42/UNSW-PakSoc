import { useCallback } from 'react'
import { useNavigate, type NavigateFunction, type NavigateOptions, type To } from 'react-router-dom'

/**
 * `useNavigate` that opts every client-side route change into the View
 * Transitions API by default, so navigations cross-fade instead of hard-cutting.
 *
 * Crucially, React Router replays the same transition on browser back/forward
 * (POP) when the original forward navigation enabled it — so opting in here is
 * what makes the *swipe-back* gesture cross-fade into the previous page rather
 * than blink while it re-renders. On browsers without the API it's a silent
 * no-op. Pass `{ viewTransition: false }` at a call site to opt out.
 *
 * Drop-in for `useNavigate` — the returned function has the same signature.
 */
export function useAppNavigate(): NavigateFunction {
  const navigate = useNavigate()
  return useCallback<NavigateFunction>((to: To | number, options?: NavigateOptions) => {
    if (typeof to === 'number') { navigate(to); return }
    navigate(to, { viewTransition: true, ...options })
  }, [navigate])
}
