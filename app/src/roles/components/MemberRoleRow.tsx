import type { Member, MemberRole, Committee } from '@/members/types/Member'
import { ROLE_LABEL, ROLE_COLOR, ALL_ROLES } from '@/roles/config/roleLabels'
import { PALETTE } from '@/config/theme'

const COMMITTEES: Committee[] = ['Events', 'HR', 'Marketing', 'Sports']
// Arc Delegate is only selectable for members who are Executives.
const EXEC_COMMITTEES: Committee[] = [...COMMITTEES, 'Arc Delegate']
const NEEDS_COMMITTEE: MemberRole[] = ['subcom', 'executive']

interface Props {
  member:      Member
  saving:      boolean
  onRole:      (m: Member, role: MemberRole) => void
  onComm:      (m: Member, comm: Committee)  => void
  removing?:   boolean
  selected?:   boolean
  selectable?: boolean
  onToggle?:   (m: Member) => void
}

export function MemberRoleRow({ member, saving, onRole, onComm, removing = false, selected = false, selectable = true, onToggle }: Props) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 cursor-pointer"
      onClick={() => { if (removing && selectable) onToggle?.(member) }}
      style={{ cursor: removing ? (selectable ? 'pointer' : 'not-allowed') : 'default', opacity: removing && !selectable ? 0.5 : 1 }}>
      {removing && (
        <input type="checkbox" checked={selected} disabled={!selectable} readOnly
          className="w-4 h-4 shrink-0 accent-red-500 cursor-pointer disabled:cursor-not-allowed" />
      )}
      {member.avatar_url
        ? <img src={member.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
        : <div style={{ background: PALETTE.cardAlt, border: `1px solid ${PALETTE.border}`, color: PALETTE.secondary }} className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0">
            {(member.name || member.email)[0]?.toUpperCase()}
          </div>
      }
      <div className="flex-1 min-w-0">
        <div style={{ color: PALETTE.dark }} className="text-sm font-semibold truncate">{member.name || '—'}</div>
        {removing && !selectable && <div style={{ color: PALETTE.muted }} className="text-[11px]">That's you</div>}
      </div>
      {NEEDS_COMMITTEE.includes(member.role) && (
        <select value={member.committee ?? 'Events'} disabled={saving || removing} onClick={e => e.stopPropagation()}
          onChange={e => onComm(member, e.target.value as Committee)}
          style={{ border: `1px solid ${PALETTE.border}`, color: PALETTE.secondary, background: PALETTE.input }}
          className="rounded-lg px-2 py-1 text-xs font-semibold outline-none cursor-pointer disabled:opacity-50">
          {(member.role === 'executive' ? EXEC_COMMITTEES : COMMITTEES).map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      )}
      <select value={member.role} disabled={saving || removing} onClick={e => e.stopPropagation()}
        onChange={e => onRole(member, e.target.value as MemberRole)}
        style={{ border: `1px solid ${PALETTE.border}`, color: ROLE_COLOR[member.role].text, background: ROLE_COLOR[member.role].bg }}
        className="rounded-lg px-2 py-1 text-xs font-semibold outline-none cursor-pointer disabled:opacity-50">
        {ALL_ROLES.map(r => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
      </select>
      {saving && <span style={{ color: '#4ADE80' }} className="text-xs animate-pulse ml-1">saving…</span>}
    </div>
  )
}
