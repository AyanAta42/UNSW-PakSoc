import { useSyncExternalStore } from 'react'

/**
 * PWA install orchestration.
 *
 * IMPORTANT — this is what actually fixes the "Google Play Protect · Unsafe app
 * blocked" warning. That warning does NOT come from installing a PWA; it comes
 * from side-loading a generated *.apk (PWABuilder / Bubblewrap / a "website to
 * APK" service) whose targetSdkVersion is too old. The safe path is the
 * browser's own install: on Android/desktop Chromium that mints a Google-signed
 * WebAPK (never flagged by Play Protect); on iOS it's Share ▸ Add to Home
 * Screen. This module drives that native path and never distributes an APK.
 *
 * The `beforeinstallprompt` event can fire before React mounts, so we capture it
 * at module-eval time (imported early from main.tsx) and expose it via an
 * external store that components subscribe to with `useInstallState`.
 */

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

export interface InstallState {
  /** Native install prompt is available right now (Android/desktop Chromium). */
  canPrompt: boolean
  /** `appinstalled` fired during this session. */
  installed: boolean
}

let deferred: BeforeInstallPromptEvent | null = null
let snapshot: InstallState = { canPrompt: false, installed: false }
const listeners = new Set<() => void>()

function commit(next: InstallState) {
  snapshot = next
  listeners.forEach(l => l())
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e: Event) => {
    // Stop Chrome's default mini-infobar so we own when the prompt shows.
    e.preventDefault()
    deferred = e as BeforeInstallPromptEvent
    commit({ ...snapshot, canPrompt: true })
  })
  window.addEventListener('appinstalled', () => {
    deferred = null
    commit({ canPrompt: false, installed: true })
  })
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb)
  return () => { listeners.delete(cb) }
}

function getSnapshot(): InstallState {
  return snapshot
}

/** Reactively read install availability. */
export function useInstallState(): InstallState {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}

/** Fire the native install prompt. Resolves to the user's choice. */
export async function promptInstall(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
  if (!deferred) return 'unavailable'
  try {
    await deferred.prompt()
    const { outcome } = await deferred.userChoice
    // A prompt is single-use; drop it once resolved.
    deferred = null
    commit({ ...snapshot, canPrompt: false })
    return outcome
  } catch {
    return 'unavailable'
  }
}

/** True on iPhone/iPad (incl. iPadOS reporting itself as desktop Safari). */
export const isIOS: boolean = (() => {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent || ''
  const iDevice = /iPad|iPhone|iPod/.test(ua)
  const touchMac =
    navigator.platform === 'MacIntel' &&
    (navigator as unknown as { maxTouchPoints?: number }).maxTouchPoints !== undefined &&
    (navigator as unknown as { maxTouchPoints: number }).maxTouchPoints > 1
  return iDevice || touchMac
})()

/** True when running as the installed standalone app (any platform). */
export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia?.('(display-mode: standalone)').matches === true ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  )
}
