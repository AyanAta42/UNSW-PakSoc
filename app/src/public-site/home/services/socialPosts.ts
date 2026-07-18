import type { SupabaseClient } from '@supabase/supabase-js'

// Lazy-loaded so the anonymous homepage keeps supabase-js off its critical path
async function db() {
  const { supabase } = await import('@/core/supabase/client')
  return supabase
}

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

interface IgMedia {
  id: string
  caption?: string
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM'
  media_url?: string
  thumbnail_url?: string
  permalink: string
  timestamp?: string
  like_count?: number
}

export const IG_USERNAME = (import.meta.env.VITE_IG_USERNAME as string) || 'unswpaksoc'

export const WALL_SIZE = 10

/** Everyone reads from Supabase — Instagram is only hit via refreshSocialPosts(). */
export async function fetchSocialPosts(): Promise<SocialPost[]> {
  const supabase = await db()
  const { data, error } = await supabase
    .from('social_posts')
    .select('id,username,media_type,caption,thumbnail_url,permalink,like_count,posted_at')
    .order('posted_at', { ascending: false })
    .limit(WALL_SIZE)
  if (error) throw error
  return (data ?? []) as SocialPost[]
}

/**
 * Mirror one Instagram media item: its CDN URLs are signed and expire in days,
 * so the image is copied into Supabase Storage and that permanent URL stored.
 */
async function mirrorPost(supabase: SupabaseClient, media: IgMedia): Promise<SocialPost> {
  const cdnUrl = media.media_type === 'VIDEO'
    ? (media.thumbnail_url ?? media.media_url)
    : (media.media_url ?? media.thumbnail_url)
  if (!cdnUrl) throw new Error('Media has no downloadable thumbnail')
  const imgRes = await fetch(cdnUrl)
  if (!imgRes.ok) throw new Error(`Thumbnail download failed (${imgRes.status})`)
  const blob = await imgRes.blob()

  const path = `${media.id}.jpg`
  const { error: uploadError } = await supabase.storage
    .from('social-thumbs')
    .upload(path, blob, { upsert: true, contentType: blob.type || 'image/jpeg' })
  if (uploadError) throw uploadError
  const { data: pub } = supabase.storage.from('social-thumbs').getPublicUrl(path)

  return {
    id: media.id,
    username: IG_USERNAME,
    media_type: media.media_type,
    caption: media.caption ?? '',
    thumbnail_url: `${pub.publicUrl}?v=${Date.now()}`,
    permalink: media.permalink,
    like_count: media.like_count ?? 0,
    posted_at: media.timestamp ?? null,
  }
}

/** Pulls the latest `count` reels/posts from Instagram and upserts them into Supabase. */
export async function refreshSocialPosts(count: number): Promise<SocialPost[]> {
  const token = import.meta.env.VITE_IG_ACCESS_TOKEN as string | undefined
  const igUserId = import.meta.env.VITE_IG_USER_ID as string | undefined
  if (!token || !igUserId) throw new Error('Missing VITE_IG_ACCESS_TOKEN / VITE_IG_USER_ID in app/.env')
  const supabase = await db()

  // Business Discovery: our own IG account (VITE_IG_USER_ID) reads the public
  // media of the target professional account (VITE_IG_USERNAME)
  const mediaFields = 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count'
  const fields = `business_discovery.username(${IG_USERNAME}){media.limit(${count}){${mediaFields}}}`
  const res = await fetch(
    `https://graph.facebook.com/v23.0/${igUserId}?fields=${encodeURIComponent(fields)}&access_token=${token}`,
  )
  const json = await res.json()
  if (!res.ok) throw new Error(json?.error?.message ?? `Instagram fetch failed (${res.status})`)

  const medias: IgMedia[] = json?.business_discovery?.media?.data ?? []
  if (medias.length === 0) throw new Error(`No posts found for @${IG_USERNAME}`)

  // Mirror in parallel; a single bad item (e.g. copyrighted media with no URL)
  // shouldn't sink the whole batch
  const settled = await Promise.allSettled(medias.map(m => mirrorPost(supabase, m)))
  const posts = settled
    .filter((r): r is PromiseFulfilledResult<SocialPost> => r.status === 'fulfilled')
    .map(r => r.value)
  if (posts.length === 0) {
    const first = settled[0] as PromiseRejectedResult
    throw first.reason instanceof Error ? first.reason : new Error('All thumbnail mirrors failed')
  }

  const fetched_at = new Date().toISOString()
  const { error } = await supabase
    .from('social_posts')
    .upsert(posts.map(p => ({ ...p, fetched_at })))
  if (error) throw error
  return posts
}
