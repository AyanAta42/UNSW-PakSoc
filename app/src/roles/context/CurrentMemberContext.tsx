import { createContext, useContext, useState, useEffect } from 'react'
import { useAuth }    from '@/auth/hooks/useAuth'
import { supabase }   from '@/core/supabase/client'
import type { MemberRole } from '@/members/types/Member'

export interface CurrentMember { id: string; role: MemberRole }

interface Ctx { member: CurrentMember | null; loading: boolean }

const CurrentMemberCtx = createContext<Ctx>({ member: null, loading: true })

export function CurrentMemberProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth()
  const [member,  setMember]  = useState<CurrentMember | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return
    if (!user) { setMember(null); setLoading(false); return }

    setLoading(true)
    ;(async () => {
      try {
        const { data } = await supabase.from('members').select('id, role').eq('user_id', user.id).single()
        setMember(data ? { id: data.id, role: data.role as MemberRole } : null)
      } catch {
        setMember(null)
      } finally {
        setLoading(false)
      }
    })()
  }, [user?.id, authLoading])

  return (
    <CurrentMemberCtx.Provider value={{ member, loading }}>
      {children}
    </CurrentMemberCtx.Provider>
  )
}

export function useCurrentMember() { return useContext(CurrentMemberCtx) }
