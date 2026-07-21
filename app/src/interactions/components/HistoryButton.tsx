import { HistoryIcon } from '@/interactions/components/HistoryIcon'
import { PALETTE }     from '@/config/theme'

interface Props { onClick: () => void; label?: string }

/** Page-level "view history" trigger — opens a HistoryPanel. */
export function HistoryButton({ onClick, label = 'View history' }: Props) {
  return (
    <button onClick={onClick} aria-label={label} title={label}
      style={{ color: PALETTE.muted, background: 'transparent', borderRadius: 10, border: `1px solid ${PALETTE.border}` }}
      className="w-8 h-8 flex items-center justify-center cursor-pointer hover:text-green-400 hover:border-green-500/40 hover:bg-white/5 transition-all shrink-0">
      <HistoryIcon size={16} />
    </button>
  )
}
