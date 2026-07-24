import { supabase } from '@/core/supabase/client'
import { compressImage } from '@/shared/utils/compressImage'

/**
 * Uploads an event poster and returns its public URL. The image is downscaled +
 * re-encoded first (a multi-MB phone photo becomes a couple hundred KB with no
 * visible loss on the card) and stored with a one-year cache lifetime, so repeat
 * and cross-user views serve from the CDN / browser cache instead of re-egressing
 * — the two biggest levers on free-tier storage egress.
 */
export async function uploadEventImage(file: File): Promise<string> {
  const blob = await compressImage(file, { maxDim: 1080, quality: 0.8 })
  const ext  = blob.type === 'image/jpeg' ? 'jpg' : (blob.type.split('/')[1] || 'jpg')
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const { error } = await supabase.storage
    .from('event-images')
    .upload(path, blob, { upsert: true, contentType: blob.type || 'image/jpeg', cacheControl: '31536000' })
  if (error) throw error
  const { data } = supabase.storage.from('event-images').getPublicUrl(path)
  return data.publicUrl
}
