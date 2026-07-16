import type { User } from '@supabase/supabase-js'
import { PALETTE } from '@/config/theme'

interface Props {
  user:          User
  avatarUrl?:    string
  initial:       string
  onEditProfile: () => void
  onSignOut:     () => void
  onClose:       () => void
}

export function UserDropdown({ avatarUrl, initial, onEditProfile, onSignOut, onClose }: Props) {
  return (
    <>
      <div className="motion-backdrop fixed inset-0 z-40" onClick={onClose} />
      <div style={{
        background: PALETTE.modal,
        border: `1px solid ${PALETTE.border}`,
        boxShadow: PALETTE.shadowMd,
        borderRadius: 16,
      }} className="motion-modal absolute right-0 mt-2 w-40 z-50 overflow-hidden">
        <button onClick={onEditProfile}
          style={{ color: PALETTE.secondary }}
          className="w-full text-left px-4 py-2.5 text-sm font-semibold bg-transparent border-none cursor-pointer transition-colors hover:bg-white/5">
          Edit Profile
        </button>
        <div style={{ background: PALETTE.border }} className="h-px mx-3" />
        <button onClick={onSignOut}
          style={{ color: '#F87171' }}
          className="w-full text-left px-4 py-2.5 text-sm font-semibold bg-transparent border-none cursor-pointer transition-colors hover:bg-white/5">
          Sign out
        </button>
      </div>
      <div className="sr-only">{avatarUrl}{initial}</div>
    </>
  )
}
