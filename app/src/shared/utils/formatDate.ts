/** Returns "Mon, 12 Jan 2026 · 3:00 PM" format. */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-AU', {
    weekday: 'short',
    day:     'numeric',
    month:   'short',
    year:    'numeric',
    hour:    '2-digit',
    minute:  '2-digit',
  })
}
