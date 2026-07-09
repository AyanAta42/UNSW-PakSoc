import type { Member } from '../data/types'
import { getMemberSections, initials } from '../data/config'

interface Props {
  members: Member[]
  loading: boolean
  draggingMemberId: string | null
  selectedMemberId?: string | null
  mobile?: boolean
  onBack: () => void
  onMemberDragStart: (memberId: string) => void
  onMemberDragMove: (clientX: number, clientY: number) => void
  onMemberDragEnd: (clientX: number, clientY: number) => void
  onMemberSelect?: (memberId: string) => void
}

function MemberRow({
  m, cfg, mobile, selected, dragging,
  onDragStart, onDragMove, onDragEnd, onSelect,
}: {
  m: Member
  cfg?: { color: string }
  mobile?: boolean
  selected?: boolean
  dragging?: boolean
  onDragStart: (e: React.PointerEvent<HTMLDivElement>) => void
  onDragMove: (e: React.PointerEvent<HTMLDivElement>) => void
  onDragEnd: (e: React.PointerEvent<HTMLDivElement>) => void
  onSelect?: () => void
}) {
  const color = cfg?.color ?? '#4B5563'
  const selectedCls = selected ? 'ring-2 ring-paksoc-bright dark:ring-[#AAFF00] bg-paksoc-bright/10' : ''

  if (mobile) {
    return (
      <button type="button" onClick={onSelect}
        className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left cursor-pointer transition-all active:scale-[0.98] ${selectedCls}`}
        style={{
          borderLeft: `3px solid ${color}`,
          background: selected ? `${color}18` : `${color}0D`,
          border: `1px solid ${color}22`,
          borderLeftWidth: '3px',
        }}>
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-extrabold shrink-0 text-white" style={{ background: color }}>
          {initials(m.name)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-paksoc-deep dark:text-[#D4FAE3] truncate">{m.name}</div>
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: `${color}18`, color }}>{m.role.replace('_', ' ')}</span>
        </div>
        {selected && <span className="text-paksoc-bright text-xs font-bold shrink-0">✓</span>}
      </button>
    )
  }

  return (
    <div
      onPointerDown={onDragStart}
      onPointerMove={onDragMove}
      onPointerUp={onDragEnd}
      onPointerCancel={onDragEnd}
      className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg select-none touch-none ${dragging ? 'cursor-grabbing opacity-60 scale-[0.98]' : 'cursor-grab'}`}
      style={{
        borderLeft: `3px solid ${color}`,
        background: dragging ? `${color}33` : `${color}0D`,
        border: `1px solid ${color}22`,
        borderLeftWidth: '3px',
      }}
    >
      <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-extrabold shrink-0 text-white" style={{ background: color }}>
        {initials(m.name)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-semibold text-paksoc-deep dark:text-[#D4FAE3] truncate">{m.name}</div>
        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: `${color}18`, color: cfg ? color : '#6B7280' }}>{m.role.replace('_', ' ')}</span>
      </div>
      <span className="text-gray-300 dark:text-[#2B5C3C] text-sm shrink-0">⠿</span>
    </div>
  )
}

export function LeftPanel({ members, loading, draggingMemberId, selectedMemberId, mobile, onBack, onMemberDragStart, onMemberDragMove, onMemberDragEnd, onMemberSelect }: Props) {
  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>, memberId: string) {
    if (e.button !== 0) return
    e.currentTarget.setPointerCapture(e.pointerId)
    onMemberDragStart(memberId)
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return
    onMemberDragMove(e.clientX, e.clientY)
  }

  function handlePointerEnd(e: React.PointerEvent<HTMLDivElement>) {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return
    e.currentTarget.releasePointerCapture(e.pointerId)
    onMemberDragEnd(e.clientX, e.clientY)
  }

  const shellCls = mobile
    ? 'flex flex-1 flex-col overflow-hidden min-h-0 w-full bg-white dark:bg-[#0D1610]'
    : 'hidden lg:flex w-[310px] shrink-0 flex-col overflow-hidden bg-white dark:bg-[#0D1610] border-r border-gray-200 dark:border-[#AAFF00]/[.10]'

  return (
    <aside className={shellCls}>
      {!mobile && (
        <div className="p-5 border-b border-gray-200 dark:border-[#AAFF00]/[.10] shrink-0">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[15px] font-extrabold text-paksoc-deep dark:text-[#D4FAE3]">Team Roster</span>
            <button onClick={onBack} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-[#AAFF00]/[.07] text-paksoc-mid dark:text-[#AAFF00] border border-gray-200 dark:border-[#AAFF00]/[.20] cursor-pointer hover:bg-gray-200 dark:hover:bg-[#AAFF00]/[.14] transition-colors">
              ← Back
            </button>
          </div>
          <p className="text-xs text-gray-400 dark:text-[#2B5C3C] m-0">Drag a card onto a task to assign</p>
        </div>
      )}

      {mobile && (
        <div className="px-4 py-3 border-b border-gray-200 dark:border-[#AAFF00]/[.10] shrink-0">
          <p className="text-xs text-gray-500 dark:text-[#5DE68A] m-0 font-semibold">Tap a member, then tap a task to assign</p>
        </div>
      )}

      <div className="flex-1 overflow-y-auto py-2">
        {loading && (
          <div className="px-4 py-6 flex flex-col gap-3">
            {[1,2,3,4,5].map(i => <div key={i} className="h-9 rounded-lg bg-gray-100 dark:bg-[#AAFF00]/[.04] animate-pulse" />)}
          </div>
        )}

        {!loading && getMemberSections(members).map(section => (
            <div key={section.key} className="mb-1">
              <div className="flex items-center gap-2 px-4 lg:px-5 pt-3 pb-1.5">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: section.color, boxShadow: `0 0 6px ${section.color}` }} />
                <span className="text-[10px] font-bold uppercase tracking-[0.8px] text-paksoc-mid dark:text-[#5DE68A]">{section.label}</span>
                <span className="ml-auto text-[10px] text-gray-300 dark:text-[#2B5C3C] font-semibold">{section.members.length}</span>
              </div>
              <div className={`flex flex-col gap-1.5 ${mobile ? 'px-4' : 'px-3'}`}>
                {section.members.map(m => (
                  <MemberRow
                    key={m.id}
                    m={m}
                    cfg={{ color: section.color }}
                    mobile={mobile}
                    selected={selectedMemberId === m.id}
                    dragging={draggingMemberId === m.id}
                    onDragStart={e => handlePointerDown(e, m.id)}
                    onDragMove={handlePointerMove}
                    onDragEnd={handlePointerEnd}
                    onSelect={() => onMemberSelect?.(m.id)}
                  />
                ))}
              </div>
            </div>
          ))}
      </div>

      {!mobile && (
        <div className="px-5 py-3 border-t border-gray-200 dark:border-[#AAFF00]/[.10] text-[11px] text-gray-400 dark:text-[#2B5C3C] shrink-0">
          One person can be assigned to many tasks.
        </div>
      )}
    </aside>
  )
}
