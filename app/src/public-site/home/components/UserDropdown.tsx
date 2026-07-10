import type { User } from '@supabase/supabase-js'
import { PALETTE } from '@/config/theme'

interface Props {
  user:        User
  avatarUrl?:  string
  initial:     string
  onEditProfile:() => void
  onSignOut:   () => void
  onClose:     () => void
}

/** Floating dropdown menu shown when the user clicks their avatar. */
export function UserDropdown({ avatarUrl, initial, onEditProfile, onSignOut, onClose }: Props) {
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div style={{ background: PALETTE.card, border: `1px solid ${PALETTE.border}`, boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}
        className="absolute right-0 mt-2 w-36 rounded-xl z-50 overflow-hidden">
        <button onClick={onEditProfile} style={{ color: PALETTE.dark }}
          className="w-full text-left px-4 py-2.5 text-sm font-semibold bg-transparent border-none cursor-pointer hover:bg-gray-50 transition-colors">
          Edit Profile
        </button>
        <div style={{ background: PALETTE.border }} className="h-px mx-3" />
        <button onClick={onSignOut} style={{ color: '#DC2626' }}
          className="w-full text-left px-4 py-2.5 text-sm font-semibold bg-transparent border-none cursor-pointer hover:bg-red-50 transition-colors">
          Sign out
        </button>
      </div>
      <div className="sr-only">{avatarUrl}{initial}</div>
    </>
  )
}
