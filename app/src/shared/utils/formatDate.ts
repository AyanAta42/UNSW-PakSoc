import { formatTimeRange } from '@/shared/utils/formatTimeRange'

/** "Mon, 12 Jan 2026 · 5–7pm" or "Mon, 12 Jan 2026 · 5am – 7pm" */
export function formatDate(iso: string, endIso?: string): string {
  const base = new Date(iso).toLocaleDateString('en-AU', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  })
  return `${base} · ${formatTimeRange(iso, endIso)}`
}
