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
 * Shared auth state. Supabase client (~200 KB) is deferred until after the
 * public events request has had a head start, so cold loads aren't starved.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    let unsubscribe: (() => void) | undefined
    let idleId: number | undefined
    let timeoutId: ReturnType<typeof setTimeout> | undefined

    const boot = async () => {
      const { supabase } = await import('@/core/supabase/client')
      if (!alive) return

      const { data: { session: initial } } = await supabase.auth.getSession()
      if (!alive) return
      setSession(initial)
      setUser(initial?.user ?? null)
      setLoading(false)

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, next) => {
        setSession(next)
        setUser(next?.user ?? null)
        setLoading(false)
      })
      unsubscribe = () => subscription.unsubscribe()
    }

    const schedule = () => {
      // Give the events fetch ~1.2s of uncontended bandwidth on cold loads
      if (typeof window.requestIdleCallback === 'function') {
        idleId = window.requestIdleCallback(() => { void boot() }, { timeout: 1800 })
      } else {
        timeoutId = setTimeout(() => { void boot() }, 1200)
      }
    }

    // Start sooner if the user tries to log in / open account UI
    const onInteract = (e: Event) => {
      const t = e.target as HTMLElement | null
      if (t?.closest?.('[data-cta], a[href="/login"], button')) {
        void boot()
      }
    }
    document.addEventListener('pointerdown', onInteract, { passive: true })
    schedule()

    return () => {
      alive = false
      document.removeEventListener('pointerdown', onInteract)
      if (idleId !== undefined && typeof window.cancelIdleCallback === 'function') {
        window.cancelIdleCallback(idleId)
      }
      if (timeoutId !== undefined) clearTimeout(timeoutId)
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
