function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })
}

/** Returns "Mon, 12 Jan 2026 · 3:00 PM" or "… · 3:00 PM – 5:00 PM" when end_time exists. */
export function formatDate(iso: string, endIso?: string): string {
  const base = new Date(iso).toLocaleDateString('en-AU', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  })
  const time = fmtTime(iso)
  const range = endIso ? `${time} – ${fmtTime(endIso)}` : time
  return `${base} · ${range}`
}
