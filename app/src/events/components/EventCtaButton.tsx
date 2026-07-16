import { ACCENT, ACCENT_TEXT, ACCENT_HOVER } from '@/config/theme'

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
    ? { background: ACCENT, color: ACCENT_TEXT, boxShadow: '0 0 30px rgba(34,197,94,0.35)', borderRadius: 14 }
    : { background: 'transparent', border: '1.5px solid rgba(229,231,235,0.5)', color: '#F8FAFC', borderRadius: 14 }

  const cls = `${className} flex items-center justify-center font-bold no-underline transition-all`

  const handleMouseEnter = (e: React.MouseEvent<HTMLElement>) => {
    if (isPrimary) { (e.currentTarget as HTMLElement).style.background = ACCENT_HOVER }
    else {
      ;(e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'
      ;(e.currentTarget as HTMLElement).style.borderColor = '#FFFFFF'
    }
  }
  const handleMouseLeave = (e: React.MouseEvent<HTMLElement>) => {
    if (isPrimary) { (e.currentTarget as HTMLElement).style.background = ACCENT }
    else {
      ;(e.currentTarget as HTMLElement).style.background = 'transparent'
      ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(229,231,235,0.5)'
    }
  }

  if (url?.trim()) {
    return (
      <a href={url.trim()} target="_blank" rel="noopener noreferrer"
        style={baseStyle} className={`${cls} active:scale-[0.98]`}
        onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
        {label}
      </a>
    )
  }
  return (
    <span style={baseStyle} className={`${cls} cursor-default`}
      onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      {label}
    </span>
  )
}
