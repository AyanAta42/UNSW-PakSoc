import { supabase } from '@/core/supabase/client'

/** Upserts a member row when a user first signs in. Never overwrites an existing role. */
export async function ensureMember(userId: string, email: string, name: string, avatarUrl?: string): Promise<void> {
  await supabase.from('members').upsert(
    { user_id: userId, email, name, avatar_url: avatarUrl ?? null, role: 'public' },
    { onConflict: 'user_id', ignoreDuplicates: true },
  )
}
