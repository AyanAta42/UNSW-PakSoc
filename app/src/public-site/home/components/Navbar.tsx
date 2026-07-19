import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { User } from '@supabase/supabase-js'
import { usePermissions } from '@/roles/hooks/usePermissions'
import { UserDropdown }   from './UserDropdown'
import { ACCENT, ACCENT_TEXT, GLASS_CHIP, GLASS_NAV, PALETTE } from '@/config/theme'
import { toast } from '@/shared/toast/toast'

interface Props {
  user?:         User | null
  avatarUrl?:    string
  avatarBroken:  boolean
  initial:       string
  onAvatarError: () => void
  onEditProfile: () => void
}

export function Navbar({ user, avatarUrl, avatarBroken, initial, onAvatarError, onEditProfile }: Props) {
  const navigate   = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const { can }    = usePermissions()

  return (
    <header style={GLASS_NAV} className="glass-nav sticky top-0 z-50 pt-[env(safe-area-inset-top)]">
      <nav className="h-14 px-4 md:px-8 flex items-center justify-between gap-3">
        <div className="flex items-center gap-1 shrink min-w-0">
          <img
            src="/logo.webp"
            alt="PakSoc UNSW"
            width={52}
            height={52}
            decoding="async"
            fetchPriority="high"
            className="w-[52px] h-[52px] -mr-0.5 rounded-full object-cover shrink-0"
          />
          <div className="min-w-0">
            <div style={{ color: PALETTE.dark }} className="font-bold text-sm leading-tight truncate">PakSoc UNSW</div>
            <div style={{ color: ACCENT, fontSize: 9 }} className="tracking-widest uppercase truncate">Pakistani Society</div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 ml-auto">
          {can.viewEvents && (
            <button onClick={() => navigate('/events')} data-cta
              style={{ background: ACCENT, color: ACCENT_TEXT, borderRadius: PALETTE.radiusBtn, boxShadow: '0 0 20px rgba(34,197,94,0.25)' }}
              className="motion-primary px-4 py-1.5 font-bold text-xs border-none cursor-pointer hover:opacity-85 transition-opacity whitespace-nowrap">
              Manage Events
            </button>
          )}
          {can.manageRoles && (
            <button onClick={() => navigate('/roles')}
              style={{ ...GLASS_CHIP, color: PALETTE.secondary, borderRadius: PALETTE.radiusBtn }}
              className="px-4 py-1.5 font-bold text-xs cursor-pointer hover:bg-white/[0.08] transition-colors whitespace-nowrap hidden sm:block">
              Manage Roles
            </button>
          )}

          {user ? (
            <div className="relative">
              <button onClick={() => setMenuOpen(o => !o)} className="p-0 border-none bg-transparent cursor-pointer rounded-full">
                {avatarUrl && !avatarBroken
                  ? <img src={avatarUrl} alt="" referrerPolicy="no-referrer" onError={onAvatarError}
                      className="w-8 h-8 rounded-full object-cover hover:opacity-90 transition-opacity ring-2 ring-[#22C55E]/80 ring-offset-2 ring-offset-transparent" />
                  : <div style={{ ...GLASS_CHIP, color: PALETTE.secondary, borderRadius: '9999px' }}
                      className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs hover:bg-white/[0.08] transition-colors">
                      {initial}
                    </div>
                }
              </button>
              {menuOpen && <UserDropdown user={user} avatarUrl={avatarUrl} initial={initial}
                onEditProfile={() => { setMenuOpen(false); onEditProfile() }}
                onSignOut={() => {
                  setMenuOpen(false)
                  void import('@/auth/services/signOut')
                    .then(m => m.signOut())
                    .then(() => { toast.success('Logged out'); navigate('/login') })
                    .catch(() => toast.error("Couldn't log out", 'Please try again.'))
                }}
                onClose={() => setMenuOpen(false)} />}
            </div>
          ) : (
            <button onClick={() => navigate('/login')} data-cta
              aria-label="Login" title="Login"
              style={{ background: ACCENT, color: ACCENT_TEXT, boxShadow: '0 0 20px rgba(34,197,94,0.35)' }}
              className="motion-primary w-9 h-9 rounded-full border-none cursor-pointer hover:opacity-90 flex items-center justify-center shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5" />
              </svg>
            </button>
          )}
        </div>
      </nav>
    </header>
  )
}
