import { useState, useEffect } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

export function getAvatarUrl(user: User | null | undefined): string | undefined {
  if (!user) return undefined
  const meta = user.user_metadata ?? {}
  const url = meta.avatar_url ?? meta.picture ?? meta.photo_url
  return typeof url === 'string' && url.length > 0 ? url : undefined
}

export function useAuth() {
  const [user, setUser]       = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // onAuthStateChange handles initial session + OAuth redirect — avoid racing getSession()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  return { user, session, loading, avatarUrl: getAvatarUrl(user) }
}
