import type { FormEvent } from 'react'
import { ACCENT, ACCENT_TEXT, PALETTE } from '@/config/theme'

interface Props {
  mode:      'signin' | 'signup'
  email:     string
  password:  string
  error:     string
  info:      string
  busy:      boolean
  onEmail:   (v: string) => void
  onPassword:(v: string) => void
  onSubmit:  (e: FormEvent) => void
}

const inp = {
  border: `1px solid ${PALETTE.border}`,
  color: PALETTE.dark,
  background: PALETTE.input,
  borderRadius: PALETTE.radiusInput,
}

export function EmailAuthForm({ mode, email, password, error, info, busy, onEmail, onPassword, onSubmit }: Props) {
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <div>
        <label style={{ color: PALETTE.secondary }} className="text-xs font-semibold block mb-1">Email</label>
        <input type="email" required value={email} onChange={e => onEmail(e.target.value)} placeholder="you@example.com"
          style={inp} className="w-full px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-500/30 transition" />
      </div>
      <div>
        <label style={{ color: PALETTE.secondary }} className="text-xs font-semibold block mb-1">Password</label>
        <input type="password" required value={password} onChange={e => onPassword(e.target.value)} placeholder="••••••••"
          style={inp} className="w-full px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-500/30 transition" />
      </div>
      {error && <div className="px-3.5 py-2.5 text-sm font-medium" style={{ background: 'rgba(239,68,68,0.1)', color: '#F87171', border: '1px solid rgba(239,68,68,0.3)', borderRadius: PALETTE.radiusInput }}>{error}</div>}
      {info  && <div className="px-3.5 py-2.5 text-sm font-medium" style={{ background: 'rgba(34,197,94,0.1)', color: '#4ADE80', border: '1px solid rgba(34,197,94,0.3)', borderRadius: PALETTE.radiusInput }}>{info}</div>}
      <button type="submit" disabled={busy}
        style={{ background: busy ? PALETTE.cardAlt : ACCENT, color: busy ? PALETTE.disabled : ACCENT_TEXT, borderRadius: PALETTE.radiusBtn, boxShadow: busy ? 'none' : '0 0 20px rgba(34,197,94,0.25)' }}
        className="w-full py-2.5 font-bold text-sm border-none cursor-pointer hover:opacity-90 transition-opacity mt-1">
        {busy ? 'Please wait…' : mode === 'signin' ? 'Sign In' : 'Create Account'}
      </button>
    </form>
  )
}
