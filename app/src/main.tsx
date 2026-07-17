import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { prefetchPublicEvents } from '@/events/services/publicEventsBootstrap'

// Start / adopt the early events fetch — shared via PublicEventsProvider
void prefetchPublicEvents()

ReactDOM.createRoot(document.getElementById('root')!).render(<App />)
