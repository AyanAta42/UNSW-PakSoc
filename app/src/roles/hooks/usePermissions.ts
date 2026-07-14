import { useCurrentMember } from '@/roles/context/CurrentMemberContext'
import { useAuth }          from '@/auth/hooks/useAuth'
import type { MemberRole }  from '@/members/types/Member'

export const ROLE_RANK: Record<MemberRole, number> = {
  public:         0,
  subcom:         1,
  executive:      2,
  vice_president: 3,
  president:      4,
}

/** Returns permission flags and helpers based on the current user's role. */
export function usePermissions() {
  const { user }          = useAuth()
  const { member, loading } = useCurrentMember()

  const rank = member ? ROLE_RANK[member.role] : -1

  return {
    loading,
    isLoggedIn:  !!user,
    role:        member?.role ?? null,
    isAtLeast:   (min: MemberRole) => rank >= ROLE_RANK[min],
    can: {
      viewEvents:    rank >= ROLE_RANK.subcom,
      editEvents:    rank >= ROLE_RANK.executive,
      manageRoles:   rank >= ROLE_RANK.president,
      viewTaskBoard: rank >= ROLE_RANK.subcom,
    },
  }
}
