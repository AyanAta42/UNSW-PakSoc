type Period = 'am' | 'pm'

interface Time12 {
  hour:   number // 1–12
  minute: number
  period: Period
}

function to12(iso: string): Time12 {
  const d = new Date(iso)
  const h = d.getHours()
  return { hour: h % 12 || 12, minute: d.getMinutes(), period: h >= 12 ? 'pm' : 'am' }
}

function clock({ hour, minute }: Pick<Time12, 'hour' | 'minute'>) {
  return minute ? `${hour}:${String(minute).padStart(2, '0')}` : `${hour}`
}

/** "5–7pm" when same period, "5am – 7pm" when mixed, "5pm" when no end. */
export function formatTimeRange(startIso: string, endIso?: string): string {
  if (!endIso) {
    const s = to12(startIso)
    return `${clock(s)}${s.period}`
  }
  const s = to12(startIso)
  const e = to12(endIso)
  if (s.period === e.period) return `${clock(s)}–${clock(e)}${e.period}`
  return `${clock(s)}${s.period} – ${clock(e)}${e.period}`
}
