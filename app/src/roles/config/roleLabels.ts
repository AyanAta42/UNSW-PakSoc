import type { MemberRole } from '@/members/types/Member'

export const ROLE_LABEL: Record<MemberRole, string> = {
  public:         'Public',
  subcom:         'Subcom',
  executive:      'Executive',
  vice_president: 'Vice President',
  president:      'President',
}

export const ROLE_COLOR: Record<MemberRole, { bg: string; text: string }> = {
  public:         { bg: '#F3F4F6', text: '#6B7280' },
  subcom:         { bg: '#EFF6FF', text: '#3B82F6' },
  executive:      { bg: '#FEF3C7', text: '#D97706' },
  vice_president: { bg: '#F0FDF4', text: '#16A34A' },
  president:      { bg: '#FDF2F8', text: '#9333EA' },
}

export const ALL_ROLES: MemberRole[] = ['public', 'subcom', 'executive', 'vice_president', 'president']
