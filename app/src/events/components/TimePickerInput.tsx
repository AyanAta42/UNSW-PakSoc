/** Renders separate date + hour/minute selects — no scroll-wheel jump issues. */

const HOURS   = Array.from({ length: 24 }, (_, i) => i)
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5)

const inp = { border: '1px solid #E5E7EB', color: '#111827', background: '#FAFAFA' }
const sel = 'px-2.5 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-green-200 cursor-pointer'

interface Props {
  label:    string
  date:     string       // "YYYY-MM-DD"
  hour:     number       // 0-23
  minute:   number       // 0,5,10...55
  onDate:   (v: string)  => void
  onHour:   (v: number)  => void
  onMinute: (v: number)  => void
}

export function TimePickerInput({ label, date, hour, minute, onDate, onHour, onMinute }: Props) {
  return (
    <div>
      <label style={{ color: '#6B7280' }} className="block text-[11px] font-bold uppercase tracking-wider mb-1.5">{label}</label>
      <div className="flex gap-2 flex-wrap">
        <input type="date" value={date} onChange={e => onDate(e.target.value)}
          style={inp} className={`flex-1 min-w-[140px] ${sel}`} />
        <div className="flex gap-1 items-center shrink-0">
          <select value={hour} onChange={e => onHour(Number(e.target.value))}
            style={inp} className={sel}>
            {HOURS.map(h => (
              <option key={h} value={h}>{String(h).padStart(2, '0')}</option>
            ))}
          </select>
          <span style={{ color: '#6B7280' }} className="font-bold text-sm select-none">:</span>
          <select value={minute} onChange={e => onMinute(Number(e.target.value))}
            style={inp} className={sel}>
            {MINUTES.map(m => (
              <option key={m} value={m}>{String(m).padStart(2, '0')}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}

/** Convert a date string + hour/minute into an ISO timestamp. */
export function buildIso(date: string, hour: number, minute: number): string {
  if (!date) return ''
  return `${date}T${String(hour).padStart(2,'0')}:${String(minute).padStart(2,'0')}:00`
}

/** Parse an ISO string back into date / hour / minute parts. */
export function parseIso(iso: string | undefined): { date: string; hour: number; minute: number } {
  if (!iso) return { date: '', hour: 9, minute: 0 }
  const d      = new Date(iso)
  const date   = d.toLocaleDateString('en-CA') // "YYYY-MM-DD"
  const hour   = d.getHours()
  const raw    = d.getMinutes()
  const minute = Math.round(raw / 5) * 5 % 60
  return { date, hour, minute }
}
