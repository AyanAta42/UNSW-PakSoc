import type { TimelineItem } from '@/events/types/Event'

interface Props {
  items:    TimelineItem[]
  onChange: (items: TimelineItem[]) => void
}

const inp = { border: '1px solid #E5E7EB', color: '#111827', background: '#FAFAFA' }

export function TimelineEditor({ items, onChange }: Props) {
  const update = (i: number, patch: Partial<TimelineItem>) =>
    onChange(items.map((row, idx) => idx === i ? { ...row, ...patch } : row))
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i))

  return (
    <div className="flex flex-col gap-2">
      {items.length === 0 && (
        <p style={{ color: '#9CA3AF' }} className="text-xs m-0">Optional schedule shown on the home page sidebar.</p>
      )}
      {items.map((item, i) => (
        <div key={i} className="flex gap-2 items-center">
          <input type="time" value={item.time} onChange={e => update(i, { time: e.target.value })}
            style={inp} className="w-[110px] shrink-0 px-2.5 py-2 rounded-xl text-sm outline-none focus:ring-2 focus:ring-green-200" />
          <input value={item.title} onChange={e => update(i, { title: e.target.value })} placeholder="e.g. Kahoot"
            style={inp} className="flex-1 px-3 py-2 rounded-xl text-sm outline-none focus:ring-2 focus:ring-green-200" />
          <button type="button" onClick={() => remove(i)} style={{ color: '#9CA3AF' }}
            className="bg-transparent border-none cursor-pointer text-lg leading-none hover:text-red-500 px-1">×</button>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...items, { time: '', title: '' }])}
        style={{ color: '#22C55E' }} className="text-xs font-semibold bg-transparent border-none cursor-pointer hover:opacity-80 self-start">
        + Add item
      </button>
    </div>
  )
}
