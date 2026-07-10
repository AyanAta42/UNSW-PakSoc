import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { signInWithEmail }  from '@/auth/services/signInWithEmail'
import { signUpWithEmail }  from '@/auth/services/signUpWithEmail'
import { signInWithGoogle } from '@/auth/services/signInWithGoogle'
import { GoogleSignInButton } from '@/auth/components/GoogleSignInButton'
import { EmailAuthForm }      from '@/auth/components/EmailAuthForm'
import { PALETTE, ACCENT }   from '@/config/theme'

export default function LoginPage() {
  const navigate = useNavigate()
  const [mode, setMode]         = useState<'signin' | 'signup'>('signin')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [info, setInfo]         = useState('')
  const [busy, setBusy]         = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(''); setInfo(''); setBusy(true)
    try {
      if (mode === 'signin') { await signInWithEmail(email, password); navigate('/') }
      else                   { await signUpWithEmail(email, password); setInfo('Check your email for a confirmation link.') }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally { setBusy(false) }
  }

  async function handleGoogle() {
    setError('')
    try { await signInWithGoogle() }
    catch (err: unknown) { setError(err instanceof Error ? err.message : 'Google sign-in failed.') }
  }

  return (
    <div style={{ background: PALETTE.page, minHeight: '100vh', fontFamily: 'system-ui,sans-serif' }} className="flex flex-col items-center justify-center px-4">
      <div className="flex items-center gap-3 mb-8">
        <img src="/logo.png" alt="PakSoc" className="w-11 h-11 rounded-full object-cover" />
        <div>
          <div style={{ color: PALETTE.dark }} className="font-extrabold text-lg leading-tight">PakSoc UNSW</div>
          <div style={{ color: ACCENT, fontSize: 10 }} className="tracking-widest uppercase font-bold">Pakistani Society</div>
        </div>
      </div>
      <div style={{ background: PALETTE.card, border: `1px solid ${PALETTE.border}`, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }} className="rounded-2xl p-8 w-full max-w-sm">
        <h2 style={{ color: PALETTE.dark }} className="text-xl font-extrabold mb-1">{mode === 'signin' ? 'Welcome back' : 'Create account'}</h2>
        <p style={{ color: PALETTE.muted }} className="text-sm mb-6">{mode === 'signin' ? 'Sign in to manage PakSoc.' : 'Join the PakSoc team.'}</p>
        <GoogleSignInButton onClick={handleGoogle} />
        <div className="flex items-center gap-3 mb-4">
          <div style={{ background: PALETTE.border }} className="flex-1 h-px" />
          <span style={{ color: PALETTE.muted }} className="text-xs">or</span>
          <div style={{ background: PALETTE.border }} className="flex-1 h-px" />
        </div>
        <EmailAuthForm mode={mode} email={email} password={password} error={error} info={info} busy={busy} onEmail={setEmail} onPassword={setPassword} onSubmit={handleSubmit} />
        <p style={{ color: PALETTE.muted }} className="text-xs text-center mt-5">
          {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
          <button onClick={() => { setMode(m => m === 'signin' ? 'signup' : 'signin'); setError(''); setInfo('') }} style={{ color: ACCENT }} className="font-bold bg-transparent border-none cursor-pointer p-0 hover:opacity-80">
            {mode === 'signin' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
      <p style={{ color: '#9CA3AF' }} className="text-xs mt-6">&copy; {new Date().getFullYear()} PakSoc UNSW</p>
    </div>
  )
}
