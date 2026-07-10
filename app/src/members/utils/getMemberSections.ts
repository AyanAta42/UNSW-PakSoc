import type { Member } from '@/members/types/Member'
import { COMM_CFG, COMMITTEE_ORDER, ROLE_SECTION_CFG } from '@/config/categoryConfig'

export interface MemberSection {
  key:     string
  label:   string
  color:   string
  members: Member[]
}

/** Groups a flat members array into ordered sections (President → VP → Committees → Team). */
export function getMemberSections(members: Member[]): MemberSection[] {
  const sections: MemberSection[] = []

  for (const role of ['president', 'vice_president'] as const) {
    const grouped = members.filter(m => m.role === role)
    if (grouped.length) sections.push({ key: role, ...ROLE_SECTION_CFG[role], members: grouped })
  }

  const rest = members.filter(m => m.role !== 'president' && m.role !== 'vice_president')

  for (const comm of COMMITTEE_ORDER) {
    const grouped = rest.filter(m => m.committee === comm)
    if (grouped.length) sections.push({ key: comm, label: comm, ...COMM_CFG[comm], members: grouped })
  }

  const team = rest.filter(m => !m.committee || !COMMITTEE_ORDER.includes(m.committee))
  if (team.length) sections.push({ key: 'team', label: 'Team', color: '#4B5563', members: team })

  return sections
}
