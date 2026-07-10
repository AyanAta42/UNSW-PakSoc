/** Converts a 24-h "HH:MM" string to a locale-formatted time, e.g. "3:00 PM". */
export function formatTimelineTime(value: string): string {
  if (!value) return ''
  const [h, m] = value.split(':').map(Number)
  if (Number.isNaN(h) || Number.isNaN(m)) return value
  const d = new Date()
  d.setHours(h, m, 0, 0)
  return d.toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit' })
}
