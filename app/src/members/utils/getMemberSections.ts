import type { Member } from '@/members/types/Member'
import { COMM_CFG, COMMITTEE_ORDER, ROLE_SECTION_CFG } from '@/config/categoryConfig'

export interface MemberSection {
  key:     string
  label:   string
  color:   string
  members: Member[]
}

// Within a committee section: Arc Delegates first, then execs, then subcom.
const ROLE_RANK: Record<string, number> = { arc_delegate: 0, executive: 1, subcom: 2 }
const byRole = (a: Member, b: Member) => (ROLE_RANK[a.role] ?? 3) - (ROLE_RANK[b.role] ?? 3)

/** Groups members into ordered sections (President → VP → Committees). Public role and unassigned members are excluded. */
export function getMemberSections(members: Member[]): MemberSection[] {
  const assignable = members.filter(m => m.role !== 'public')
  const sections: MemberSection[] = []

  for (const role of ['president', 'vice_president'] as const) {
    const grouped = assignable.filter(m => m.role === role)
    if (grouped.length) sections.push({ key: role, ...ROLE_SECTION_CFG[role], members: grouped })
  }

  const rest = assignable.filter(m => m.role !== 'president' && m.role !== 'vice_president')

  for (const comm of COMMITTEE_ORDER) {
    const grouped = rest.filter(m => m.committee === comm).sort(byRole)
    if (grouped.length) sections.push({ key: comm, label: comm, ...COMM_CFG[comm], members: grouped })
  }

  return sections
}
