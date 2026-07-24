import { createContext, useContext, useCallback, useEffect, useMemo, useState } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { getAvatarUrl } from '@/auth/utils/getAvatarUrl'

export interface AuthCtx {
  user: User | null
  session: Session | null
  loading: boolean
  avatarUrl: string | undefined
  signOut: () => Promise<void>
} 


const AuthContext = createContext<AuthCtx | null>(null)

/** Supabase persists sessions as `sb-<ref>-auth-token` JSON. Reading it directly
 *  lets us show the logged-in UI instantly without parsing ~200KB of supabase-js;
 *  the real client reconciles (refresh/sign-out) once it boots. */
function readStoredSession(): Session | null {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k?.startsWith('sb-') && k.endsWith('-auth-token')) {
        const raw = localStorage.getItem(k)
        if (!raw) return null
        const parsed = JSON.parse(raw) as Session
        return parsed?.user ? parsed : null
      }
    }
  } catch { /* private mode / corrupt entry */ }
  return null
}

/**
 * Auth/supabase-js stays OFF the homepage critical path.
 * Public timer + popups must stay responsive — load auth only on
 * login interaction or after a long idle.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(readStoredSession)
  const [user, setUser] = useState<User | null>(() => session?.user ?? null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let alive = true
    let unsubscribe: (() => void) | undefined
    let booted = false
    let fallbackId: ReturnType<typeof setTimeout> | undefined
    let idleId: number | undefined

    const boot = async () => {
      if (booted || !alive) return
      booted = true
      setLoading(true)
      try {
        const { supabase } = await import('@/core/supabase/client')
        if (!alive) return

        const { data: { session: initial } } = await supabase.auth.getSession()
        if (!alive) return
        setSession(initial)
        setUser(initial?.user ?? null)

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, next) => {
          setSession(next)
          setUser(next?.user ?? null)
          setLoading(false)
        })
        unsubscribe = () => subscription.unsubscribe()
      } finally {
        if (alive) setLoading(false)
      }
    }

    // Do NOT boot on events-ready — that pulls ~200KB supabase and freezes the timer.
    // Only boot when the user hits login/CTA, or after a long idle.
    const onInteract = (e: Event) => {
      const t = e.target as HTMLElement | null
      if (t?.closest?.('[data-cta], a[href="/login"], a[href^="/login"]')) void boot()
    }
    document.addEventListener('pointerdown', onInteract, { passive: true })

    const scheduleIdle = () => {
      if (typeof window.requestIdleCallback === 'function') {
        idleId = window.requestIdleCallback(() => { void boot() }, { timeout: 12_000 })
      } else {
        fallbackId = setTimeout(() => { void boot() }, 12_000)
      }
    }
    // Auth pages load the supabase chunk anyway — boot now so the
    // onAuthStateChange subscription exists before the post-login redirect.
    // Anonymous visitors elsewhere never need supabase-js — skip the idle boot
    // and let the pointer-down handler load it on login intent.
    const path = window.location.pathname
    if (path === '/login' || path.startsWith('/auth/')) {
      void boot()
    } else if (readStoredSession()) {
      fallbackId = setTimeout(scheduleIdle, 5_000)
    }

    return () => {
      alive = false
      document.removeEventListener('pointerdown', onInteract)
      if (fallbackId !== undefined) clearTimeout(fallbackId)
      if (idleId !== undefined && typeof window.cancelIdleCallback === 'function') {
        window.cancelIdleCallback(idleId)
      }
      unsubscribe?.()
    }
  }, [])

  // Clear React state immediately so the logged-in UI (avatar, admin buttons)
  // disappears at once. Without this, `user` only clears when the
  // onAuthStateChange subscription fires — but that subscription lives in
  // boot(), which may not have run yet (it's gated on login intent / idle),
  // leaving the stored-session UI on screen until the delayed idle boot.
  const signOut = useCallback(async () => {
    setSession(null)
    setUser(null)
    const { supabase } = await import('@/core/supabase/client')
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }, [])

  const value = useMemo(
    () => ({ user, session, loading, avatarUrl: getAvatarUrl(user), signOut }),
    [user, session, loading, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuthContext(): AuthCtx {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuthContext must be used within AuthProvider')
  return ctx
}
