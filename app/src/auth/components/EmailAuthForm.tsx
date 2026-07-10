import type { FormEvent } from 'react'
import { PALETTE } from '@/config/theme'

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

const inp = { border: `1px solid ${PALETTE.border}`, color: PALETTE.dark, background: '#FAFAFA' }

export function EmailAuthForm({ mode, email, password, error, info, busy, onEmail, onPassword, onSubmit }: Props) {
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <div>
        <label style={{ color: PALETTE.dark }} className="text-xs font-semibold block mb-1">Email</label>
        <input type="email" required value={email} onChange={e => onEmail(e.target.value)} placeholder="you@example.com"
          style={inp} className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-300 transition" />
      </div>
      <div>
        <label style={{ color: PALETTE.dark }} className="text-xs font-semibold block mb-1">Password</label>
        <input type="password" required value={password} onChange={e => onPassword(e.target.value)} placeholder="••••••••"
          style={inp} className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-300 transition" />
      </div>
      {error && <div className="rounded-xl px-3.5 py-2.5 text-sm font-medium" style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }}>{error}</div>}
      {info  && <div className="rounded-xl px-3.5 py-2.5 text-sm font-medium" style={{ background: '#F0FDF4', color: '#16A34A', border: '1px solid #BBF7D0' }}>{info}</div>}
      <button type="submit" disabled={busy}
        style={{ background: busy ? '#9CA3AF' : '#111827', color: '#fff' }}
        className="w-full rounded-xl py-2.5 font-bold text-sm border-none cursor-pointer hover:opacity-90 transition-opacity mt-1">
        {busy ? 'Please wait…' : mode === 'signin' ? 'Sign In' : 'Create Account'}
      </button>
    </form>
  )
}
