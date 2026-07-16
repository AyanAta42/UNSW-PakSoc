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

  // Shadows
  shadowSm: '0 4px 12px rgba(0,0,0,0.4)',
  shadowMd: '0 10px 30px rgba(0,0,0,0.5)',
  shadowLg: '0 20px 60px rgba(0,0,0,0.6)',
  shadowGreen: '0 0 40px rgba(34,197,94,0.18)',
  shadow:   '0 4px 12px rgba(0,0,0,0.4)',

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
