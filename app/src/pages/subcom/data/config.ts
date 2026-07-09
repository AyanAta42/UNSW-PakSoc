import type { TaskCategory, Member, Committee } from './types'

export const CAT_CFG: Record<TaskCategory, { color: string; activeCls: string; headerCls: string }> = {
  Task:  { color: '#3B9DDD', activeCls: 'bg-blue-50   border-blue-400   text-blue-600',   headerCls: 'bg-blue-50   text-blue-600'   },
  Game:  { color: '#E74C3C', activeCls: 'bg-red-50    border-red-400    text-red-600',    headerCls: 'bg-red-50    text-red-600'    },
  Stall: { color: '#E67E22', activeCls: 'bg-orange-50 border-orange-400 text-orange-600', headerCls: 'bg-orange-50 text-orange-600' },
}

export const ALL_CATS: TaskCategory[] = ['Task', 'Game', 'Stall']

export const COMM_CFG: Record<string, { color: string }> = {
  Presidents: { color: '#C9A84C' },
  Sports:     { color: '#3B9DDD' },
  Marketing:  { color: '#E67E22' },
  Events:     { color: '#E74C3C' },
  HR:         { color: '#A855F7' },
}

export const COMM_ORDER = ['Presidents', 'Sports', 'Marketing', 'Events', 'HR']

/** Committees used for subcom/exec roster grouping (excludes legacy Presidents bucket). */
export const COMMITTEE_ORDER: Committee[] = ['Sports', 'Marketing', 'Events', 'HR']

export const ROLE_SECTION_CFG = {
  president:      { label: 'President',      color: '#9333EA' },
  vice_president: { label: 'Vice President', color: '#16A34A' },
} as const

export interface MemberSection {
  key: string
  label: string
  color: string
  members: Member[]
}

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

export const initials = (n: string) => n.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

export const inputCls = 'w-full px-3 py-2.5 border border-gray-200 dark:border-[#AAFF00]/[.15] rounded-lg bg-gray-50 dark:bg-[#070C09] text-paksoc-deep dark:text-[#D4FAE3] text-sm outline-none focus:border-paksoc-bright dark:focus:border-paksoc-bright transition-colors placeholder:text-gray-400 dark:placeholder:text-[#1E4029]'
export const labelCls = 'block text-[11px] font-bold text-paksoc-mid dark:text-[#2B5C3C] uppercase tracking-wider mb-1.5'
