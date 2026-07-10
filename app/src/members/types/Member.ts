export type MemberRole = 'public' | 'subcom' | 'executive' | 'vice_president' | 'president'

export type Committee = 'Presidents' | 'Sports' | 'Marketing' | 'Events' | 'HR'

export interface Member {
  id: string
  user_id?: string
  name: string
  email: string
  role: MemberRole
  committee?: Committee
  avatar_url?: string
}
