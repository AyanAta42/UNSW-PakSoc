/**
 * Sandbox mode — reads hit the real database, writes never leave the browser.
 *
 * Dev-only by construction: every call site is behind `import.meta.env.DEV`,
 * which Rollup folds to `false` in a production build, so the whole sandbox
 * folder is dead-code-eliminated from the shipped bundle. There is no way to
 * turn this on for a real user.
 */

const LS_KEY = 'paksoc:sandbox'

/**
 * True when writes should be captured locally instead of sent to Supabase.
 *
 * Dev defaults to ON. Safety must not depend on remembering to start the right
 * script: the failure that motivated this was a browser tab where the sandbox
 * simply wasn't running, which looked exactly like one where it was. You now
 * have to opt *out* to write to the live database from localhost.
 */
export function isSandboxOn(): boolean {
  if (!import.meta.env.DEV) return false
  // `npm run dev:live` — an explicit, deliberate opt-out that beats any
  // remembered toggle, so there is always one obvious way back to real writes.
  if (import.meta.env.MODE === 'live') return false
  try {
    const stored = localStorage.getItem(LS_KEY)
    if (stored === 'on') return true
    if (stored === 'off') return false
  } catch { /* private mode */ }
  return true
}

/** Flip the runtime override (survives restarts; overrides VITE_SANDBOX). */
export function setSandboxEnabled(on: boolean): void {
  try {
    localStorage.setItem(LS_KEY, on ? 'on' : 'off')
  } catch { /* private mode */ }
}
