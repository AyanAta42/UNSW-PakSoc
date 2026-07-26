import { ACCENT, ACCENT_TEXT, PALETTE } from '@/config/theme'

interface Props {
  label:      string
  url?:       string
  variant:    'primary' | 'secondary' | 'outline'
  className?: string
  /** Past-event sheets show the same CTAs for context, but they're stale — grayed out, no link. */
  disabled?:  boolean
}

/** primary = filled green  |  secondary = ghost white border  |  outline = legacy alias for secondary */
export function EventCtaButton({ label, url, variant, className = '', disabled = false }: Props) {
  const isPrimary = variant === 'primary'

  const baseStyle: React.CSSProperties = disabled
    ? { background: 'transparent', border: `1.5px solid ${PALETTE.border}`, color: PALETTE.disabled, borderRadius: 14 }
    : isPrimary
    ? { background: ACCENT, color: ACCENT_TEXT, borderRadius: 14 }
    : { background: 'transparent', border: '1.5px solid rgba(229,231,235,0.5)', color: '#F8FAFC', borderRadius: 14 }

  // Hover/active handled in CSS (transform/opacity) so reduced-motion can mute them —
  // dropped for `disabled` so a stale button doesn't hint at being interactive.
  const cls = [
    className,
    disabled ? '' : isPrimary ? 'motion-primary motion-cta-primary' : 'motion-cta-secondary',
    'motion-cta flex items-center justify-center font-bold no-underline',
  ].filter(Boolean).join(' ')

  if (!disabled && url?.trim()) {
    return (
      <a href={url.trim()} target="_blank" rel="noopener noreferrer"
        data-cta={isPrimary ? '' : undefined}
        style={baseStyle} className={cls}>
        {label}
      </a>
    )
  }
  return (
    <span data-cta={isPrimary ? '' : undefined} aria-disabled={disabled}
      style={baseStyle} className={`${cls} cursor-default`}>
      {label}
    </span>
  )
}
