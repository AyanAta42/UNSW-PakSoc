import { useState, useRef, useEffect } from 'react'
import { PALETTE } from '@/config/theme'

interface Props {
  myTasksOnly: boolean
  onChange:    (myTasksOnly: boolean) => void
  /** Offer the "My tasks" option — only meaningful when a user is signed in. */
  showMine?:   boolean
}

const FunnelIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="shrink-0">
    <path d="M3 5h18l-7 8v5l-4 2v-7L3 5z" />
  </svg>
)

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="shrink-0 text-[#4ADE80]">
    <path d="M20 6 9 17l-5-5" />
  </svg>
)

/** "Filters" dropdown — defaults to All; lets execs narrow to their own tasks. */
export function TaskFilterMenu({ myTasksOnly, onChange, showMine = true }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    const onKey  = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('pointerdown', onDown); document.removeEventListener('keydown', onKey) }
  }, [open])

  const active = myTasksOnly // a non-default filter is applied

  const options: { key: string; label: string; selected: boolean; select: () => void }[] = [
    { key: 'all', label: 'All tasks', selected: !myTasksOnly, select: () => { onChange(false); setOpen(false) } },
  ]
  if (showMine) options.push({ key: 'mine', label: 'My tasks', selected: myTasksOnly, select: () => { onChange(true); setOpen(false) } })

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        title="Filter tasks"
        style={active
          ? { color: '#4ADE80', background: 'rgba(34,197,94,0.10)', border: '1px solid rgba(34,197,94,0.45)' }
          : { color: PALETTE.muted, background: 'transparent', border: `1px solid ${PALETTE.border}` }}
        className="flex items-center gap-1.5 h-8 px-2.5 rounded-[10px] text-xs font-bold cursor-pointer hover:text-green-400 hover:border-green-500/40 transition-all"
      >
        <FunnelIcon />
        <span>Filters</span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-44 rounded-xl overflow-hidden z-50 animate-[modalIn_var(--motion-fast)_var(--motion-ease)]"
          style={{ background: PALETTE.modal, border: `1px solid ${PALETTE.border}`, boxShadow: PALETTE.shadowLg }}
        >
          <div className="px-3 pt-2.5 pb-1.5 text-[10px] font-bold uppercase tracking-wider" style={{ color: PALETTE.disabled }}>Show</div>
          {options.map(o => (
            <button
              key={o.key}
              role="menuitemradio"
              aria-checked={o.selected}
              onClick={o.select}
              style={{ color: o.selected ? PALETTE.dark : PALETTE.secondary }}
              className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 text-sm text-left cursor-pointer transition-colors ${o.selected ? 'bg-white/[0.05]' : 'hover:bg-white/[0.03]'}`}
            >
              <span className="font-semibold">{o.label}</span>
              {o.selected && <CheckIcon />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
