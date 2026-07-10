import type { TimelineItem } from '@/events/types/Event'

/** Validates and normalises raw JSON timeline data from Supabase. */
export function parseTimeline(raw: unknown): TimelineItem[] {
  if (!Array.isArray(raw)) return []
  return raw
    .filter((item): item is TimelineItem =>
      !!item && typeof item === 'object' &&
      typeof (item as TimelineItem).time  === 'string' &&
      typeof (item as TimelineItem).title === 'string'
    )
    .map(item => ({ time: item.time.trim(), title: item.title.trim() }))
    .filter(item => item.time && item.title)
}
