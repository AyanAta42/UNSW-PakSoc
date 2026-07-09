import { supabase } from '../supabase'
import type { Member, MemberRole, Committee } from '@/pages/subcom/data/types'

export async function fetchMembers(): Promise<Member[]> {
  const { data, error } = await supabase
    .from('members')
    .select('id, user_id, name, email, role, committee, avatar_url')
    .order('role')
  if (error) throw error
  return (data ?? []).map(r => ({
    id:         r.id,
    user_id:    r.user_id ?? undefined,
    name:       r.name ?? r.email,
    email:      r.email,
    role:       r.role as MemberRole,
    committee:  r.committee ?? undefined,
    avatar_url: r.avatar_url ?? undefined,
  }))
}

export async function updateMemberRole(id: string, role: MemberRole): Promise<void> {
  const { error } = await supabase.from('members').update({ role }).eq('id', id)
  if (error) throw error
}

export async function updateMemberCommittee(id: string, committee: Committee | null): Promise<void> {
  const { error } = await supabase.from('members').update({ committee }).eq('id', id)
  if (error) throw error
}

export async function fetchMemberName(userId: string): Promise<string | null> {
  const { data } = await supabase.from('members').select('name').eq('user_id', userId).single()
  return data?.name ?? null
}

export async function fetchMemberAvatar(userId: string): Promise<string | null> {
  const { data } = await supabase.from('members').select('avatar_url').eq('user_id', userId).single()
  return data?.avatar_url ?? null
}

export async function updateMemberName(userId: string, name: string): Promise<void> {
  const { error } = await supabase.from('members').update({ name }).eq('user_id', userId)
  if (error) throw error
}

export async function ensureMember(userId: string, email: string, name: string, avatarUrl?: string): Promise<void> {
  await supabase.from('members').upsert(
    { user_id: userId, email, name, avatar_url: avatarUrl ?? null, role: 'public' },
    { onConflict: 'user_id', ignoreDuplicates: true }
  )
}
