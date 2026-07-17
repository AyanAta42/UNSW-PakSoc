import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { prefetchPublicEvents } from '@/events/services/publicEventsBootstrap'

// Adopt the head boot fetch (or start one if boot was skipped)
void prefetchPublicEvents()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
