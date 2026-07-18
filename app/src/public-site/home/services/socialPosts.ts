import { supabase } from '@/core/supabase/client'

export interface SocialPost {
  id: string
  username: string
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM'
  caption: string
  thumbnail_url: string
  permalink: string
  like_count: number
  posted_at: string | null
}

export const IG_USERNAME = (import.meta.env.VITE_IG_USERNAME as string) || 'naxfa_24'

/** Everyone reads from Supabase — Instagram is only hit via refreshLatestSocialPost(). */
export async function fetchSocialPosts(): Promise<SocialPost[]> {
  const { data, error } = await supabase
    .from('social_posts')
    .select('id,username,media_type,caption,thumbnail_url,permalink,like_count,posted_at')
    .order('posted_at', { ascending: false })
    .limit(12)
  if (error) throw error
  return (data ?? []) as SocialPost[]
}

/** Pulls the latest reel/post from Instagram and upserts it into Supabase. */
export async function refreshLatestSocialPost(): Promise<SocialPost> {
  const token = import.meta.env.VITE_IG_ACCESS_TOKEN as string | undefined
  const igUserId = import.meta.env.VITE_IG_USER_ID as string | undefined
  if (!token || !igUserId) throw new Error('Missing VITE_IG_ACCESS_TOKEN / VITE_IG_USER_ID in app/.env')

  const fields = 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count'
  const res = await fetch(
    `https://graph.facebook.com/v23.0/${igUserId}/media?fields=${fields}&limit=1&access_token=${token}`,
  )
  const json = await res.json()
  if (!res.ok) throw new Error(json?.error?.message ?? `Instagram fetch failed (${res.status})`)

  const media = json?.data?.[0]
  if (!media) throw new Error('No posts found on the Instagram account')

  // Instagram CDN URLs are signed and expire in days — mirror the image into
  // Supabase Storage and store that permanent URL instead
  const cdnUrl = media.media_type === 'VIDEO' ? (media.thumbnail_url ?? media.media_url) : media.media_url
  const imgRes = await fetch(cdnUrl)
  if (!imgRes.ok) throw new Error(`Thumbnail download failed (${imgRes.status})`)
  const blob = await imgRes.blob()

  const path = `${media.id}.jpg`
  const { error: uploadError } = await supabase.storage
    .from('social-thumbs')
    .upload(path, blob, { upsert: true, contentType: blob.type || 'image/jpeg' })
  if (uploadError) throw uploadError
  const { data: pub } = supabase.storage.from('social-thumbs').getPublicUrl(path)

  const post: SocialPost = {
    id: media.id,
    username: IG_USERNAME,
    media_type: media.media_type,
    caption: media.caption ?? '',
    thumbnail_url: `${pub.publicUrl}?v=${Date.now()}`,
    permalink: media.permalink,
    like_count: media.like_count ?? 0,
    posted_at: media.timestamp ?? null,
  }

  const { error } = await supabase
    .from('social_posts')
    .upsert({ ...post, fetched_at: new Date().toISOString() })
  if (error) throw error
  return post
}
