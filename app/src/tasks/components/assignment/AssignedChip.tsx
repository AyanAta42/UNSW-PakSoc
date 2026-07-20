import type { Member } from '@/members/types/Member'
import { COMM_CFG } from '@/config/categoryConfig'

interface Props {
  member:   Member
  onRemove: () => void
}

/** Coloured tag showing an assigned member's name with a remove button. */
export function AssignedChip({ member, onRemove }: Props) {
  const color = (member.committee ? COMM_CFG[member.committee]?.color : undefined) ?? '#4ADE80'
  return (
    <span
      className="inline-flex items-center gap-1 rounded-md py-1 pl-2.5 pr-1 text-xs font-semibold"
      style={{ background: `${color}14`, color, border: `1px solid ${color}30` }}
    >
      {member.name}
      <button onClick={onRemove} aria-label={`Remove ${member.name}`}
        className="w-4 h-4 flex items-center justify-center rounded leading-none cursor-pointer bg-transparent border-none text-sm hover:bg-black/20 transition-colors" style={{ color: `${color}AA` }}>×</button>
    </span>
  )
}
