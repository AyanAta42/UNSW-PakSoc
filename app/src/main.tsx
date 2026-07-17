import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { getCachedPublicEvents, prefetchPublicEvents } from '@/events/services/publicEventsBootstrap'

/**
 * Mount ASAP. Boot shell already has live timer + popups.
 * Prefer cache so we never block the interactive React handoff on network.
 */
async function start() {
  const cached = getCachedPublicEvents()
  if (!cached?.length) {
    try {
      await prefetchPublicEvents()
    } catch {
      /* boot shell may still be showing data */
    }
  } else {
    void prefetchPublicEvents()
  }
  window.__PAKSOC_STOP_BOOT__?.()
  ReactDOM.createRoot(document.getElementById('root')!).render(<App />)
}

void start()
