import { useEffect, useRef, useState } from 'react'
import { useAppNavigate as useNavigate } from '@/shared/router/useAppNavigate'
import { GoogleSignInButton } from './GoogleSignInButton'
import { signInWithGoogle } from '@/auth/services/signInWithGoogle'
import { toast } from '@/shared/toast/toast'

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: object) => void
          renderButton: (el: HTMLElement, options: object) => void
          disableAutoSelect: () => void
        }
      }
    }
  }
}

function loadGsi(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) return resolve()
    const existing = document.getElementById('gsi-script') as HTMLScriptElement | null
    if (existing) {
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () => reject(new Error('gsi load failed')))
      return
    }
    const s = document.createElement('script')
    s.id = 'gsi-script'
    s.src = 'https://accounts.google.com/gsi/client'
    s.async = true
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('gsi load failed'))
    document.head.appendChild(s)
  })
}

interface Props { onError: (msg: string) => void }

/**
 * Google sign-in that never navigates away from the app window — a redirect
 * OAuth flow breaks the installed PWA out of standalone mode. Google's SDK
 * authenticates in a self-closing popup / FedCM prompt and hands back an ID
 * token that Supabase exchanges for a session in place.
 * Falls back to the redirect flow if the Google script can't load or render.
 */
export function GoogleIdentityButton({ onError }: Props) {
  const navigate = useNavigate()
  const slot = useRef<HTMLDivElement>(null)
  const [fallback, setFallback] = useState(!CLIENT_ID)

  useEffect(() => {
    if (!CLIENT_ID) return
    let alive = true

    loadGsi()
      .then(() => {
        if (!alive || !slot.current || !window.google) return
        window.google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: async (resp: { credential: string }) => {
            try {
              const { supabase } = await import('@/core/supabase/client')
              const { error } = await supabase.auth.signInWithIdToken({ provider: 'google', token: resp.credential })
              if (error) throw error
              toast.success('Welcome back!')
              navigate('/')
            } catch (e) {
              onError(e instanceof Error ? e.message : 'Google sign-in failed.')
            }
          },
          itp_support: true,
          use_fedcm_for_prompt: true,
        })
        window.google.accounts.id.renderButton(slot.current, {
          type: 'standard',
          theme: 'filled_black',
          size: 'large',
          text: 'continue_with',
          shape: 'pill',
          logo_alignment: 'left',
          width: slot.current.clientWidth || 320,
        })
        // If the origin isn't authorized for the client ID, the iframe renders
        // empty — fall back to the redirect flow so login always works
        window.setTimeout(() => {
          if (alive && slot.current && slot.current.offsetHeight < 10) setFallback(true)
        }, 2500)
      })
      .catch(() => { if (alive) setFallback(true) })

    return () => { alive = false }
  }, [navigate, onError])

  async function handleRedirectFlow() {
    try { await signInWithGoogle() }
    catch (e) { onError(e instanceof Error ? e.message : 'Google sign-in failed.') }
  }

  if (fallback) return <GoogleSignInButton onClick={handleRedirectFlow} />
  return <div ref={slot} className="mb-4 flex justify-center min-h-[44px]" />
}
