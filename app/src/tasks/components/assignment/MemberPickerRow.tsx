import type { Member } from '@/members/types/Member'
import { initials } from '@/members/utils/initials'

interface Props {
  m:       Member
  color:   string
  picked?: boolean
  multi?:  boolean
  onPick:  () => void
}

export function MemberPickerRow({ m, color, picked, multi, onPick }: Props) {
  return (
    <button type="button" onClick={onPick}
      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left cursor-pointer active:scale-[0.98] transition-all ${picked ? 'ring-2 ring-[#22C55E]' : ''}`}
      style={{ borderLeft: `3px solid ${color}`, background: picked ? `${color}18` : `${color}0D`, border: `1px solid ${color}22`, borderLeftWidth: '3px' }}>
      <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-extrabold shrink-0 text-white" style={{ background: color }}>
        {initials(m.name)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-[#F8FAFC] truncate">{m.name}</div>
        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded capitalize" style={{ background: `${color}18`, color }}>{m.role.replace(/_/g, ' ')}</span>
      </div>
      {multi && picked && <span className="text-[#4ADE80] font-bold shrink-0">✓</span>}
    </button>
  )
}
