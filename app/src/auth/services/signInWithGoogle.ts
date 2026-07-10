import { supabase } from '@/core/supabase/client'

export async function signInWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/`,
      // TEMP: force Google consent screen on every sign-in (remove after OAuth verification)
      queryParams: { prompt: 'consent', access_type: 'offline' },
    },
  })
  if (error) throw error
}
