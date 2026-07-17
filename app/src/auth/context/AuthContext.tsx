import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { getAvatarUrl } from '@/auth/utils/getAvatarUrl'

export interface AuthCtx {
  user: User | null
  session: Session | null
  loading: boolean
  avatarUrl: string | undefined
}

const AuthContext = createContext<AuthCtx | null>(null)

/**
 * Auth/supabase-js stays OFF the homepage critical path.
 * Public timer + popups must stay responsive — load auth only on
 * login interaction or after a long idle.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
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
    fallbackId = setTimeout(scheduleIdle, 5_000)

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

  const value = useMemo(
    () => ({ user, session, loading, avatarUrl: getAvatarUrl(user) }),
    [user, session, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuthContext(): AuthCtx {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuthContext must be used within AuthProvider')
  return ctx
}
