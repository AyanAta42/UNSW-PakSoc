import type { EventButton } from '@/events/types/Event'

interface Props {
  buttons:   EventButton[]
  onChange:  (btns: EventButton[]) => void
}

const inp = { border: '1px solid #E5E7EB', color: '#111827', background: '#FAFAFA' }
const lbl = 'block text-[11px] font-bold uppercase tracking-wider mb-1 text-[#6B7280]'

export function CtaButtonsEditor({ buttons, onChange }: Props) {
  const update = (i: number, patch: Partial<EventButton>) =>
    onChange(buttons.map((b, idx) => idx === i ? { ...b, ...patch } : b))

  return (
    <div className="flex flex-col gap-3">
      {buttons.map((btn, i) => (
        <div key={i} className="rounded-xl border border-[#E5E7EB] p-3 flex flex-col gap-2 bg-[#FAFAFA] relative">
          <button type="button" onClick={() => onChange(buttons.filter((_, idx) => idx !== i))}
            style={{ color: '#9CA3AF' }} className="absolute top-2.5 right-2.5 bg-transparent border-none cursor-pointer text-base leading-none hover:text-red-400 transition-colors">×</button>
          <div>
            <label className={lbl}>Button {i + 1} label</label>
            <input value={btn.label} onChange={e => update(i, { label: e.target.value })}
              placeholder="e.g. Register Your Team"
              style={inp} className="w-full px-3 py-2 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-200 pr-6" />
          </div>
          <div>
            <label className={lbl}>Link URL</label>
            <input value={btn.url} onChange={e => update(i, { url: e.target.value })}
              placeholder="https://…"
              style={inp} className="w-full px-3 py-2 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-200" />
          </div>
        </div>
      ))}
      {buttons.length < 2 && (
        <button type="button"
          onClick={() => onChange([...buttons, { label: '', url: '' }])}
          style={{ color: '#22C55E' }} className="text-xs font-semibold bg-transparent border-none cursor-pointer hover:opacity-80 self-start">
          + Add button
        </button>
      )}
      <p style={{ color: '#9CA3AF' }} className="text-[10px] m-0">0–2 buttons displayed on public event cards.</p>
    </div>
  )
}
