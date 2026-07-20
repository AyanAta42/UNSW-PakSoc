import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/core/supabase/client'
import { AuroraPage } from '@/shared/components/AuroraPage'
import { toast } from '@/shared/toast/toast'

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
      if (session) toast.success('Welcome back!')
      navigate(session ? '/' : '/login', { replace: true })
    }

    complete()
  }, [navigate])

  return (
    <AuroraPage contentClassName="min-h-[100dvh] flex items-center justify-center px-6 text-center text-[#94A3B8]">
      {message}
    </AuroraPage>
  )
}
