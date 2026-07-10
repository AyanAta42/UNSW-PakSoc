/** Breaks an ISO date string into month, day, and formatted time strings. */
export function dateParts(iso: string) {
  const d = new Date(iso)
  return {
    month: d.toLocaleDateString('en-AU', { month: 'short' }).toUpperCase(),
    day:   d.getDate(),
    time:  d.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' }),
  }
}
