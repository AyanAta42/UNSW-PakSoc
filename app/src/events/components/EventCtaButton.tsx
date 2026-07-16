import { ACCENT, ACCENT_TEXT } from '@/config/theme'

interface Props {
  label:      string
  url?:       string
  variant:    'primary' | 'secondary' | 'outline'
  className?: string
}

/** primary = filled green  |  secondary = ghost white border  |  outline = legacy alias for secondary */
export function EventCtaButton({ label, url, variant, className = '' }: Props) {
  const isPrimary = variant === 'primary'

  const baseStyle: React.CSSProperties = isPrimary
    ? { background: ACCENT, color: ACCENT_TEXT, borderRadius: 14 }
    : { background: 'transparent', border: '1.5px solid rgba(229,231,235,0.5)', color: '#F8FAFC', borderRadius: 14 }

  // Hover/active handled in CSS (transform/opacity) so reduced-motion can mute them
  const cls = [
    className,
    isPrimary ? 'motion-primary motion-cta-primary' : 'motion-cta-secondary',
    'motion-cta flex items-center justify-center font-bold no-underline',
  ].filter(Boolean).join(' ')

  if (url?.trim()) {
    return (
      <a href={url.trim()} target="_blank" rel="noopener noreferrer"
        data-cta={isPrimary ? '' : undefined}
        style={baseStyle} className={cls}>
        {label}
      </a>
    )
  }
  return (
    <span data-cta={isPrimary ? '' : undefined} style={baseStyle} className={`${cls} cursor-default`}>
      {label}
    </span>
  )
}
