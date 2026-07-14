/** Breaks an ISO date string into month, day, and formatted time range strings. */
export function dateParts(iso: string, endIso?: string) {
  const d    = new Date(iso)
  const time = d.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })
  const endTime = endIso
    ? new Date(endIso).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })
    : null
  return {
    month:    d.toLocaleDateString('en-AU', { month: 'short' }).toUpperCase(),
    day:      d.getDate(),
    time:     endTime ? `${time} – ${endTime}` : time,
  }
}
