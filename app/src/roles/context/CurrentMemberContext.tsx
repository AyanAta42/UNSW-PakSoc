import { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from '@/auth/hooks/useAuth'
import type { MemberRole } from '@/members/types/Member'

export interface CurrentMember { id: string; role: MemberRole; avatarUrl: string | null }

interface Ctx { member: CurrentMember | null; loading: boolean }

const CurrentMemberCtx = createContext<Ctx>({ member: null, loading: true })

/** Cache the member row (role + avatar) like the session is cached, so the
 *  Manage buttons and the pfp paint on the first frame instead of waiting on
 *  the supabase-js chunk + a network round-trip. Reconciled in the background. */
const CACHE_KEY = 'paksoc-member-v1'

function readCache(userId: string): CurrentMember | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const c = JSON.parse(raw) as CurrentMember & { userId: string }
    return c.userId === userId ? { id: c.id, role: c.role, avatarUrl: c.avatarUrl ?? null } : null
  } catch { return null }
}

function writeCache(userId: string, m: CurrentMember | null) {
  try {
    if (m) localStorage.setItem(CACHE_KEY, JSON.stringify({ userId, ...m }))
    else localStorage.removeItem(CACHE_KEY)
  } catch { /* private mode / quota */ }
}

export function CurrentMemberProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth()
  const [member, setMember] = useState<CurrentMember | null>(() => (user ? readCache(user.id) : null))
  const [loading, setLoading] = useState(() => !(user && readCache(user.id)))

  useEffect(() => {
    if (authLoading) return
    if (!user) { setMember(null); setLoading(false); writeCache('', null); return }

    // Seed from cache for this user (instant paint), then reconcile.
    const cached = readCache(user.id)
    setMember(cached)
    setLoading(!cached)

    let alive = true
    ;(async () => {
      try {
        const { supabase } = await import('@/core/supabase/client')
        const { data } = await supabase
          .from('members')
          .select('id, role, avatar_url')
          .eq('user_id', user.id)
          .maybeSingle()
        if (!alive) return
        const next = data
          ? { id: data.id, role: data.role as MemberRole, avatarUrl: data.avatar_url ?? null }
          : null
        setMember(next)
        writeCache(user.id, next)
      } catch {
        /* keep the optimistic cached member on a transient failure */
      } finally {
        if (alive) setLoading(false)
      }
    })()

    return () => { alive = false }
  }, [user?.id, authLoading])

  return (
    <CurrentMemberCtx.Provider value={{ member, loading }}>
      {children}
    </CurrentMemberCtx.Provider>
  )
}

export function useCurrentMember() { return useContext(CurrentMemberCtx) }
