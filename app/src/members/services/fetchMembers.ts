import { supabase } from '@/core/supabase/client'
import type { Member, MemberRole } from '@/members/types/Member'

export async function fetchMembers(): Promise<Member[]> {
  const { data, error } = await supabase
    .from('members')
    .select('id, user_id, name, email, role, committee, avatar_url')
    .order('role')
  if (error) throw error
  return (data ?? []).map(r => ({
    id:         r.id,
    user_id:    r.user_id  ?? undefined,
    name:       r.name     ?? r.email,
    email:      r.email,
    role:       r.role     as MemberRole,
    committee:  r.committee ?? undefined,
    avatar_url: r.avatar_url ?? undefined,
  }))
}
