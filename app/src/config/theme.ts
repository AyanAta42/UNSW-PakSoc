// ─── Brand ───────────────────────────────────────────────────────────────────
import type { CSSProperties } from 'react'

export const ACCENT       = '#22C55E'
export const ACCENT_HOVER = '#16A34A'
export const ACCENT_GLOW  = '#4ADE80'
export const ACCENT_TEXT  = '#FFFFFF'

// ─── Backgrounds ─────────────────────────────────────────────────────────────
export const PALETTE = {
  page:    '#030303',
  navbar:  '#050505',
  navbarGlass: 'rgba(8, 8, 8, 0.42)',
  card:    '#0A0A0A',
  cardAlt: '#070707',
  modal:   '#0C0C0C',
  input:   '#080808',

  // Borders
  border:       '#1C1C1C',
  borderHover:  '#2E2E2E',
  borderActive: '#22C55E',

  // Text
  dark:     '#F8FAFC',
  secondary:'#CBD5E1',
  muted:    '#94A3B8',
  disabled: '#64748B',

  // Shadows — giant, soft, faintly emerald-tinted for depth (Apple/Linear feel)
  shadowSm: '0 8px 24px -8px rgba(0,0,0,0.5), 0 2px 10px rgba(6,20,12,0.35)',
  shadowMd: '0 22px 50px -16px rgba(0,0,0,0.55), 0 6px 20px rgba(8,30,18,0.32)',
  shadowLg: '0 40px 90px -24px rgba(0,0,0,0.6), 0 12px 40px rgba(10,40,24,0.3)',
  shadowGreen: '0 0 60px rgba(34,197,94,0.14)',
  shadow:   '0 8px 24px -8px rgba(0,0,0,0.5), 0 2px 10px rgba(6,20,12,0.35)',

  // Radius (as CSS strings for style props)
  radiusBtn:   '14px',
  radiusCard:  '18px',
  radiusInput: '12px',
  radiusModal: '24px',
} as const

/** PWA status bar / browser chrome — must match the glass navbar. */
export const PWA_THEME_COLOR = PALETTE.navbar

/** Fully transparent navbar — ambient animation shows through with no divider. */
export const GLASS_NAV: CSSProperties = {
  background: 'transparent',
}

/** Secondary glass surface for nav buttons / chips. */
export const GLASS_CHIP: CSSProperties = {
  background: 'rgba(255, 255, 255, 0.06)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
}
