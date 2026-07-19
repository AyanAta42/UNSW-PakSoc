import type { Member } from '@/members/types/Member'
import { COMM_CFG } from '@/config/categoryConfig'

interface Props {
  member:   Member
  onRemove: () => void
}

/** Coloured pill showing an assigned member's name with a remove button. */
export function AssignedChip({ member, onRemove }: Props) {
  const color = (member.committee ? COMM_CFG[member.committee]?.color : undefined) ?? '#4ADE80'
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
      style={{ background: `${color}18`, color, border: `1px solid ${color}35` }}
    >
      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
      {member.name}
      <button onClick={onRemove} className="ml-0.5 leading-none cursor-pointer bg-transparent border-none text-sm" style={{ color: `${color}99` }}>×</button>
    </span>
  )
}
