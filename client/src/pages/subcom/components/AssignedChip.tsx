import type { Member } from '../data/types'
import { COMM_CFG } from '../data/config'

interface Props {
  member: Member
  onRemove: () => void
}

export function AssignedChip({ member, onRemove }: Props) {
  const color = COMM_CFG[member.committee]?.color ?? '#1A6B3A'
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
      style={{ background: `${color}18`, color, border: `1px solid ${color}35` }}
    >
      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
      {member.name}
      <button
        onClick={onRemove}
        className="ml-0.5 leading-none cursor-pointer bg-transparent border-none text-sm"
        style={{ color: `${color}99` }}
      >×</button>
    </span>
  )
}
