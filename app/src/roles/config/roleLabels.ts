import type { MemberRole } from '@/members/types/Member'

export const ROLE_LABEL: Record<MemberRole, string> = {
  public:         'Public',
  subcom:         'Subcom',
  executive:      'Executive',
  vice_president: 'Vice President',
  president:      'President',
}

export const ROLE_COLOR: Record<MemberRole, { bg: string; text: string }> = {
  public:         { bg: 'rgba(148,163,184,0.12)', text: '#94A3B8' },
  subcom:         { bg: 'rgba(96,165,250,0.12)',  text: '#60A5FA' },
  executive:      { bg: 'rgba(251,191,36,0.12)',  text: '#FBBF24' },
  vice_president: { bg: 'rgba(74,222,128,0.12)',  text: '#4ADE80' },
  president:      { bg: 'rgba(192,132,252,0.12)', text: '#C084FC' },
}

export const ALL_ROLES: MemberRole[] = ['public', 'subcom', 'executive', 'vice_president', 'president']
