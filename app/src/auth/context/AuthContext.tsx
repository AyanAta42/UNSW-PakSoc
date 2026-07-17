import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/core/supabase/client'
import { getAvatarUrl } from '@/auth/utils/getAvatarUrl'

interface AuthCtx {
  user: User | null
  session: Session | null
  loading: boolean
  avatarUrl: string | undefined
}

const AuthContext = createContext<AuthCtx | null>(null)

/** Single shared auth subscription for the whole app (avoids N× getSession listeners). */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!alive) return
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => {
      alive = false
      subscription.unsubscribe()
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
