import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { prefetchPublicEvents } from '@/events/services/publicEventsBootstrap'

// Warm DNS/TLS for the events API before auth/supabase-js loads
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
if (supabaseUrl && typeof document !== 'undefined') {
  for (const rel of ['preconnect', 'dns-prefetch'] as const) {
    const link = document.createElement('link')
    link.rel = rel
    link.href = supabaseUrl
    if (rel === 'preconnect') link.crossOrigin = 'anonymous'
    document.head.appendChild(link)
  }
}

// Start the events request immediately — don't wait for React to mount
void prefetchPublicEvents()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
