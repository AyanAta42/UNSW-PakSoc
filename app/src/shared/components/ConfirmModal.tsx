import { PALETTE } from '@/config/theme'
import { useScrollLock } from '@/shared/hooks/useScrollLock'

interface Props {
  title:         string
  message:       string
  warning?:      string
  confirmLabel?: string
  danger?:       boolean
  onConfirm:     () => void
  onCancel:      () => void
}

export function ConfirmModal({ title, message, warning, confirmLabel = 'Confirm', danger = false, onConfirm, onCancel }: Props) {
  useScrollLock()
  return (
    <div className="motion-backdrop fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4" onClick={onCancel}>
      <div style={{ background: PALETTE.modal, border: `1px solid ${PALETTE.border}`, borderRadius: 24, boxShadow: PALETTE.shadowLg }}
        className="motion-modal w-full max-w-sm p-6 flex flex-col gap-4" onClick={e => e.stopPropagation()}>

        <div className="flex flex-col gap-1.5">
          <h3 className="m-0 text-base font-extrabold" style={{ color: PALETTE.dark }}>{title}</h3>
          <p className="m-0 text-sm leading-relaxed" style={{ color: PALETTE.muted }}>{message}</p>
        </div>

        {warning && (
          <div className="px-4 py-3 flex gap-3 items-start"
            style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.25)', borderRadius: 12 }}>
            <span className="text-amber-400 text-lg leading-none mt-0.5 shrink-0">⚠</span>
            <p className="m-0 text-sm font-semibold leading-relaxed" style={{ color: '#FCD34D' }}>{warning}</p>
          </div>
        )}

        <div className="flex gap-2.5">
          <button onClick={onCancel}
            style={{ border: `1px solid ${PALETTE.border}`, color: PALETTE.secondary, background: 'transparent', borderRadius: 14 }}
            className="flex-1 py-2.5 text-sm font-semibold cursor-pointer hover:bg-white/5 transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm}
            style={{ background: danger ? '#EF4444' : '#22C55E', color: '#fff', borderRadius: 14, boxShadow: danger ? '0 0 20px rgba(239,68,68,0.3)' : '0 0 20px rgba(34,197,94,0.3)' }}
            className="flex-1 py-2.5 text-sm font-bold border-none cursor-pointer hover:opacity-85 transition-opacity">
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
