import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { prefetchPublicEvents } from '@/events/services/publicEventsBootstrap'

// Stop the pre-React countdown/shell timer; React takes over the UI
window.__PAKSOC_STOP_BOOT__?.()

void prefetchPublicEvents()

ReactDOM.createRoot(document.getElementById('root')!).render(<App />)
