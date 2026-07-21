import { useNavigate } from 'react-router-dom'
import { PALETTE } from '@/config/theme'

/** Circular home-icon nav button — replaces the old "← Home" text link. */
export function HomeButton({ className = '' }: { className?: string }) {
  const navigate = useNavigate()
  return (
    <button
      onClick={() => navigate('/')}
      aria-label="Home"
      title="Home"
      style={{ color: PALETTE.muted, border: `1px solid ${PALETTE.border}`, background: 'rgba(255,255,255,0.04)' }}
      className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 cursor-pointer hover:text-green-400 hover:border-green-500/40 transition-colors ${className}`}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px]">
        <path d="M3 10.5 12 3l9 7.5" />
        <path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5" />
      </svg>
    </button>
  )
}
