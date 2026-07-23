/** Date + native time fields — phones get the platform scroll-wheel picker. */
import { PALETTE } from '@/config/theme'

const pad = (n: number) => String(n).padStart(2, '0')

export function parseIsoDate(iso: string | undefined): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-CA')
}

/** Local wall-clock "HH:mm" (24h) from an ISO string. */
export function parseTimeHM(iso: string | undefined, fallback = '17:00'): string {
  if (!iso) return fallback
  const d = new Date(iso)
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function addHoursHM(hm: string, add: number): string {
  const [h, m] = hm.split(':').map(Number)
  return `${pad((h + add) % 24)}:${pad(m)}`
}

/** "HH:mm" → "5:30 PM" for display. */
export function formatHM(hm: string): string {
  const [h, m] = hm.split(':').map(Number)
  return `${h % 12 || 12}:${pad(m)} ${h >= 12 ? 'PM' : 'AM'}`
}

/**
 * Local wall-clock date+time → UTC instant. The events.time column is
 * timestamptz, so a naive string would be read as UTC and shift the
 * displayed time by the user's offset — always send an explicit instant.
 */
export function buildIso(date: string, hm: string): string {
  if (!date || !hm) return ''
  const [y, mo, d] = date.split('-').map(Number)
  const [h, m] = hm.split(':').map(Number)
  return new Date(y, mo - 1, d, h, m).toISOString()
}

/** End instant; an end earlier than the start rolls over to the next day. */
export function buildEndIso(date: string, startHM: string, endHM: string): string {
  if (!date || !endHM) return ''
  const [y, mo, d] = date.split('-').map(Number)
  const [h, m] = endHM.split(':').map(Number)
  const end = new Date(y, mo - 1, d, h, m)
  if (startHM && endHM < startHM) end.setDate(end.getDate() + 1)
  return end.toISOString()
}

interface TimeFieldProps {
  label:    string
  value:    string
  onChange: (v: string) => void
}

export function TimeField({ label, value, onChange }: TimeFieldProps) {
  return (
    <div className="min-w-0">
      <label style={{ color: PALETTE.muted }} className="block text-[11px] font-bold uppercase tracking-wider mb-1.5">{label}</label>
      <input
        type="time"
        value={value}
        onChange={e => e.target.value && onChange(e.target.value)}
        style={{ border: `1px solid ${PALETTE.border}`, color: PALETTE.dark, background: PALETTE.input, borderRadius: PALETTE.radiusInput, colorScheme: 'dark' }}
        className="block w-full px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-500/30 cursor-pointer"
      />
    </div>
  )
}
