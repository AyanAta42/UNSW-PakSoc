export type ToastVariant = 'success' | 'error' | 'info'

export interface ToastItem {
  id:          string
  variant:     ToastVariant
  title:       string
  description?: string
  duration:    number
}

type Listener = (toasts: ToastItem[]) => void

let toasts: ToastItem[] = []
const listeners = new Set<Listener>()

function emit() {
  for (const l of listeners) l(toasts)
}

function push(variant: ToastVariant, title: string, description?: string, duration = 3000): string {
  const id = `t_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  // Cap the stack so a burst of actions (e.g. batch deletes) can't wall the screen
  toasts = [...toasts.slice(-2), { id, variant, title, description, duration }]
  emit()
  return id
}

function dismiss(id: string) {
  if (!toasts.some(t => t.id === id)) return
  toasts = toasts.filter(t => t.id !== id)
  emit()
}

export const toast = {
  success: (title: string, description?: string) => push('success', title, description, 3000),
  error:   (title: string, description?: string) => push('error', title, description, 4000),
  info:    (title: string, description?: string) => push('info', title, description, 3000),
  dismiss,
}

export function subscribeToasts(listener: Listener): () => void {
  listeners.add(listener)
  listener(toasts)
  return () => listeners.delete(listener)
}

/** Best-effort message for a caught error — mirrors the pattern used across the app's try/catch blocks. */
export function errorMessage(e: unknown, fallback: string): string {
  return e instanceof Error && e.message ? e.message : fallback
}
