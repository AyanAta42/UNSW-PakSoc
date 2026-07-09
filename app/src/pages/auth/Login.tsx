import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { signInWithEmail, signUpWithEmail, signInWithGoogle } from '@/lib/auth'

const A  = '#22C55E'
const C  = {
  page:   '#F9FAFB',
  card:   '#FFFFFF',
  border: '#E5E7EB',
  muted:  '#6B7280',
  dark:   '#111827',
  shadow: '0 4px 24px rgba(0,0,0,0.08)',
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  )
}

export default function Login() {
  const navigate = useNavigate()
  const [mode, setMode]       = useState<'signin' | 'signup'>('signin')
  const [email, setEmail]     = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]     = useState('')
  const [info, setInfo]       = useState('')
  const [busy, setBusy]       = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(''); setInfo('')
    setBusy(true)
    try {
      if (mode === 'signin') {
        await signInWithEmail(email, password)
        navigate('/')
      } else {
        await signUpWithEmail(email, password)
        setInfo('Check your email for a confirmation link.')
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  async function handleGoogle() {
    setError('')
    try { await signInWithGoogle() }
    catch (err: unknown) { setError(err instanceof Error ? err.message : 'Google sign-in failed.') }
  }

  return (
    <div style={{ background: C.page, minHeight: '100vh', fontFamily: 'system-ui,sans-serif' }}
      className="flex flex-col items-center justify-center px-4">

      {/* Logo */}
      <div className="flex items-center gap-3 mb-8">
        <img src="/logo.png" alt="PakSoc" className="w-11 h-11 rounded-full object-cover" />
        <div>
          <div style={{ color: C.dark }} className="font-extrabold text-lg leading-tight">PakSoc UNSW</div>
          <div style={{ color: A, fontSize: 10 }} className="tracking-widest uppercase font-bold">Pakistani Society</div>
        </div>
      </div>

      {/* Card */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: C.shadow }}
        className="rounded-2xl p-8 w-full max-w-sm">

        <h2 style={{ color: C.dark }} className="text-xl font-extrabold mb-1">
          {mode === 'signin' ? 'Welcome back' : 'Create account'}
        </h2>
        <p style={{ color: C.muted }} className="text-sm mb-6">
          {mode === 'signin' ? 'Sign in to manage PakSoc.' : 'Join the PakSoc team.'}
        </p>

        {/* Google button */}
        <button onClick={handleGoogle}
          style={{ border: `1px solid ${C.border}`, color: C.dark, background: C.card }}
          className="w-full flex items-center justify-center gap-2.5 rounded-xl py-2.5 font-semibold text-sm cursor-pointer hover:bg-gray-50 transition-colors mb-4">
          <GoogleIcon />
          Continue with Google
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div style={{ background: C.border }} className="flex-1 h-px" />
          <span style={{ color: C.muted }} className="text-xs">or</span>
          <div style={{ background: C.border }} className="flex-1 h-px" />
        </div>

        {/* Email/password form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label style={{ color: C.dark }} className="text-xs font-semibold block mb-1">Email</label>
            <input
              type="email" required value={email} onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={{ border: `1px solid ${C.border}`, color: C.dark, background: '#FAFAFA' }}
              className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-300 transition"
            />
          </div>
          <div>
            <label style={{ color: C.dark }} className="text-xs font-semibold block mb-1">Password</label>
            <input
              type="password" required value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{ border: `1px solid ${C.border}`, color: C.dark, background: '#FAFAFA' }}
              className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-300 transition"
            />
          </div>

          {error && (
            <div className="rounded-xl px-3.5 py-2.5 text-sm font-medium" style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }}>
              {error}
            </div>
          )}
          {info && (
            <div className="rounded-xl px-3.5 py-2.5 text-sm font-medium" style={{ background: '#F0FDF4', color: '#16A34A', border: '1px solid #BBF7D0' }}>
              {info}
            </div>
          )}

          <button type="submit" disabled={busy}
            style={{ background: busy ? '#9CA3AF' : '#111827', color: '#fff' }}
            className="w-full rounded-xl py-2.5 font-bold text-sm border-none cursor-pointer hover:opacity-90 transition-opacity mt-1">
            {busy ? 'Please wait…' : mode === 'signin' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        {/* Toggle mode */}
        <p style={{ color: C.muted }} className="text-xs text-center mt-5">
          {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
          <button onClick={() => { setMode(m => m === 'signin' ? 'signup' : 'signin'); setError(''); setInfo('') }}
            style={{ color: A }} className="font-bold bg-transparent border-none cursor-pointer p-0 hover:opacity-80">
            {mode === 'signin' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>

      <p style={{ color: '#9CA3AF' }} className="text-xs mt-6">
        &copy; {new Date().getFullYear()} PakSoc UNSW
      </p>
    </div>
  )
}
