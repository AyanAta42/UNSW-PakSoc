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
 * Shared auth state. Supabase client is dynamically imported after mount so the
 * anonymous homepage can paint without downloading ~200 KB of supabase-js first.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    let unsubscribe: (() => void) | undefined

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

    // Yield to first paint, then load auth (still ASAP for logged-in chrome)
    const t = window.setTimeout(() => { void boot() }, 0)

    return () => {
      alive = false
      clearTimeout(t)
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
