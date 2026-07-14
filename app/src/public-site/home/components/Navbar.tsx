import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { User } from '@supabase/supabase-js'
import { signOut }         from '@/auth/services/signOut'
import { usePermissions }  from '@/roles/hooks/usePermissions'
import { UserDropdown }    from './UserDropdown'
import { ACCENT, PALETTE } from '@/config/theme'

interface Props {
  user?:         User | null
  avatarUrl?:    string
  avatarBroken:  boolean
  initial:       string
  onAvatarError: () => void
  onEditProfile: () => void
}

export function Navbar({ user, avatarUrl, avatarBroken, initial, onAvatarError, onEditProfile }: Props) {
  const navigate  = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const { can }   = usePermissions()

  return (
    <nav style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(14px)', borderBottom: `1px solid ${PALETTE.border}` }}
      className="sticky top-0 z-50 h-14 px-4 md:px-8 flex items-center justify-between gap-3">

      <div className="flex items-center gap-2 shrink min-w-0">
        <img src="/logo.png" alt="PakSoc UNSW" className="w-9 h-9 rounded-full object-cover shrink-0" />
        <div className="min-w-0">
          <div style={{ color: PALETTE.dark }} className="font-bold text-sm leading-tight truncate">PakSoc UNSW</div>
          <div style={{ color: ACCENT, fontSize: 9 }} className="tracking-widest uppercase truncate">Pakistani Society</div>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 ml-auto">
        {can.viewEvents  && <button onClick={() => navigate('/events')} style={{ background: ACCENT, color: '#fff' }} className="rounded-full px-3.5 py-1.5 font-bold text-xs border-none cursor-pointer hover:opacity-85 transition-opacity whitespace-nowrap shadow-sm">Manage Events</button>}
        {can.manageRoles && <button onClick={() => navigate('/roles')}  style={{ color: PALETTE.dark, border: `1px solid ${PALETTE.border}`, background: '#fff' }} className="rounded-full px-3.5 py-1.5 font-bold text-xs cursor-pointer hover:bg-gray-50 transition-colors whitespace-nowrap hidden sm:block shadow-sm">Manage Roles</button>}

        {user ? (
          <div className="relative">
            <button onClick={() => setMenuOpen(o => !o)} className="p-0 border-none bg-transparent cursor-pointer rounded-full">
              {avatarUrl && !avatarBroken
                ? <img src={avatarUrl} alt="" referrerPolicy="no-referrer" onError={onAvatarError} className="w-8 h-8 rounded-full object-cover ring-2 ring-[#22C55E] ring-offset-1 hover:opacity-90 transition-opacity" />
                : <div style={{ background: '#111827', color: '#fff' }} className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs hover:opacity-90 transition-opacity">{initial}</div>
              }
            </button>
            {menuOpen && <UserDropdown user={user} avatarUrl={avatarUrl} initial={initial} onEditProfile={() => { setMenuOpen(false); onEditProfile() }} onSignOut={() => { setMenuOpen(false); signOut().then(() => navigate('/login')) }} onClose={() => setMenuOpen(false)} />}
          </div>
        ) : (
          <button onClick={() => navigate('/login')} style={{ background: '#111827', color: '#fff' }} className="rounded-full px-3.5 py-1.5 font-bold text-xs border-none cursor-pointer hover:opacity-90 whitespace-nowrap">Login</button>
        )}
      </div>
    </nav>
  )
}
