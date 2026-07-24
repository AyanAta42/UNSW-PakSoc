import { Navigate } from 'react-router-dom'
import { usePermissions }            from '@/roles/hooks/usePermissions'
import { useAuth }                   from '@/auth/hooks/useAuth'
import { PAGE_BG }                   from '@/config/theme'
import type { MemberRole }           from '@/members/types/Member'

interface Props {
  children: React.ReactNode
  /** Minimum role required to access this route. */
  minRole:  MemberRole
}

const Spinner = () => (
  <div style={{ minHeight: '100dvh', background: PAGE_BG, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif', color: '#94A3B8' }}>
    Loading…
  </div>
)

export default function RoleRoute({ children, minRole }: Props) {
  const { user, loading: authLoading } = useAuth()
  const { loading, isAtLeast }         = usePermissions()

  if (authLoading || loading) return <Spinner />

  if (!user) return <Navigate to="/login" replace />

  // isAtLeast already accounts for the developer super-role, so a dev clears
  // every minRole gate regardless of their display role.
  if (!isAtLeast(minRole)) return <Navigate to="/" replace />

  return <>{children}</>
}
