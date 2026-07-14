import type { Member } from '@/members/types/Member'
import { initials } from '@/members/utils/initials'

interface Props {
  m:          Member
  color:      string
  mobile?:    boolean
  selected?:  boolean
  dragging?:  boolean
  onDragStart:(e: React.PointerEvent<HTMLDivElement>) => void
  onDragMove: (e: React.PointerEvent<HTMLDivElement>) => void
  onDragEnd:  (e: React.PointerEvent<HTMLDivElement>) => void
  onSelect?:  () => void
}

export function MemberDragCard({ m, color, mobile, selected, dragging, onDragStart, onDragMove, onDragEnd, onSelect }: Props) {
  const base = {
    borderLeft: `3px solid ${color}`,
    background: selected ? `${color}22` : `${color}0D`,
    border: `1px solid ${selected ? color : `${color}22`}`,
    borderLeftWidth: '3px',
  }

  if (mobile) {
    return (
      <button type="button" onClick={onSelect}
        className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left cursor-pointer transition-all active:scale-[0.98] ${selected ? 'shadow-sm' : ''}`}
        style={base}>
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-extrabold shrink-0 text-white" style={{ background: color }}>{initials(m.name)}</div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-[#111827] truncate">{m.name}</div>
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: `${color}18`, color }}>{m.role.replace('_', ' ')}</span>
        </div>
        {selected && <span style={{ color }} className="text-xs font-bold shrink-0">✓</span>}
      </button>
    )
  }

  return (
    <div onClick={onSelect}
      onPointerDown={onDragStart} onPointerMove={onDragMove} onPointerUp={onDragEnd} onPointerCancel={onDragEnd}
      className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg select-none touch-none transition-all ${dragging ? 'cursor-grabbing opacity-60 scale-[0.98]' : 'cursor-grab hover:shadow-sm'} ${selected ? 'shadow-sm' : ''}`}
      style={base}>
      <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-extrabold shrink-0 text-white" style={{ background: color }}>{initials(m.name)}</div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-semibold text-[#111827] truncate">{m.name}</div>
        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: `${color}18`, color }}>{m.role.replace('_', ' ')}</span>
      </div>
      {selected ? <span style={{ color }} className="text-xs font-bold shrink-0">✓</span>
                : <span className="text-gray-300 text-sm shrink-0">⠿</span>}
    </div>
  )
}
