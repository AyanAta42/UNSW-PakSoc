import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { prefetchPublicEvents } from '@/events/services/publicEventsBootstrap'
import { installTopOverscrollLock } from '@/shared/utils/lockTopOverscroll'

// Start / adopt the early events fetch — shared via PublicEventsProvider
void prefetchPublicEvents()

// Restrict elastic overscroll at the top of every page (bottom bounce stays).
installTopOverscrollLock()

ReactDOM.createRoot(document.getElementById('root')!).render(<App />)

// Fade the boot splash out once the mounted app has actually painted —
// double rAF so we're past React's first commit, not just synchronously after render().
const loader = document.getElementById('app-loader')
if (loader) {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      loader.classList.add('app-loader-hide')
      window.setTimeout(() => loader.remove(), 340)
    })
  })
}

// Portrait lock for the installed PWA (Android honors it; ignored elsewhere)
const orientation = screen.orientation as { lock?: (o: string) => Promise<void> }
orientation?.lock?.('portrait-primary').catch(() => {})

// Register the service worker after first paint so it never delays the UI.
// Precaches the app shell + images; subsequent opens are served entirely from cache.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    void import('virtual:pwa-register').then(({ registerSW }) => registerSW({
      immediate: true,
      // autoUpdate + skipWaiting/clientsClaim (vite.config) means a new deploy is
      // adopted and reloaded automatically — users never reinstall or refresh by
      // hand. The browser only checks for a new SW on launch, though, so nudge it
      // for long-lived sessions: hourly, and whenever the app regains focus.
      onRegisteredSW(_swUrl, registration) {
        if (!registration) return
        setInterval(() => { void registration.update() }, 60 * 60 * 1000)
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') void registration.update()
        })
      },
    }))
  })
}
