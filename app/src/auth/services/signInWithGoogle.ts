import { supabase } from '@/core/supabase/client'

export async function signInWithGoogle() {
  // window.location.origin is already correct for both local and prod
  const redirectTo = `${window.location.origin}/auth/callback`
  if (import.meta.env.DEV) console.info('[auth] OAuth redirectTo:', redirectTo)

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      // Always show the account chooser instead of silently reusing the last
      // Google session — so after signing out the user can pick an account.
      queryParams: { prompt: 'select_account' },
    },
  })
  if (error) throw error
}
