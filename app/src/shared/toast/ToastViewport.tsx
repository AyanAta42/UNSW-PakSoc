import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { PALETTE } from '@/config/theme'
import { subscribeToasts, toast, type ToastItem, type ToastVariant } from './toast'

const ACCENT: Record<ToastVariant, string> = {
  success: '#22C55E',
  error:   '#EF4444',
  info:    '#8B5CF6',
}

const GLOW: Record<ToastVariant, string> = {
  success: 'rgba(34,197,94,0.22)',
  error:   'rgba(239,68,68,0.22)',
  info:    'rgba(139,92,246,0.22)',
}

function ToastIcon({ variant }: { variant: ToastVariant }) {
  const color = ACCENT[variant]
  return (
    <span className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center" style={{ background: `${color}22` }}>
      {variant === 'success' && (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
      )}
      {variant === 'error' && (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
      )}
      {variant === 'info' && (
        <svg width="3" height="10" viewBox="0 0 4 14" fill={color}><rect width="4" height="9" y="5" rx="1.5" /><rect width="4" height="4" rx="1.5" /></svg>
      )}
    </span>
  )
}

function ToastCard({ item }: { item: ToastItem }) {
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    const leaveDelay = Math.max(item.duration - 220, 0)
    const leaveTimer  = window.setTimeout(() => setLeaving(true), leaveDelay)
    const removeTimer = window.setTimeout(() => toast.dismiss(item.id), item.duration)
    return () => { window.clearTimeout(leaveTimer); window.clearTimeout(removeTimer) }
  }, [item.id, item.duration])

  return (
    <div
      role="status"
      onClick={() => toast.dismiss(item.id)}
      className={`pointer-events-auto relative overflow-hidden flex items-center gap-2.5 pl-3 pr-4 py-2.5 cursor-pointer w-full max-w-[340px] ${leaving ? 'motion-toast-out' : 'motion-toast-in'}`}
      style={{
        background: PALETTE.modal,
        border: `1px solid ${PALETTE.border}`,
        borderRadius: 14,
        boxShadow: `${PALETTE.shadowMd}, 0 0 24px ${GLOW[item.variant]}`,
      }}
    >
      <ToastIcon variant={item.variant} />
      <div className="min-w-0 flex-1">
        <p className="m-0 text-[13px] font-bold leading-snug truncate" style={{ color: PALETTE.dark }}>{item.title}</p>
        {item.description && (
          <p className="m-0 text-[11px] leading-snug mt-0.5 line-clamp-2" style={{ color: PALETTE.muted }}>{item.description}</p>
        )}
      </div>
      <div className="absolute left-0 right-0 bottom-0 h-[2px]" style={{ background: PALETTE.border }}>
        <div className="motion-toast-progress h-full" style={{ background: ACCENT[item.variant], animationDuration: `${item.duration}ms` }} />
      </div>
    </div>
  )
}

/** Mounted once at the app root. Toasts are pushed imperatively via `toast.success/error/info(...)`
 *  from anywhere — plain hooks, service callbacks, event handlers — no provider/context needed. */
export function ToastViewport() {
  const [items, setItems] = useState<ToastItem[]>([])

  useEffect(() => subscribeToasts(setItems), [])

  if (items.length === 0) return null

  return createPortal(
    <div
      aria-live="polite"
      className="fixed inset-x-0 z-[300] flex flex-col items-center gap-2 px-4 pointer-events-none"
      style={{ top: 'calc(env(safe-area-inset-top) + 12px)' }}
    >
      {items.map(item => <ToastCard key={item.id} item={item} />)}
    </div>,
    document.body,
  )
}
