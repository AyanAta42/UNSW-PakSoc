import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { prefetchPublicEvents } from '@/events/services/publicEventsBootstrap'

// Start / adopt the early events fetch — shared via PublicEventsProvider
void prefetchPublicEvents()

ReactDOM.createRoot(document.getElementById('root')!).render(<App />)

// Register the service worker after first paint so it never delays the UI.
// Precaches the app shell + images; subsequent opens are served entirely from cache.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    void import('virtual:pwa-register').then(({ registerSW }) => registerSW({ immediate: true }))
  })
}
