import { supabase } from '@/core/supabase/client'

/** Upserts a member row when a user signs in and none exists yet — either their
 *  very first sign-in, or a returning user whose row was removed by an admin.
 *  Never overwrites an existing role (ignoreDuplicates skips if a row is already there). */
export async function ensureMember(userId: string, email: string, name: string, avatarUrl?: string): Promise<void> {
  await supabase.from('members').upsert(
    { user_id: userId, email, name, avatar_url: avatarUrl ?? null, role: 'public' },
    { onConflict: 'user_id', ignoreDuplicates: true },
  )
}
