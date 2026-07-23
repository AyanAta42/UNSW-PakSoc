import { useState } from 'react'
import { createPortal } from 'react-dom'
import { ACCENT, PALETTE } from '@/config/theme'
import { toast } from '@/shared/toast/toast'
import {
  androidNeedsChrome,
  chromeIntentUrl,
  isAndroid,
  isIOS,
  isStandalone,
  promptInstall,
  useInstallState,
} from './installPrompt'

const DownloadIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0">
    <path d="M12 3v12" />
    <path d="m7 11 5 5 5-5" />
    <path d="M4 20h16" />
  </svg>
)

const ShareIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 15V3" />
    <path d="m8 7 4-4 4 4" />
    <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" />
  </svg>
)

const AddIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="3" width="18" height="18" rx="4" />
    <path d="M12 8v8M8 12h8" />
  </svg>
)

const MenuIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="5" r="1.4" /><circle cx="12" cy="12" r="1.4" /><circle cx="12" cy="19" r="1.4" />
  </svg>
)

const CheckIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m5 12 5 5L20 7" />
  </svg>
)

// Concentric "browser" glyph — stands in for "open in Chrome" without shipping a
// trademarked multi-colour logo.
const BrowserIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="3.4" />
    <path d="M12 8.6h8.2M9.1 13.5 5 20.5M14.9 13.5 19 20.5" />
  </svg>
)

const OpenIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0">
    <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
  </svg>
)

interface Step { icon: React.ReactNode; text: React.ReactNode }

const IOS_STEPS: Step[] = [
  { icon: <ShareIcon />, text: <>Tap the <b>Share</b> button in your browser's toolbar.</> },
  { icon: <AddIcon />,   text: <>Scroll down and choose <b>Add to Home Screen</b>.</> },
  { icon: <CheckIcon />, text: <>Tap <b>Add</b> — PakSoc lands on your home screen.</> },
]

const FALLBACK_STEPS: Step[] = [
  { icon: <MenuIcon />,     text: <>Open your browser's menu <b>( ⋮ )</b>.</> },
  { icon: <DownloadIcon />, text: <>Tap <b>Install app</b> or <b>Add to Home screen</b>.</> },
  { icon: <CheckIcon />,    text: <>Confirm <b>Install</b> — that's it, no warnings.</> },
]

// Galaxy phones default to Samsung Internet, whose install is falsely flagged by
// Play Protect ("unsafe app / older version of Android"). Chrome installs clean.
const CHROME_STEPS: Step[] = [
  { icon: <BrowserIcon />,  text: <>Tap <b>Open in Chrome</b> below (or open the <b>Chrome</b> app on this page).</> },
  { icon: <DownloadIcon />, text: <>In Chrome, tap <b>( ⋮ )</b> → <b>Install app</b> / <b>Add to Home screen</b>.</> },
  { icon: <CheckIcon />,    text: <>Confirm <b>Install</b> — no warning this time.</> },
]

type SheetVariant = 'ios' | 'chrome' | 'fallback'

function InstallSheet({ variant, onClose }: { variant: SheetVariant; onClose: () => void }) {
  const isChrome = variant === 'chrome'
  const steps = variant === 'ios' ? IOS_STEPS : isChrome ? CHROME_STEPS : FALLBACK_STEPS
  const title = isChrome ? 'Install with Chrome' : 'Install PakSoc'
  const subtitle = isChrome ? 'Skips Samsung’s false warning' : 'Full-screen app, works offline'

  return createPortal(
    <div className="motion-backdrop fixed inset-0 z-[120] flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center"
      onClick={onClose}>
      <div
        style={{
          background: PALETTE.modal,
          borderTop: `1px solid ${PALETTE.border}`,
          boxShadow: '0 -8px 60px rgba(0,0,0,0.6)',
        }}
        className="w-full sm:max-w-sm rounded-t-[24px] sm:rounded-[24px] sm:border px-5 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] flex flex-col animate-[slideUp_0.22s_ease-out]"
        onClick={e => e.stopPropagation()}>

        <div className="flex justify-center pt-1 pb-3 sm:hidden">
          <div className="w-10 h-1 rounded-full" style={{ background: PALETTE.border }} />
        </div>

        <div className="flex items-start justify-between gap-3 mb-1">
          <div className="flex items-center gap-3">
            <div style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.28)', color: ACCENT }}
              className="w-10 h-10 rounded-[13px] flex items-center justify-center shrink-0">
              {isChrome ? <BrowserIcon /> : <DownloadIcon />}
            </div>
            <div>
              <h3 className="m-0 text-base font-extrabold" style={{ color: PALETTE.dark }}>{title}</h3>
              <p className="m-0 text-xs" style={{ color: PALETTE.muted }}>{subtitle}</p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Close"
            style={{ color: PALETTE.muted, border: `1px solid ${PALETTE.border}`, background: PALETTE.cardAlt, borderRadius: '50%' }}
            className="w-8 h-8 flex items-center justify-center text-lg leading-none cursor-pointer hover:border-white/30 transition-colors shrink-0">×</button>
        </div>

        {isChrome && (
          <p className="m-0 mt-3 text-xs leading-relaxed" style={{ color: PALETTE.secondary }}>
            Samsung Internet tags new home-screen apps with a false <b>“unsafe app”</b> warning.
            Installing from <b>Chrome</b> avoids it completely.
          </p>
        )}

        <ol className="list-none m-0 p-0 mt-4 flex flex-col gap-3">
          {steps.map((s, i) => (
            <li key={i} className="flex items-center gap-3">
              <span style={{ background: PALETTE.cardAlt, border: `1px solid ${PALETTE.border}`, color: ACCENT }}
                className="w-9 h-9 rounded-full flex items-center justify-center shrink-0">
                {s.icon}
              </span>
              <span className="text-sm leading-snug" style={{ color: PALETTE.secondary }}>
                <span style={{ color: PALETTE.disabled }} className="font-bold mr-1">{i + 1}.</span>{s.text}
              </span>
            </li>
          ))}
        </ol>

        {isIOS && variant === 'ios' && (
          <p className="m-0 mt-4 text-xs leading-relaxed" style={{ color: PALETTE.disabled }}>
            Opened from Instagram or another app? Tap <b>•••</b> → <b>Open in Browser</b> first, then follow the steps.
          </p>
        )}

        {isChrome && (
          <p className="m-0 mt-4 text-xs leading-relaxed" style={{ color: PALETTE.disabled }}>
            Rather not switch? PakSoc is completely safe — that warning is a known Samsung glitch, so
            tapping <b>Install anyway</b> is fine too.
          </p>
        )}

        {isChrome ? (
          <a href={chromeIntentUrl()} onClick={onClose}
            style={{ background: ACCENT, color: '#fff', borderRadius: 14, boxShadow: '0 0 20px rgba(34,197,94,0.3)' }}
            className="mt-5 w-full py-3 text-sm font-bold no-underline flex items-center justify-center gap-2 cursor-pointer hover:opacity-85 transition-opacity">
            <OpenIcon /> Open in Chrome
          </a>
        ) : (
          <button onClick={onClose}
            style={{ background: ACCENT, color: '#fff', borderRadius: 14, boxShadow: '0 0 20px rgba(34,197,94,0.3)' }}
            className="mt-5 w-full py-3 text-sm font-bold border-none cursor-pointer hover:opacity-85 transition-opacity">
            Got it
          </button>
        )}
      </div>
    </div>,
    document.body,
  )
}

export function InstallAppButton() {
  const { canPrompt } = useInstallState()
  const [sheet, setSheet] = useState<SheetVariant | null>(null)

  // Only hide once we're actually *running inside* the installed app. On the
  // website the button always stays — signed in or not, already installed or not.
  if (isStandalone()) return null

  async function handleClick() {
    // Android browsers other than Chrome (Samsung Internet, in-app webviews,
    // Firefox…) mint a WebAPK that Google Play Protect falsely flags as unsafe.
    // Steer them to Chrome — whose install is clean — instead of firing their
    // own (flag-producing) prompt, even when `canPrompt` is true.
    if (androidNeedsChrome) {
      setSheet('chrome')
      return
    }
    // Chrome / desktop Chromium: this native prompt installs a real WebAPK — no
    // Chrome-badge shortcut. Android's final confirm is labelled "Add to Home
    // screen"; desktop just installs.
    if (canPrompt) {
      const outcome = await promptInstall()
      if (outcome === 'accepted') {
        if (isAndroid) toast.success('Click "Add to Home Screen"', 'Confirm it to finish adding PakSoc.')
        else toast.success('Installing PakSoc…', 'Find it in your apps.')
      } else if (outcome === 'unavailable') {
        setSheet(isIOS ? 'ios' : 'fallback')
      }
      return
    }
    // iOS, or a browser that hasn't offered the prompt → guided instructions.
    setSheet(isIOS ? 'ios' : 'fallback')
  }

  return (
    <>
      <button onClick={handleClick} data-cta
        aria-label="Install app" title="Install app"
        style={{
          background: 'rgba(34,197,94,0.10)',
          border: '1px solid rgba(34,197,94,0.30)',
          color: ACCENT,
          boxShadow: '0 0 18px rgba(34,197,94,0.16)',
        }}
        className="motion-primary flex items-center justify-center gap-1.5 shrink-0 cursor-pointer hover:bg-[rgba(34,197,94,0.18)] transition-colors font-bold text-xs whitespace-nowrap w-9 h-9 rounded-full md:w-auto md:h-auto md:px-4 md:py-1.5 md:rounded-[14px]">
        <DownloadIcon />
        <span className="hidden md:inline">Install App</span>
      </button>
      {sheet && <InstallSheet variant={sheet} onClose={() => setSheet(null)} />}
    </>
  )
}
