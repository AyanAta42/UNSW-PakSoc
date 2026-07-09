const FALLBACK: Record<string, string> = {
  raunaq: '/raunaq.png',
  khel: '/khel.png',
  iftar: '/iftar.png',
  cricket: '/cricket.png',
}

export function eventImageUrl(ev: { name: string; image_url?: string }) {
  if (ev.image_url) return ev.image_url
  const key = Object.keys(FALLBACK).find(k => ev.name.toLowerCase().includes(k))
  return key ? FALLBACK[key] : null
}
