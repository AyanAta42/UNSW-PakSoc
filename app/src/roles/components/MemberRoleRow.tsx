import type { Member, MemberRole, Committee } from '@/members/types/Member'
import { ROLE_LABEL, ROLE_COLOR, ALL_ROLES } from '@/roles/config/roleLabels'

const COMMITTEES: Committee[] = ['Events', 'HR', 'Marketing', 'Sports']
const NEEDS_COMMITTEE: MemberRole[] = ['subcom', 'executive']
const C = { border: '#E5E7EB', muted: '#6B7280' }

interface Props {
  member:  Member
  saving:  boolean
  onRole:  (m: Member, role: MemberRole) => void
  onComm:  (m: Member, comm: Committee)  => void
}

export function MemberRoleRow({ member, saving, onRole, onComm }: Props) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      {member.avatar_url
        ? <img src={member.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
        : <div style={{ background: '#111827', color: '#fff' }} className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0">
            {(member.name || member.email)[0]?.toUpperCase()}
          </div>
      }
      <div className="flex-1 min-w-0">
        <div style={{ color: '#111827' }} className="text-sm font-semibold truncate">{member.name || '—'}</div>
      </div>
      {NEEDS_COMMITTEE.includes(member.role) && (
        <select value={member.committee ?? 'Events'} disabled={saving}
          onChange={e => onComm(member, e.target.value as Committee)}
          style={{ border: `1px solid ${C.border}`, color: C.muted, background: '#F9FAFB' }}
          className="rounded-lg px-2 py-1 text-xs font-semibold outline-none cursor-pointer disabled:opacity-50">
          {COMMITTEES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      )}
      <select value={member.role} disabled={saving}
        onChange={e => onRole(member, e.target.value as MemberRole)}
        style={{ border: `1px solid ${C.border}`, color: ROLE_COLOR[member.role].text, background: ROLE_COLOR[member.role].bg }}
        className="rounded-lg px-2 py-1 text-xs font-semibold outline-none cursor-pointer disabled:opacity-50">
        {ALL_ROLES.map(r => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
      </select>
      {saving && <span style={{ color: '#22C55E' }} className="text-xs animate-pulse ml-1">saving…</span>}
    </div>
  )
}
