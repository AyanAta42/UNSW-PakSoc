const FALLBACK: Record<string, string> = {
  raunaq: '/raunaq.webp',
  khel:   '/khel.webp',
  iftar:  '/iftar.webp',
  cricket:'/cricket.webp',
}

/** Returns the event's uploaded image URL or a keyword-matched fallback. */
export function eventImageUrl(ev: { name: string; image_url?: string }): string | null {
  if (ev.image_url) return ev.image_url
  const key = Object.keys(FALLBACK).find(k => ev.name.toLowerCase().includes(k))
  return key ? FALLBACK[key] : null
}
