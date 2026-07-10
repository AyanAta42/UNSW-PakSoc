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

/** Draggable member card in the roster panel. Switches to tap-to-select on mobile. */
export function MemberDragCard({ m, color, mobile, selected, dragging, onDragStart, onDragMove, onDragEnd, onSelect }: Props) {
  if (mobile) {
    return (
      <button type="button" onClick={onSelect} className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left cursor-pointer transition-all active:scale-[0.98] ${selected ? 'ring-2 ring-paksoc-bright dark:ring-[#AAFF00]' : ''}`}
        style={{ borderLeft: `3px solid ${color}`, background: selected ? `${color}18` : `${color}0D`, border: `1px solid ${color}22`, borderLeftWidth: '3px' }}>
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-extrabold shrink-0 text-white" style={{ background: color }}>{initials(m.name)}</div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-paksoc-deep dark:text-[#D4FAE3] truncate">{m.name}</div>
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: `${color}18`, color }}>{m.role.replace('_', ' ')}</span>
        </div>
        {selected && <span className="text-paksoc-bright text-xs font-bold shrink-0">✓</span>}
      </button>
    )
  }

  return (
    <div onPointerDown={onDragStart} onPointerMove={onDragMove} onPointerUp={onDragEnd} onPointerCancel={onDragEnd}
      className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg select-none touch-none ${dragging ? 'cursor-grabbing opacity-60 scale-[0.98]' : 'cursor-grab'}`}
      style={{ borderLeft: `3px solid ${color}`, background: dragging ? `${color}33` : `${color}0D`, border: `1px solid ${color}22`, borderLeftWidth: '3px' }}>
      <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-extrabold shrink-0 text-white" style={{ background: color }}>{initials(m.name)}</div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-semibold text-paksoc-deep dark:text-[#D4FAE3] truncate">{m.name}</div>
        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: `${color}18`, color }}>{m.role.replace('_', ' ')}</span>
      </div>
      <span className="text-gray-300 dark:text-[#2B5C3C] text-sm shrink-0">⠿</span>
    </div>
  )
}
