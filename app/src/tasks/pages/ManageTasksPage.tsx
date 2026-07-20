import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTaskBoard }      from '@/tasks/hooks/useTaskBoard'
import { useAuth }           from '@/auth/hooks/useAuth'
import { RosterPanel }       from '@/tasks/components/panels/RosterPanel'
import { TaskListPanel }     from '@/tasks/components/panels/TaskListPanel'
import { NewTaskPanel }      from '@/tasks/components/panels/NewTaskPanel'
import { NewTaskModal }      from '@/tasks/components/forms/NewTaskModal'
import { MemberPickerSheet } from '@/tasks/components/assignment/MemberPickerSheet'
import { HistoryButton }     from '@/interactions/components/HistoryButton'
import { HistoryPanel }      from '@/interactions/components/HistoryPanel'
import { fetchEventTaskInteractions } from '@/interactions/services/fetchEventTaskInteractions'
import type { Member }       from '@/members/types/Member'

type PickerMode = 'task' | 'form' | null

export default function ManageTasksPage() {
  const navigate = useNavigate()
  const { eventId = '' } = useParams<{ eventId: string }>()
  const [addOpen,      setAddOpen]     = useState(false)
  const [pickerMode,   setPickerMode]  = useState<PickerMode>(null)
  const [assignTaskId, setAssignTaskId] = useState<string | null>(null)
  const [showHistory,  setShowHistory] = useState(false)
  const board   = useTaskBoard(eventId)
  const { user } = useAuth()

  const assignTask  = board.tasks.find(t => t.id === assignTaskId)
  const closePicker = () => { setPickerMode(null); setAssignTaskId(null) }

  function handleMemberPick(member: Member) {
    if (pickerMode === 'task' && assignTaskId) { board.assignMemberToTask(assignTaskId, member.id); closePicker() }
    else if (pickerMode === 'form') { board.setPreAssigned(p => p.some(a => a.id === member.id) ? p.filter(a => a.id !== member.id) : [...p, member]) }
  }

  /** Desktop: clicking a task while a member is selected assigns them. */
  function handleTaskClick(taskId: string) {
    if (!board.selectedMemberId) return
    board.assignMemberToTask(taskId, board.selectedMemberId)
    board.selectMember(null)
  }

  const sharedPanelProps = {
    tasks: board.tasks, loading: board.loading, overTask: board.overTask, currentUserAuthId: user?.id,
    allCategories: board.allCategories, eventId,
    onRemoveTask: board.removeTask, onRemoveAssigned: board.removeAssigned, onEditTask: board.editTask,
  }

  return (
    <>
      {/* Desktop */}
      <div className="hidden lg:flex h-screen overflow-hidden font-sans bg-[#030408]">
        <RosterPanel
          members={board.members} loading={board.loading}
          draggingMemberId={board.draggingMemberId} selectedMemberId={board.selectedMemberId}
          onBack={() => navigate('/events')}
          onMemberDragStart={board.beginMemberDrag} onMemberDragMove={board.moveMemberDrag} onMemberDragEnd={board.endMemberDrag}
          onMemberSelect={id => board.selectMember(board.selectedMemberId === id ? null : id)} />
        <TaskListPanel {...sharedPanelProps} onTaskClick={handleTaskClick} selectedMemberId={board.selectedMemberId} />
        <NewTaskPanel
          title={board.title} setTitle={board.setTitle} cat={board.cat} setCat={board.setCat}
          allCategories={board.allCategories}
          onAddCategory={board.addCustomCategory} onRemoveCategory={board.removeCustomCategory}
          subtasks={board.subtasks} setSubtasks={board.setSubtasks}
          preAssigned={board.preAssigned} setPreAssigned={board.setPreAssigned}
          notes={board.notes} setNotes={board.setNotes}
          overForm={board.overForm} onAddTask={board.addTask} />
      </div>

      {/* Mobile */}
      <div className="flex lg:hidden flex-col h-[100dvh] overflow-hidden font-sans bg-[#030408]">
        <header className="shrink-0 px-4 pb-3 pt-[calc(env(safe-area-inset-top)+0.75rem)] bg-[#0B0E0C] border-b border-[#1D231F] flex items-center gap-2.5">
          <button onClick={() => window.location.href = '/'} aria-label="Go to home"
            className="w-9 h-9 rounded-full overflow-hidden border-2 border-[#1D231F] cursor-pointer shrink-0 p-0 bg-transparent active:scale-95 transition-all">
            <img src="/logo.webp" alt="PakSoc" className="w-full h-full object-cover" />
          </button>
          <button onClick={() => navigate('/events')} aria-label="Back to events"
            className="w-8 h-8 rounded-full bg-white/[0.06] border border-[#1D231F] flex items-center justify-center text-[#94A3B8] cursor-pointer active:bg-white/10 transition-colors shrink-0 text-sm font-bold">
            ←
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="m-0 text-base font-extrabold text-[#F8FAFC] truncate">Manage Tasks</h1>
            <p className="m-0 text-[10px] text-[#64748B]">{board.tasks.length} tasks</p>
          </div>
          <HistoryButton onClick={() => setShowHistory(true)} label="View task history for this event" />
          <button onClick={() => setAddOpen(true)} style={{ background: '#22C55E', color: '#fff', boxShadow: '0 0 20px rgba(34,197,94,0.3)' }} className="shrink-0 w-9 h-9 rounded-full border-none cursor-pointer font-bold text-xl leading-none active:scale-95 transition-transform">+</button>
        </header>
        <TaskListPanel {...sharedPanelProps} mobile onAssignClick={id => { setAssignTaskId(id); setPickerMode('task') }} />
        <NewTaskModal open={addOpen} onClose={() => setAddOpen(false)}
          title={board.title} setTitle={board.setTitle} cat={board.cat} setCat={board.setCat}
          allCategories={board.allCategories}
          onAddCategory={board.addCustomCategory} onRemoveCategory={board.removeCustomCategory}
          subtasks={board.subtasks} setSubtasks={board.setSubtasks}
          preAssigned={board.preAssigned} setPreAssigned={board.setPreAssigned}
          notes={board.notes} setNotes={board.setNotes}
          onAddTask={board.addTask} onOpenAssigneePicker={() => setPickerMode('form')} />
        <MemberPickerSheet open={pickerMode === 'task'} title={assignTask ? `Assign to "${assignTask.title}"` : 'Choose a member'} members={board.members} onClose={closePicker} onPick={handleMemberPick} />
        <MemberPickerSheet open={pickerMode === 'form'} title="Choose assignees" members={board.members} multi selectedIds={board.preAssigned.map(m => m.id)} onClose={closePicker} onPick={handleMemberPick} onDone={closePicker} />
      </div>

      {showHistory && (
        <HistoryPanel title="Task History" onClose={() => setShowHistory(false)}
          fetcher={() => fetchEventTaskInteractions(eventId)} emptyMessage="No task activity for this event yet." />
      )}
    </>
  )
}
