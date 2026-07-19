/** Date + 12-hour start/end time selects (no scroll-wheel issues). */
import { PALETTE } from '@/config/theme'

const HOURS12 = Array.from({ length: 12 }, (_, i) => i + 1)
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5)

const inp = { border: `1px solid ${PALETTE.border}`, color: PALETTE.dark, background: PALETTE.input, borderRadius: PALETTE.radiusInput }
const sel = 'px-2.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-500/30 cursor-pointer'

export type Period = 'AM' | 'PM'

interface TimeSelectProps {
  label:     string
  hour:      number
  minute:    number
  period:    Period
  onHour:    (v: number) => void
  onMinute:  (v: number) => void
  onPeriod:  (v: Period) => void
}

export function TimeSelect12h({ label, hour, minute, period, onHour, onMinute, onPeriod }: TimeSelectProps) {
  return (
    <div>
      <label style={{ color: PALETTE.muted }} className="block text-[11px] font-bold uppercase tracking-wider mb-1.5">{label}</label>
      <div className="flex gap-1 items-center">
        <select value={hour} onChange={e => onHour(Number(e.target.value))} style={inp} className={sel}>
          {HOURS12.map(h => <option key={h} value={h}>{h}</option>)}
        </select>
        <span style={{ color: PALETTE.muted }} className="font-bold text-sm select-none">:</span>
        <select value={minute} onChange={e => onMinute(Number(e.target.value))} style={inp} className={sel}>
          {MINUTES.map(m => <option key={m} value={m}>{String(m).padStart(2, '0')}</option>)}
        </select>
        <select value={period} onChange={e => onPeriod(e.target.value as Period)} style={inp} className={sel}>
          <option value="AM">AM</option>
          <option value="PM">PM</option>
        </select>
      </div>
    </div>
  )
}

function to24(hour: number, period: Period): number {
  if (period === 'AM') return hour === 12 ? 0 : hour
  return hour === 12 ? 12 : hour + 12
}

function from24(h24: number, minute: number): { hour: number; minute: number; period: Period } {
  return { hour: h24 % 12 || 12, minute, period: h24 >= 12 ? 'PM' : 'AM' }
}

export function parseIsoDate(iso: string | undefined): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-CA')
}

export function parseTime12(iso: string | undefined, fallback = { hour: 5, minute: 0, period: 'PM' as Period }) {
  if (!iso) return fallback
  const d = new Date(iso)
  const raw = d.getMinutes()
  const minute = Math.round(raw / 5) * 5 % 60
  return from24(d.getHours(), minute)
}

export function addHours12(t: { hour: number; minute: number; period: Period }, add: number) {
  const h24 = (to24(t.hour, t.period) + add) % 24
  return from24(h24, t.minute)
}

export function buildIso(date: string, hour: number, minute: number, period: Period): string {
  if (!date) return ''
  const h24 = to24(hour, period)
  return `${date}T${String(h24).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`
}
