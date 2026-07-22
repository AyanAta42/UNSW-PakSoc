/**
 * Warm up the network path to Google Maps' embed hosts so the first map iframe
 * paints faster. Pre-establishing DNS + TLS to these origins shaves the connection
 * setup (often 100–300ms on mobile) off the initial embed load. Runs once.
 */
const MAP_ORIGINS = [
  'https://www.google.com',
  'https://maps.google.com',
  'https://maps.gstatic.com',
  'https://maps.googleapis.com',
  'https://khms0.googleapis.com',
  'https://khms1.googleapis.com',
]

let done = false

export function preconnectMaps(): void {
  if (done || typeof document === 'undefined') return
  done = true
  for (const href of MAP_ORIGINS) {
    const link = document.createElement('link')
    link.rel = 'preconnect'
    link.href = href
    link.crossOrigin = 'anonymous'
    document.head.appendChild(link)
  }
}
