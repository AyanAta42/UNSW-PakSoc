import { supabase } from '@/core/supabase/client'

/** Uploads an image file to the event-images bucket and returns its public URL. */
export async function uploadEventImage(file: File): Promise<string> {
  const ext  = file.name.split('.').pop()
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const { error } = await supabase.storage.from('event-images').upload(path, file, { upsert: true })
  if (error) throw error
  const { data } = supabase.storage.from('event-images').getPublicUrl(path)
  return data.publicUrl
}
