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
 * Auth/supabase-js loads only after public events have been displayed
 * (or after a long fallback / login interaction).
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    let unsubscribe: (() => void) | undefined
    let booted = false
    let fallbackId: ReturnType<typeof setTimeout> | undefined

    const boot = async () => {
      if (booted || !alive) return
      booted = true
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

    const onEventsReady = () => { void boot() }
    window.addEventListener('paksoc:events-ready', onEventsReady)

    // Fallback if the home page never fires (other routes)
    fallbackId = setTimeout(() => { void boot() }, 4000)

    const onInteract = (e: Event) => {
      const t = e.target as HTMLElement | null
      if (t?.closest?.('[data-cta], a[href="/login"], button')) void boot()
    }
    document.addEventListener('pointerdown', onInteract, { passive: true })

    return () => {
      alive = false
      window.removeEventListener('paksoc:events-ready', onEventsReady)
      document.removeEventListener('pointerdown', onInteract)
      if (fallbackId !== undefined) clearTimeout(fallbackId)
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
