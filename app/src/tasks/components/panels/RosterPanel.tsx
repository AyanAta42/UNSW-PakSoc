import type { Member } from '@/members/types/Member'
import { getMemberSections } from '@/members/utils/getMemberSections'
import { MemberDragCard }    from './MemberDragCard'

interface Props {
  members:          Member[]
  loading:          boolean
  draggingMemberId: string | null
  selectedMemberId?: string | null
  mobile?:          boolean
  onBack:           () => void
  onMemberDragStart:(memberId: string) => void
  onMemberDragMove: (clientX: number, clientY: number) => void
  onMemberDragEnd:  (clientX: number, clientY: number) => void
  onMemberSelect?:  (memberId: string) => void
}

/** Left-side team roster. Desktop = drag-to-assign; mobile = tap-to-select. */
export function RosterPanel({ members, loading, draggingMemberId, selectedMemberId, mobile, onBack, onMemberDragStart, onMemberDragMove, onMemberDragEnd, onMemberSelect }: Props) {
  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>, memberId: string) {
    if (e.button !== 0) return; e.currentTarget.setPointerCapture(e.pointerId); onMemberDragStart(memberId)
  }
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => { if (!e.currentTarget.hasPointerCapture(e.pointerId)) return; onMemberDragMove(e.clientX, e.clientY) }
  const handlePointerEnd  = (e: React.PointerEvent<HTMLDivElement>) => { if (!e.currentTarget.hasPointerCapture(e.pointerId)) return; e.currentTarget.releasePointerCapture(e.pointerId); onMemberDragEnd(e.clientX, e.clientY) }

  const shellCls = mobile
    ? 'flex flex-1 flex-col overflow-hidden min-h-0 w-full bg-white dark:bg-[#0D1610]'
    : 'hidden lg:flex w-[310px] shrink-0 flex-col overflow-hidden bg-white dark:bg-[#0D1610] border-r border-gray-200 dark:border-[#AAFF00]/[.10]'

  return (
    <aside className={shellCls}>
      {!mobile && (
        <div className="p-5 border-b border-gray-200 dark:border-[#AAFF00]/[.10] shrink-0">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[15px] font-extrabold text-paksoc-deep dark:text-[#D4FAE3]">Team Roster</span>
            <button onClick={onBack} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-[#AAFF00]/[.07] text-paksoc-mid dark:text-[#AAFF00] border border-gray-200 dark:border-[#AAFF00]/[.20] cursor-pointer hover:bg-gray-200 dark:hover:bg-[#AAFF00]/[.14] transition-colors">← Back</button>
          </div>
          <p className="text-xs text-gray-400 dark:text-[#2B5C3C] m-0">Drag a card onto a task to assign</p>
        </div>
      )}
      {mobile && <div className="px-4 py-3 border-b border-gray-200 dark:border-[#AAFF00]/[.10] shrink-0"><p className="text-xs text-gray-500 dark:text-[#5DE68A] m-0 font-semibold">Tap a member, then tap a task to assign</p></div>}
      <div className="flex-1 overflow-y-auto py-2">
        {loading && <div className="px-4 py-6 flex flex-col gap-3">{[1,2,3,4,5].map(i => <div key={i} className="h-9 rounded-lg bg-gray-100 dark:bg-[#AAFF00]/[.04] animate-pulse" />)}</div>}
        {!loading && getMemberSections(members).map(section => (
          <div key={section.key} className="mb-1">
            <div className="flex items-center gap-2 px-4 lg:px-5 pt-3 pb-1.5">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: section.color, boxShadow: `0 0 6px ${section.color}` }} />
              <span className="text-[10px] font-bold uppercase tracking-[0.8px] text-paksoc-mid dark:text-[#5DE68A]">{section.label}</span>
              <span className="ml-auto text-[10px] text-gray-300 dark:text-[#2B5C3C] font-semibold">{section.members.length}</span>
            </div>
            <div className={`flex flex-col gap-1.5 ${mobile ? 'px-4' : 'px-3'}`}>
              {section.members.map(m => (
                <MemberDragCard key={m.id} m={m} color={section.color} mobile={mobile} selected={selectedMemberId === m.id} dragging={draggingMemberId === m.id}
                  onDragStart={e => handlePointerDown(e, m.id)} onDragMove={handlePointerMove} onDragEnd={handlePointerEnd} onSelect={() => onMemberSelect?.(m.id)} />
              ))}
            </div>
          </div>
        ))}
      </div>
      {!mobile && <div className="px-5 py-3 border-t border-gray-200 dark:border-[#AAFF00]/[.10] text-[11px] text-gray-400 dark:text-[#2B5C3C] shrink-0">One person can be assigned to many tasks.</div>}
    </aside>
  )
}
