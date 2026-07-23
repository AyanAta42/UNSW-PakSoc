import type { CSSProperties, ReactNode } from 'react'
import { AmbientBackground } from '@/shared/components/AmbientBackground'
import { PAGE_BG } from '@/config/theme'

interface Props {
  children:          ReactNode
  /** Extra classes for the outer full-height shell. */
  className?:        string
  /** Extra classes for the inner z-10 content wrapper (e.g. flex centering). */
  contentClassName?: string
  style?:            CSSProperties
  /** Freeze the ambient background — no drift/grain/dust (native, static feel). */
  still?:            boolean
}

/**
 * Full-height page shell with the shared ambient aurora behind z-10 content.
 * Mirrors the HomePage background so every route is visually consistent.
 * Content is lifted to `z-10` so it always sits above the fixed aurora layer.
 */
export function AuroraPage({ children, className = '', contentClassName = '', style, still = false }: Props) {
  return (
    <div
      className={`relative min-h-[100dvh] ${className}`}
      style={{ background: PAGE_BG, fontFamily: 'system-ui, sans-serif', ...style }}
    >
      <AmbientBackground still={still} />
      <div className={`relative z-10 ${contentClassName}`}>{children}</div>
    </div>
  )
}
