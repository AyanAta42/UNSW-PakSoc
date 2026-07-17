// ─── Brand ───────────────────────────────────────────────────────────────────
import type { CSSProperties } from 'react'

export const ACCENT       = '#22C55E'
export const ACCENT_HOVER = '#16A34A'
export const ACCENT_GLOW  = '#4ADE80'
export const ACCENT_TEXT  = '#FFFFFF'

// ─── Backgrounds ─────────────────────────────────────────────────────────────
export const PALETTE = {
  page:    '#030408',
  navbar:  '#050505',
  navbarGlass: 'rgba(8, 8, 8, 0.42)',
  card:    '#0B0E0C',
  cardAlt: '#080B09',
  modal:   '#0D110E',
  input:   '#090C0A',

  // Borders
  border:       '#1D231F',
  borderHover:  '#2E3630',
  borderActive: '#22C55E',

  // Text
  dark:     '#F8FAFC',
  secondary:'#CBD5E1',
  muted:    '#94A3B8',
  disabled: '#64748B',

  // Shadows — inset top highlight (lifted glass edge) + deep soft drop so
  // surfaces float off the near-black page instead of blending into it
  shadowSm: 'inset 0 1px 0 rgba(255,255,255,0.045), 0 10px 28px -10px rgba(0,0,0,0.65), 0 3px 10px rgba(0,0,0,0.4)',
  shadowMd: 'inset 0 1px 0 rgba(255,255,255,0.05), 0 24px 55px -18px rgba(0,0,0,0.7), 0 8px 22px rgba(0,0,0,0.42), 0 0 44px rgba(16,95,58,0.1)',
  shadowLg: 'inset 0 1px 0 rgba(255,255,255,0.05), 0 44px 95px -26px rgba(0,0,0,0.75), 0 14px 42px rgba(0,0,0,0.48), 0 0 64px rgba(16,95,58,0.12)',
  shadowGreen: '0 0 60px rgba(34,197,94,0.14)',
  shadow:   'inset 0 1px 0 rgba(255,255,255,0.045), 0 10px 28px -10px rgba(0,0,0,0.65), 0 3px 10px rgba(0,0,0,0.4)',

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
