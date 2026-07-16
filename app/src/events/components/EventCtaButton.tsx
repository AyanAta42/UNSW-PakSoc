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
    const target = e.currentTarget as HTMLElement
    target.style.transform = 'scale(1.02)'
    if (isPrimary) {
      target.style.background = ACCENT_HOVER
      target.style.boxShadow = '0 0 36px rgba(34,197,94,0.42)'
    } else {
      target.style.background = 'rgba(255,255,255,0.06)'
      target.style.borderColor = '#FFFFFF'
    }
  }
  const handleMouseLeave = (e: React.MouseEvent<HTMLElement>) => {
    const target = e.currentTarget as HTMLElement
    target.style.transform = 'scale(1)'
    if (isPrimary) {
      target.style.background = ACCENT
      target.style.boxShadow = '0 0 30px rgba(34,197,94,0.35)'
    } else {
      target.style.background = 'transparent'
      target.style.borderColor = 'rgba(229,231,235,0.5)'
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
