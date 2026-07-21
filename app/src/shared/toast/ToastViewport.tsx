import { useEffect, useRef, useState } from 'react'
import type { TouchEvent as ReactTouchEvent } from 'react'
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

const SWIPE_DISMISS = 44

function ToastCard({ item }: { item: ToastItem }) {
  const [leaving, setLeaving]       = useState(false)
  const [dragY, setDragY]           = useState(0)
  const [dragging, setDragging]     = useState(false)
  const [interacted, setInteracted] = useState(false)
  const startY = useRef<number | null>(null)
  const moved  = useRef(false)

  useEffect(() => {
    const leaveDelay = Math.max(item.duration - 220, 0)
    const leaveTimer  = window.setTimeout(() => setLeaving(true), leaveDelay)
    const removeTimer = window.setTimeout(() => toast.dismiss(item.id), item.duration)
    return () => { window.clearTimeout(leaveTimer); window.clearTimeout(removeTimer) }
  }, [item.id, item.duration])

  function onTouchStart(e: ReactTouchEvent) {
    startY.current = e.touches[0].clientY
    moved.current  = false
    setDragging(true)
  }

  function onTouchMove(e: ReactTouchEvent) {
    if (startY.current === null) return
    const delta = e.touches[0].clientY - startY.current
    if (delta > 0) { setDragY(0); return }   // only track upward drag
    if (delta < -4) { moved.current = true; setInteracted(true) }
    setDragY(delta)
  }

  function onTouchEnd(e: ReactTouchEvent) {
    if (startY.current === null) return
    const delta = e.changedTouches[0].clientY - startY.current
    startY.current = null
    setDragging(false)
    if (delta < -SWIPE_DISMISS) {
      setDragY(-180)   // slide up out, then remove
      window.setTimeout(() => toast.dismiss(item.id), 180)
    } else {
      setDragY(0)      // spring back
    }
  }

  function onClick() {
    if (moved.current) { moved.current = false; return }  // swipe, not a tap
    toast.dismiss(item.id)
  }

  return (
    <div
      role="status"
      onClick={onClick}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      className={`pointer-events-auto relative overflow-hidden flex items-center gap-2.5 pl-3 pr-4 py-2.5 cursor-pointer w-full max-w-[340px] ${leaving ? 'motion-toast-out' : interacted ? '' : 'motion-toast-in'}`}
      style={{
        background: PALETTE.modal,
        border: `1px solid ${PALETTE.border}`,
        borderRadius: 14,
        boxShadow: `${PALETTE.shadowMd}, 0 0 24px ${GLOW[item.variant]}`,
        touchAction: 'none',
        ...(interacted && {
          transform:  `translateY(${dragY}px)`,
          opacity:    Math.max(0, 1 + dragY / 90),
          transition: dragging ? 'none' : 'transform 200ms cubic-bezier(0.4,0,1,1), opacity 200ms ease',
        }),
      }}
    >
      <ToastIcon variant={item.variant} />
      <div className="min-w-0 flex-1">
        <p className="m-0 text-[13px] font-bold leading-snug truncate" style={{ color: PALETTE.dark }}>{item.title}</p>
        {item.description && (
          <p className="m-0 text-[11px] leading-snug mt-0.5 line-clamp-2" style={{ color: PALETTE.muted }}>{item.description}</p>
        )}
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
