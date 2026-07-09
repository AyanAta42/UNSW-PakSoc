import { supabase } from '../supabase'

export async function uploadEventImage(file: File): Promise<string> {
  const ext  = file.name.split('.').pop()
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const { error } = await supabase.storage.from('event-images').upload(path, file, { upsert: true })
  if (error) throw error
  const { data } = supabase.storage.from('event-images').getPublicUrl(path)
  return data.publicUrl
}

export interface TimelineItem {
  time: string
  title: string
}

export interface DbEvent {
  id: string
  name: string
  location: string
  time: string
  public: boolean
  image_url?: string
  price?: number
  timeline?: TimelineItem[]
}

function parseTimeline(raw: unknown): TimelineItem[] {
  if (!Array.isArray(raw)) return []
  return raw
    .filter((item): item is TimelineItem =>
      !!item && typeof item === 'object' && typeof (item as TimelineItem).time === 'string' && typeof (item as TimelineItem).title === 'string'
    )
    .map(item => ({ time: item.time.trim(), title: item.title.trim() }))
    .filter(item => item.time && item.title)
}

function mapEvent(row: Record<string, unknown>): DbEvent {
  const base = row as unknown as DbEvent
  return {
    ...base,
    timeline: parseTimeline(row.timeline),
  }
}

export type NewEvent = Omit<DbEvent, 'id' | 'public'>

export async function fetchPublicEvents(): Promise<DbEvent[]> {
  const { data, error } = await supabase.from('events').select('*').eq('public', true).order('time')
  if (error) throw error
  return (data ?? []).map(mapEvent)
}

export async function fetchAllEvents(): Promise<DbEvent[]> {
  const { data, error } = await supabase.from('events').select('*').order('time')
  if (error) throw error
  return (data ?? []).map(mapEvent)
}

export async function createEvent(ev: NewEvent): Promise<DbEvent> {
  const { data, error } = await supabase
    .from('events')
    .insert({ ...ev, timeline: ev.timeline ?? [], tag: '', emoji: '', public: false })
    .select()
    .single()
  if (error) throw error
  return mapEvent(data)
}

export async function updateEvent(id: string, fields: Partial<Omit<DbEvent, 'id'>>): Promise<void> {
  const { error } = await supabase.from('events').update(fields).eq('id', id)
  if (error) throw error
}

export async function deleteEvent(id: string): Promise<void> {
  const { error } = await supabase.from('events').delete().eq('id', id)
  if (error) throw error
}

export async function setEventPublic(id: string, value: boolean): Promise<void> {
  const { error } = await supabase.from('events').update({ public: value }).eq('id', id)
  if (error) throw error
}
