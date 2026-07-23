import { useSyncExternalStore } from 'react'
import { toast } from '@/shared/toast/toast'

/**
 * PWA install orchestration.
 *
 * IMPORTANT — this is what actually fixes the "Google Play Protect · Unsafe app
 * blocked / built for an older version of Android" warning. It does NOT come
 * from installing a PWA the normal way; it comes from an Android install whose
 * WebAPK targets an old SDK. Two sources produce that:
 *   1. Side-loading a generated *.apk (PWABuilder / Bubblewrap / a "website to
 *      APK" service) whose targetSdkVersion is too old. We never distribute one.
 *   2. Installing from **Samsung Internet** — the default browser on Galaxy
 *      phones (S24, etc.). Its minted WebAPK is falsely flagged by Play Protect;
 *      a long-standing Samsung bug. Chrome's WebAPK is never flagged.
 *
 * We can't set the WebAPK's target SDK — Google mints it, not our build. So the
 * clean path is the browser's own install, and on Android we steer non-Chrome
 * browsers to Chrome (`androidNeedsChrome` / `chromeIntentUrl`, used by
 * InstallAppButton). On iOS it's Share ▸ Add to Home Screen.
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
    // Fires the instant the WebAPK/PWA is actually installed — the accurate
    // moment to confirm it, with no "Add to Home screen" follow-up to chase.
    toast.success('App Installed', 'PakSoc is ready on your home screen.')
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

/** UA string, read once. */
const UA: string = typeof navigator !== 'undefined' ? navigator.userAgent || '' : ''

/** Running on Android. */
export const isAndroid: boolean = /Android/i.test(UA)

/** Samsung's built-in browser — the Galaxy default; its WebAPK is Play-Protect-flagged. */
export const isSamsungInternet: boolean = /SamsungBrowser/i.test(UA)

/**
 * In-app webviews (Instagram, Facebook, TikTok, Snapchat, in-app Google, generic
 * `; wv`). These can't install a PWA at all, so on Android they must be kicked
 * out to Chrome first.
 */
export const isInAppBrowser: boolean =
  /(FBAN|FB_IAB|FBAV|Instagram|Line\/|Snapchat|TikTok|musical_ly|GSA\/|; wv\))/i.test(UA)

/**
 * Real Chrome on Android — the one browser whose WebAPK install is never flagged
 * by Play Protect. Excludes Samsung Internet, Edge, Opera, etc. (they all carry
 * "Chrome" in their UA but mint differently, or not at all) and in-app webviews.
 */
export const isAndroidChrome: boolean =
  isAndroid &&
  /Chrome\/\d/i.test(UA) &&
  !/SamsungBrowser|EdgA|OPR\/|OPT\/|UCBrowser|DuckDuckGo|YaBrowser|MiuiBrowser|HeyTap/i.test(UA) &&
  !isInAppBrowser

/**
 * The current Android browser will produce a Play-Protect-flagged install
 * (Samsung Internet, an in-app webview, Firefox…). These users get steered to
 * Chrome, whose WebAPK installs cleanly. False on iOS and desktop.
 */
export const androidNeedsChrome: boolean = isAndroid && !isAndroidChrome

/**
 * An Android `intent://` URL that reopens the current page in Chrome, falling
 * back to plain https if Chrome is somehow absent. Tapping a link with this href
 * hands the user to Chrome, where the install mints a clean, unflagged WebAPK.
 */
export function chromeIntentUrl(): string {
  if (typeof window === 'undefined') return '/'
  const { host, pathname, search } = window.location
  const httpsUrl = `https://${host}${pathname}${search}`
  return (
    `intent://${host}${pathname}${search}` +
    '#Intent;scheme=https;package=com.android.chrome;' +
    `S.browser_fallback_url=${encodeURIComponent(httpsUrl)};end`
  )
}

/** True when running as the installed standalone app (any platform). */
export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia?.('(display-mode: standalone)').matches === true ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  )
}
