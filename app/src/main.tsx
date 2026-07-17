import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { getCachedPublicEvents, prefetchPublicEvents } from '@/events/services/publicEventsBootstrap'

declare global {
  interface Window {
    __PAKSOC_STOP_BOOT__?: () => void
    __PAKSOC_REVEAL_APP__?: () => void
    __PAKSOC_SHELL_READY__?: boolean
  }
}

/**
 * Mount React into a hidden #root.
 * On "/" the HTML shell stays visible forever (live timer + buttons).
 * React only takes over when navigating to another route.
 */
async function start() {
  const cached = getCachedPublicEvents()
  if (!cached?.length) {
    try {
      await prefetchPublicEvents()
    } catch {
      /* shell may still be interactive */
    }
  } else {
    void prefetchPublicEvents()
  }

  const rootEl = document.getElementById('root')
  if (!rootEl) return
  rootEl.hidden = true

  let revealed = false
  window.__PAKSOC_REVEAL_APP__ = () => {
    if (revealed) return
    // Homepage keeps the live HTML shell — never swap it for React
    if (window.location.pathname === '/' || window.location.pathname === '') return
    revealed = true
    window.__PAKSOC_STOP_BOOT__?.()
  }

  ReactDOM.createRoot(rootEl).render(<App />)
}

void start()
