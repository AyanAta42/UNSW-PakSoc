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
      ? 'flex flex-1 flex-col overflow-hidden min-h-0 w-full bg-[#0B0E0C]'
      : 'hidden lg:flex w-[300px] shrink-0 flex-col overflow-hidden bg-[#0B0E0C] border-r border-[#1D231F]'}>
      {!mobile && (
        <div className="p-5 border-b border-[#1D231F] shrink-0">
          <div className="flex items-center gap-2.5 mb-3">
            <button onClick={() => window.location.href = '/'} aria-label="Go to home"
              className="w-9 h-9 rounded-full overflow-hidden border-2 border-[#1D231F] cursor-pointer shrink-0 hover:border-[#22C55E] transition-all p-0 bg-transparent">
              <img src="/logo.webp" alt="PakSoc" className="w-full h-full object-cover" />
            </button>
            <button onClick={onBack} aria-label="Back to events"
              className="w-8 h-8 rounded-full bg-white/[0.06] border border-[#1D231F] flex items-center justify-center text-[#94A3B8] cursor-pointer hover:bg-white/10 transition-colors shrink-0 text-sm font-bold">
              ←
            </button>
            <span className="text-[15px] font-extrabold text-[#F8FAFC] flex-1">Team Roster</span>
          </div>
          <p className="text-xs text-[#64748B] m-0">Drag onto a task, or click a member then click a task.</p>
        </div>
      )}
      {mobile && <div className="px-4 py-3 border-b border-[#1D231F] shrink-0"><p className="text-xs text-[#94A3B8] m-0 font-semibold">Tap a member, then tap a task to assign</p></div>}
      <div className="flex-1 overflow-y-auto py-2">
        {loading && <div className="px-4 py-6 flex flex-col gap-3">{[1,2,3,4,5].map(i => <div key={i} className="motion-skeleton h-9 rounded-lg" />)}</div>}
        {!loading && getMemberSections(members).map(section => (
          <div key={section.key} className="mb-1">
            <div className="flex items-center gap-2 px-4 lg:px-5 pt-3 pb-1.5">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: section.color }} />
              <span className="text-[10px] font-bold uppercase tracking-[0.8px] text-[#94A3B8]">{section.label}</span>
              <span className="ml-auto text-[10px] text-[#64748B] font-semibold">{section.members.length}</span>
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
      {!mobile && <div className="px-5 py-3 border-t border-[#1D231F] text-[11px] text-[#64748B] shrink-0">One person can be assigned to many tasks.</div>}
    </aside>
  )
}
