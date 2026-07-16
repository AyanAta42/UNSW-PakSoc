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

export function RosterPanel({ members, loading, draggingMemberId, selectedMemberId, mobile, onBack, onMemberDragStart, onMemberDragMove, onMemberDragEnd, onMemberSelect }: Props) {
  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>, memberId: string) {
    if (e.button !== 0) return; e.currentTarget.setPointerCapture(e.pointerId); onMemberDragStart(memberId)
  }
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => { if (!e.currentTarget.hasPointerCapture(e.pointerId)) return; onMemberDragMove(e.clientX, e.clientY) }
  const handlePointerEnd  = (e: React.PointerEvent<HTMLDivElement>) => { if (!e.currentTarget.hasPointerCapture(e.pointerId)) return; e.currentTarget.releasePointerCapture(e.pointerId); onMemberDragEnd(e.clientX, e.clientY) }

  return (
    <aside className={mobile
      ? 'flex flex-1 flex-col overflow-hidden min-h-0 w-full bg-white'
      : 'hidden lg:flex w-[300px] shrink-0 flex-col overflow-hidden bg-white border-r border-gray-200'}>
      {!mobile && (
        <div className="p-5 border-b border-gray-200 shrink-0">
          <div className="flex items-center gap-2.5 mb-3">
            <button onClick={() => window.location.href = '/'} aria-label="Go to home"
              className="w-9 h-9 rounded-full overflow-hidden border-2 border-gray-100 cursor-pointer shrink-0 hover:border-[#22C55E] transition-all p-0 bg-transparent shadow-sm">
              <img src="/logo.png" alt="PakSoc" className="w-full h-full object-cover" />
            </button>
            <button onClick={onBack} aria-label="Back to events"
              className="w-8 h-8 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-500 cursor-pointer hover:bg-gray-200 transition-colors shrink-0 text-sm font-bold">
              ←
            </button>
            <span className="text-[15px] font-extrabold text-[#111827] flex-1">Team Roster</span>
          </div>
          <p className="text-xs text-gray-400 m-0">Drag onto a task, or click a member then click a task.</p>
        </div>
      )}
      {mobile && <div className="px-4 py-3 border-b border-gray-200 shrink-0"><p className="text-xs text-gray-500 m-0 font-semibold">Tap a member, then tap a task to assign</p></div>}
      <div className="flex-1 overflow-y-auto py-2">
        {loading && <div className="px-4 py-6 flex flex-col gap-3">{[1,2,3,4,5].map(i => <div key={i} className="h-9 rounded-lg bg-gray-100 animate-pulse" />)}</div>}
        {!loading && getMemberSections(members).map(section => (
          <div key={section.key} className="mb-1">
            <div className="flex items-center gap-2 px-4 lg:px-5 pt-3 pb-1.5">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: section.color }} />
              <span className="text-[10px] font-bold uppercase tracking-[0.8px] text-gray-500">{section.label}</span>
              <span className="ml-auto text-[10px] text-gray-300 font-semibold">{section.members.length}</span>
            </div>
            <div className={`flex flex-col gap-1.5 ${mobile ? 'px-4' : 'px-3'}`}>
              {section.members.map(m => (
                <MemberDragCard key={m.id} m={m} color={section.color} mobile={mobile}
                  selected={selectedMemberId === m.id} dragging={draggingMemberId === m.id}
                  onDragStart={e => handlePointerDown(e, m.id)} onDragMove={handlePointerMove} onDragEnd={handlePointerEnd}
                  onSelect={() => onMemberSelect?.(m.id)} />
              ))}
            </div>
          </div>
        ))}
      </div>
      {!mobile && <div className="px-5 py-3 border-t border-gray-200 text-[11px] text-gray-400 shrink-0">One person can be assigned to many tasks.</div>}
    </aside>
  )
}
