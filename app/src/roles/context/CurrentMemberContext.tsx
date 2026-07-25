import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import type { User } from '@supabase/supabase-js'
import { useAuth, getAvatarUrl } from '@/auth/hooks/useAuth'
import { useRealtimeTable } from '@/core/supabase/useRealtimeTable'
import { ensureMember } from '@/members/services/ensureMember'
import type { MemberRole } from '@/members/types/Member'

export interface CurrentMember { id: string; role: MemberRole; avatarUrl: string | null; isDeveloper: boolean }

interface Ctx { member: CurrentMember | null; loading: boolean }

const CurrentMemberCtx = createContext<Ctx>({ member: null, loading: true })

/** Cache the member row (role + avatar) like the session is cached, so the
 *  Manage buttons and the pfp paint on the first frame instead of waiting on
 *  the supabase-js chunk + a network round-trip. Reconciled in the background. */
// v2: added isDeveloper. Bumping the key retires the old shape so a stale cache
// can't leave the developer flag ambiguous on the first paint.
const CACHE_KEY = 'paksoc-member-v2'

function readCache(userId: string): CurrentMember | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const c = JSON.parse(raw) as CurrentMember & { userId: string }
    return c.userId === userId ? { id: c.id, role: c.role, avatarUrl: c.avatarUrl ?? null, isDeveloper: !!c.isDeveloper } : null
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

  // Guards against a stale response landing after the user has already
  // changed (e.g. logout/login racing the in-flight request).
  const requestedUserId = useRef<string | null>(null)

  const refetch = useCallback(async (authUser: User) => {
    const userId = authUser.id
    try {
      const { supabase } = await import('@/core/supabase/client')
      let { data } = await supabase
        .from('members')
        .select('id, role, avatar_url, is_developer')
        .eq('user_id', userId)
        .maybeSingle()

      // No row for this account — either it's their very first sign-in before the
      // signup trigger runs, or an admin removed them via Manage Roles. Either way,
      // that trigger only ever fires once (on auth.users INSERT), so a deleted row
      // is never recreated on its own. Recreate it here as a fresh 'public' member
      // so a returning user lands signed in instead of stuck with no profile.
      if (!data) {
        const meta = authUser.user_metadata ?? {}
        const name = meta.full_name ?? meta.name ?? authUser.email?.split('@')[0] ?? ''
        await ensureMember(userId, authUser.email ?? '', name, getAvatarUrl(authUser))
        if (requestedUserId.current !== userId) return
        ;({ data } = await supabase
          .from('members')
          .select('id, role, avatar_url, is_developer')
          .eq('user_id', userId)
          .maybeSingle())
      }

      if (requestedUserId.current !== userId) return
      const next = data
        ? { id: data.id, role: data.role as MemberRole, avatarUrl: data.avatar_url ?? null, isDeveloper: !!data.is_developer }
        : null
      setMember(next)
      writeCache(userId, next)
    } catch {
      /* keep the optimistic cached member on a transient failure */
    } finally {
      if (requestedUserId.current === userId) setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (authLoading) return
    requestedUserId.current = user?.id ?? null
    if (!user) { setMember(null); setLoading(false); writeCache('', null); return }

    // Seed from cache for this user (instant paint), then reconcile.
    const cached = readCache(user.id)
    setMember(cached)
    setLoading(!cached)

    void refetch(user)
  }, [user?.id, authLoading, refetch])

  // An admin changing anyone's role (e.g. via Manage Roles) writes to the
  // `members` table — re-pull this session's own row on every change so
  // role-gated buttons/routes/nav update live, without a refresh or re-login.
  useRealtimeTable('members', () => { if (user) void refetch(user) }, !!user && !authLoading)

  return (
    <CurrentMemberCtx.Provider value={{ member, loading }}>
      {children}
    </CurrentMemberCtx.Provider>
  )
}

export function useCurrentMember() { return useContext(CurrentMemberCtx) }
