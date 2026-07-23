import { useState, useEffect, useRef } from 'react'
import type { Interaction } from '@/interactions/types/Interaction'
import { formatRelativeTime } from '@/shared/utils/formatRelativeTime'
import { HistoryIcon } from '@/interactions/components/HistoryIcon'
import { ACCENT, PALETTE } from '@/config/theme'

interface Props {
  title:         string
  onClose:       () => void
  fetcher:       () => Promise<Interaction[]>
  emptyMessage?: string
}

/** Google-Docs-style version-history drawer: slides in from the right, fetches fresh on every open. */
export function HistoryPanel({ title, onClose, fetcher, emptyMessage = 'No activity yet.' }: Props) {
  const [items,   setItems]   = useState<Interaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')
  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher

  useEffect(() => {
    let alive = true
    setLoading(true)
    fetcherRef.current()
      .then(rows => { if (alive) setItems(rows) })
      .catch(e => { if (alive) setError(e instanceof Error ? e.message : 'Failed to load history.') })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [])

  return (
    <div className="motion-backdrop fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div onClick={e => e.stopPropagation()}
        className="motion-panel absolute top-0 right-0 h-full w-full max-w-sm flex flex-col"
        style={{ background: PALETTE.modal, borderLeft: `1px solid ${PALETTE.border}`, boxShadow: PALETTE.shadowLg }}>

        <div className="px-5 pt-[calc(env(safe-area-inset-top)+1rem)] pb-4 flex items-center justify-between shrink-0" style={{ borderBottom: `1px solid ${PALETTE.border}` }}>
          <div className="flex items-center gap-2.5">
            <span style={{ color: ACCENT }}><HistoryIcon size={17} /></span>
            <h2 className="m-0 text-[15px] font-extrabold" style={{ color: PALETTE.dark }}>{title}</h2>
          </div>
          <button onClick={onClose}
            style={{ color: PALETTE.muted, background: PALETTE.cardAlt, border: `1px solid ${PALETTE.border}`, borderRadius: '50%' }}
            className="w-8 h-8 flex items-center justify-center text-lg cursor-pointer hover:border-white/30 transition-colors shrink-0">×</button>
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar px-5 pt-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          {loading && (
            <div className="flex flex-col gap-3">
              {[1, 2, 3, 4].map(i => <div key={i} className="motion-skeleton h-14" style={{ borderRadius: 14, border: `1px solid ${PALETTE.border}` }} />)}
            </div>
          )}

          {!loading && error && (
            <div className="px-3.5 py-2.5 text-sm" style={{ background: 'rgba(239,68,68,0.1)', color: '#F87171', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 12 }}>{error}</div>
          )}

          {!loading && !error && items.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center gap-2">
              <span style={{ color: PALETTE.disabled }}><HistoryIcon size={28} /></span>
              <div className="text-sm font-semibold" style={{ color: PALETTE.muted }}>{emptyMessage}</div>
            </div>
          )}

          {!loading && !error && items.length > 0 && (
            <ol className="list-none m-0 p-0 flex flex-col">
              {items.map((it, i) => (
                <li key={it.id} className="relative pl-6" style={{ paddingBottom: i === items.length - 1 ? 0 : 20 }}>
                  {i !== items.length - 1 && (
                    <span className="absolute left-[6.5px] top-4 bottom-0 w-px" style={{ background: PALETTE.border }} />
                  )}
                  <span className="absolute left-0 top-1 w-3.5 h-3.5 rounded-full" style={{ background: PALETTE.card, border: `2px solid ${ACCENT}` }} />
                  <div className="text-sm leading-snug break-words" style={{ color: PALETTE.secondary, overflowWrap: 'anywhere' }}>
                    <span className="font-bold" style={{ color: PALETTE.dark }}>{it.actor_name}</span>{' '}{it.summary}
                  </div>
                  <div className="text-[11px] mt-1" style={{ color: PALETTE.disabled }}>{formatRelativeTime(it.created_at)}</div>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  )
}
