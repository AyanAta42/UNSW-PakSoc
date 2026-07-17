import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { prefetchPublicEvents } from '@/events/services/publicEventsBootstrap'

/**
 * Events were already prioritized by the HTML boot path.
 * Mount React only after we have (or fail) that data so we don't flash a dead UI.
 */
async function start() {
  try {
    await prefetchPublicEvents()
  } catch {
    /* boot shell / cache may still have data */
  }
  window.__PAKSOC_STOP_BOOT__?.()
  ReactDOM.createRoot(document.getElementById('root')!).render(<App />)
}

void start()
