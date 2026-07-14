import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/core/supabase/client'

/** Handles the OAuth return from Google and completes the Supabase session exchange. */
export default function AuthCallbackPage() {
  const navigate = useNavigate()
  const [message, setMessage] = useState('Signing you in…')

  useEffect(() => {
    async function complete() {
      const params    = new URLSearchParams(window.location.search)
      const code      = params.get('code')
      const authError = params.get('error_description')

      if (authError) {
        setMessage(decodeURIComponent(authError))
        setTimeout(() => navigate('/login', { replace: true }), 2500)
        return
      }

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (error) {
          console.error('[auth] exchange failed:', error.message)
          setMessage(error.message)
          setTimeout(() => navigate('/login', { replace: true }), 2500)
          return
        }
      }

      const { data: { session } } = await supabase.auth.getSession()
      navigate(session ? '/' : '/login', { replace: true })
    }

    complete()
  }, [navigate])

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui,sans-serif', color: '#6B7280' }}>
      {message}
    </div>
  )
}
