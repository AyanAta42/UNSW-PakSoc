import { ACCENT } from '@/config/theme'

interface Props {
  label:     string
  url?:      string
  variant:   'outline' | 'filled'
  className?: string
}

export function EventCtaButton({ label, url, variant, className = '' }: Props) {
  const style = variant === 'outline'
    ? { border: `1.5px solid ${ACCENT}`, color: ACCENT, background: '#fff' }
    : { background: '#C8FF00', color: '#111827' }

  const cls = `${className} flex items-center justify-center rounded-xl font-bold no-underline transition-opacity`

  if (url?.trim()) {
    return (
      <a href={url.trim()} target="_blank" rel="noopener noreferrer" style={style} className={`${cls} hover:opacity-85 active:scale-[0.98]`}>
        {label}
      </a>
    )
  }

  return <span style={style} className={`${cls} cursor-default`}>{label}</span>
}
