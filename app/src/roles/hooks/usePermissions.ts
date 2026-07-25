import { useCurrentMember } from '@/roles/context/CurrentMemberContext'
import { useAuth }          from '@/auth/hooks/useAuth'
import type { MemberRole }  from '@/members/types/Member'

export const ROLE_RANK: Record<MemberRole, number> = {
  public:         0,
  subcom:         1,
  executive:      2,
  // Arc Delegate carries no committee — it's a standalone role, but ranks
  // level with Executive so it gets identical permissions.
  arc_delegate:   2,
  vice_president: 3,
  president:      3,
}

/** Returns permission flags and helpers based on the current user's role. */
export function usePermissions() {
  const { user }          = useAuth()
  const { member, loading } = useCurrentMember()

  // The developer flag is a hidden super-role that lives alongside the normal
  // display role. When set, effective rank is pushed above every real role so
  // that every access check below — routes, nav, edit controls — passes at once,
  // giving access equal to a President across the whole app. `role` still exposes
  // only the display role, so nothing about the dev status leaks into the UI.
  const isDeveloper = !!member?.isDeveloper
  const baseRank = member ? ROLE_RANK[member.role] : -1
  const rank = isDeveloper ? Infinity : baseRank

  return {
    loading,
    isLoggedIn:  !!user,
    role:        member?.role ?? null,
    isDeveloper,
    isAtLeast:   (min: MemberRole) => rank >= ROLE_RANK[min],
    can: {
      viewEvents:     rank >= ROLE_RANK.subcom,
      // Subcom may create and edit events...
      editEvents:     rank >= ROLE_RANK.subcom,
      // ...but announcing/unannouncing (toggling public visibility) and deleting
      // are reserved for executives and above.
      announceEvents: rank >= ROLE_RANK.executive,
      deleteEvents:   rank >= ROLE_RANK.executive,
      manageRoles:    rank >= ROLE_RANK.president,
      viewTaskBoard:  rank >= ROLE_RANK.subcom,
    },
  }
}
