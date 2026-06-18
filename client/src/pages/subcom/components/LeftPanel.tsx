import type { DragEvent } from 'react'
import type { Member } from '../data/types'
import { COMM_CFG, COMM_ORDER, initials } from '../data/config'

interface Props {
  members: Member[]
  loading: boolean
  onBack: () => void
  onDragStart: (e: DragEvent<HTMLDivElement>, memberId: string) => void
}

export function LeftPanel({ members, loading, onBack, onDragStart }: Props) {
  return (
    <aside className="w-[310px] shrink-0 flex flex-col overflow-hidden bg-white dark:bg-[#0D1610] border-r border-gray-200 dark:border-[#00FF66]/[.10]">
      <div className="p-5 border-b border-gray-200 dark:border-[#00FF66]/[.10] shrink-0">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[15px] font-extrabold text-paksoc-deep dark:text-[#D4FAE3]">Team Roster</span>
          <button onClick={onBack} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-[#00FF66]/[.07] text-paksoc-mid dark:text-[#00FF66] border border-gray-200 dark:border-[#00FF66]/[.20] cursor-pointer hover:bg-gray-200 dark:hover:bg-[#00FF66]/[.14] transition-colors">
            ← Back
          </button>
        </div>
        <p className="text-xs text-gray-400 dark:text-[#2B5C3C] m-0">⠿ Drag a card onto a task to assign</p>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {loading && (
          <div className="px-4 py-6 flex flex-col gap-3">
            {[1,2,3,4,5].map(i => <div key={i} className="h-9 rounded-lg bg-gray-100 dark:bg-[#00FF66]/[.04] animate-pulse" />)}
          </div>
        )}

        {!loading && COMM_ORDER.map(comm => {
          const cfg     = COMM_CFG[comm]
          const grouped = members.filter(m => m.committee === comm)
          if (!grouped.length) return null
          return (
            <div key={comm} className="mb-1">
              <div className="flex items-center gap-2 px-5 pt-3 pb-1.5">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: cfg.color, boxShadow: `0 0 6px ${cfg.color}` }} />
                <span className="text-[10px] font-bold uppercase tracking-[0.8px] text-paksoc-mid dark:text-[#5DE68A]">{cfg.icon} {comm}</span>
                <span className="ml-auto text-[10px] text-gray-300 dark:text-[#2B5C3C] font-semibold">{grouped.length}</span>
              </div>
              <div className="flex flex-col gap-1 px-3">
                {grouped.map(m => (
                  <div
                    key={m.id} draggable onDragStart={e => onDragStart(e, m.id)}
                    className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg cursor-grab select-none transition-[background,transform] hover:translate-x-0.5"
                    style={{ borderLeft: `3px solid ${cfg.color}`, background: `${cfg.color}0D`, border: `1px solid ${cfg.color}22`, borderLeftWidth: '3px' }}
                    onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = `${cfg.color}22`}
                    onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = `${cfg.color}0D`}
                  >
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-extrabold shrink-0 text-white" style={{ background: cfg.color }}>
                      {initials(m.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-paksoc-deep dark:text-[#D4FAE3] truncate">{m.name}</div>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: `${cfg.color}18`, color: cfg.color }}>{m.role.toUpperCase()}</span>
                    </div>
                    <span className="text-gray-300 dark:text-[#2B5C3C] text-sm shrink-0">⠿</span>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <div className="px-5 py-3 border-t border-gray-200 dark:border-[#00FF66]/[.10] text-[11px] text-gray-400 dark:text-[#2B5C3C] shrink-0">
        ℹ One person can be assigned to many tasks.
      </div>
    </aside>
  )
}
