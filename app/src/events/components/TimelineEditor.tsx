import type { TimelineItem } from '@/events/types/Event'
import { addHoursHM } from '@/events/components/TimePickerInput'
import { ACCENT, PALETTE } from '@/config/theme'

interface Props {
  items:    TimelineItem[]
  onChange: (items: TimelineItem[]) => void
}

// `colorScheme: 'dark'` only belongs on the native time picker below — applied
// to a plain text field it makes mobile browsers draw the wrong (mismatched)
// native caret/selection chrome, so the two inputs get separate style objects.
const timeInp = { border: `1px solid ${PALETTE.border}`, color: PALETTE.dark, background: PALETTE.input, borderRadius: PALETTE.radiusInput, colorScheme: 'dark' } as const
const textInp = { border: `1px solid ${PALETTE.border}`, color: PALETTE.dark, background: PALETTE.input, borderRadius: PALETTE.radiusInput } as const

/** Next item defaults to 1h after the last one (or noon for the first item). */
function nextDefaultTime(items: TimelineItem[]): string {
  if (items.length === 0) return '12:00'
  return addHoursHM(items[items.length - 1].time || '12:00', 1)
}

export function TimelineEditor({ items, onChange }: Props) {
  const update = (i: number, patch: Partial<TimelineItem>) =>
    onChange(items.map((row, idx) => idx === i ? { ...row, ...patch } : row))
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i))

  return (
    <div className="flex flex-col gap-2">
      {items.length === 0 && (
        <p style={{ color: PALETTE.muted }} className="text-xs m-0">Optional schedule shown on the home page sidebar.</p>
      )}
      {items.map((item, i) => (
        <div key={i} className="flex gap-2 items-center">
          <input type="time" value={item.time} onChange={e => update(i, { time: e.target.value })}
            style={timeInp} className="w-[110px] shrink-0 px-2.5 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500/30" />
          <input value={item.title} onChange={e => update(i, { title: e.target.value })} placeholder="e.g. Arrival, Games"
            style={textInp} className="flex-1 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500/30" />
          <button type="button" onClick={() => remove(i)} style={{ color: PALETTE.muted }}
            className="bg-transparent border-none cursor-pointer text-lg leading-none hover:text-red-400 px-1 transition-colors">×</button>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...items, { time: nextDefaultTime(items), title: '' }])}
        style={{ color: ACCENT, borderColor: 'rgba(34,197,94,0.35)', background: 'rgba(34,197,94,0.06)', borderRadius: PALETTE.radiusInput }}
        className="flex items-center justify-center gap-1.5 w-full py-2.5 text-sm font-semibold border border-dashed cursor-pointer hover:bg-[rgba(34,197,94,0.12)] transition-colors">
        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M12 5v14M5 12h14" /></svg>
        Add timeline item
      </button>
    </div>
  )
}
