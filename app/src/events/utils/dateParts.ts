import { formatTimeRange } from '@/shared/utils/formatTimeRange'

/** Breaks an ISO date string into month, day, and formatted time range. */
export function dateParts(iso: string, endIso?: string) {
  const d = new Date(iso)
  return {
    month: d.toLocaleDateString('en-AU', { month: 'short' }).toUpperCase(),
    day:   d.getDate(),
    time:  formatTimeRange(iso, endIso),
  }
}
