import type { EventButton } from '@/events/types/Event'
import { ACCENT, PALETTE } from '@/config/theme'

interface Props {
  buttons:   EventButton[]
  onChange:  (btns: EventButton[]) => void
}

const inp = { border: `1px solid ${PALETTE.border}`, color: PALETTE.dark, background: PALETTE.input, borderRadius: PALETTE.radiusInput }
const lbl = 'block text-[11px] font-bold uppercase tracking-wider mb-1 text-[#94A3B8]'

export function CtaButtonsEditor({ buttons, onChange }: Props) {
  const update = (i: number, patch: Partial<EventButton>) =>
    onChange(buttons.map((b, idx) => idx === i ? { ...b, ...patch } : b))

  return (
    <div className="flex flex-col gap-3">
      {buttons.map((btn, i) => (
        <div key={i} style={{ background: PALETTE.cardAlt, border: `1px solid ${PALETTE.border}`, borderRadius: PALETTE.radiusInput }}
          className="p-3 flex flex-col gap-2 relative">
          <button type="button" onClick={() => onChange(buttons.filter((_, idx) => idx !== i))}
            style={{ color: PALETTE.muted }} className="absolute top-2.5 right-2.5 bg-transparent border-none cursor-pointer text-base leading-none hover:text-red-400 transition-colors">×</button>
          <div>
            <label className={lbl}>Button {i + 1} label</label>
            <input value={btn.label} onChange={e => update(i, { label: e.target.value })}
              placeholder="e.g. Register Your Team"
              style={inp} className="w-full px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500/30 pr-6" />
          </div>
          <div>
            <label className={lbl}>Link URL</label>
            <input value={btn.url} onChange={e => update(i, { url: e.target.value })}
              placeholder="https://…"
              style={inp} className="w-full px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500/30" />
          </div>
        </div>
      ))}
      {buttons.length < 2 && (
        <button type="button"
          onClick={() => onChange([...buttons, { label: '', url: '' }])}
          style={{ color: ACCENT }} className="text-xs font-semibold bg-transparent border-none cursor-pointer hover:opacity-80 self-start">
          + Add button
        </button>
      )}
      <p style={{ color: PALETTE.disabled }} className="text-[10px] m-0">0–2 buttons displayed on public event cards.</p>
    </div>
  )
}
