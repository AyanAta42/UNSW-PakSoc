import type { User } from '@supabase/supabase-js'

export function getAvatarUrl(user: User | null | undefined): string | undefined {
  if (!user) return undefined
  const meta = user.user_metadata ?? {}
  const url = meta.avatar_url ?? meta.picture ?? meta.photo_url
  return typeof url === 'string' && url.length > 0 ? url : undefined
}
