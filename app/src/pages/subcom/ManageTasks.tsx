import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTaskBoard } from './data/useTaskBoard'
import { useAuth }      from '@/hooks/useAuth'
import { LeftPanel }   from './components/LeftPanel'
import { MiddlePanel } from './components/MiddlePanel'
import { RightPanel }  from './components/RightPanel'
import { NewTaskModal } from './components/NewTaskModal'
import { MemberPickerSheet } from './components/MemberPickerSheet'
import type { Member } from './data/types'

type PickerMode = 'task' | 'form' | null

export default function ManageTasks() {
  const navigate = useNavigate()
  const { eventId = '' } = useParams<{ eventId: string }>()
  const [dark, setDark] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [pickerMode, setPickerMode] = useState<PickerMode>(null)
  const [assignTaskId, setAssignTaskId] = useState<string | null>(null)
  const board = useTaskBoard(eventId)
  const { user } = useAuth()

  const assignTask = board.tasks.find(t => t.id === assignTaskId)

  function openTaskAssignPicker(taskId: string) {
    setAssignTaskId(taskId)
    setPickerMode('task')
  }

  function openFormAssigneePicker() {
    setPickerMode('form')
  }

  function closePicker() {
    setPickerMode(null)
    setAssignTaskId(null)
  }

  function handleMemberPick(member: Member) {
    if (pickerMode === 'task' && assignTaskId) {
      board.assignMemberToTask(assignTaskId, member.id)
      closePicker()
    } else if (pickerMode === 'form') {
      board.setPreAssigned(p =>
        p.some(a => a.id === member.id) ? p.filter(a => a.id !== member.id) : [...p, member]
      )
    }
  }

  return (
    <div className={dark ? 'dark' : ''}>
      {/* ── DESKTOP ── */}
      <div className="hidden lg:flex h-screen overflow-hidden font-sans bg-[#F4F6F2] dark:bg-[#070C09]">
        <LeftPanel
          members={board.members}
          loading={board.loading}
          draggingMemberId={board.draggingMemberId}
          onBack={() => navigate('/')}
          onMemberDragStart={board.beginMemberDrag}
          onMemberDragMove={board.moveMemberDrag}
          onMemberDragEnd={board.endMemberDrag}
        />
        <MiddlePanel
          dark={dark}
          tasks={board.tasks}
          loading={board.loading}
          overTask={board.overTask}
          currentUserAuthId={user?.id}
          onToggleDark={() => setDark(d => !d)}
          onRemoveTask={board.removeTask}
          onRemoveAssigned={board.removeAssigned}
          onEditTask={board.editTask}
        />
        <RightPanel
          title={board.title}            setTitle={board.setTitle}
          cat={board.cat}                setCat={board.setCat}
          subtasks={board.subtasks}      setSubtasks={board.setSubtasks}
          preAssigned={board.preAssigned} setPreAssigned={board.setPreAssigned}
          notes={board.notes}            setNotes={board.setNotes}
          overForm={board.overForm}
          onAddTask={board.addTask}
        />
      </div>

      {/* ── MOBILE / TABLET (< lg) ── */}
      <div className="flex lg:hidden flex-col h-[100dvh] overflow-hidden font-sans bg-[#F4F6F2] dark:bg-[#070C09]">
        <header className="shrink-0 px-4 py-3 bg-white dark:bg-[#0A1209] border-b border-gray-200 dark:border-[#AAFF00]/10 flex items-center gap-3">
          <button onClick={() => navigate('/')} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-[#AAFF00]/[.07] text-paksoc-mid dark:text-[#AAFF00] border border-gray-200 dark:border-[#AAFF00]/20 cursor-pointer shrink-0">
            ← Back
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="m-0 text-base font-extrabold text-paksoc-deep dark:text-[#D4FAE3] truncate">Manage Tasks</h1>
            <p className="m-0 text-[10px] text-gray-400 dark:text-[#2B5C3C]">{board.tasks.length} tasks</p>
          </div>
          <button
            onClick={() => setAddOpen(true)}
            style={{ background: '#22C55E', color: '#fff' }}
            className="shrink-0 w-9 h-9 rounded-full border-none cursor-pointer font-bold text-xl leading-none shadow-sm active:scale-95 transition-transform"
            aria-label="New task"
          >
            +
          </button>
        </header>

        <MiddlePanel
          mobile
          dark={dark}
          tasks={board.tasks}
          loading={board.loading}
          overTask={board.overTask}
          currentUserAuthId={user?.id}
          onToggleDark={() => setDark(d => !d)}
          onRemoveTask={board.removeTask}
          onRemoveAssigned={board.removeAssigned}
          onEditTask={board.editTask}
          onAssignClick={openTaskAssignPicker}
        />

        <NewTaskModal
          open={addOpen}
          onClose={() => setAddOpen(false)}
          title={board.title}            setTitle={board.setTitle}
          cat={board.cat}                setCat={board.setCat}
          subtasks={board.subtasks}      setSubtasks={board.setSubtasks}
          preAssigned={board.preAssigned} setPreAssigned={board.setPreAssigned}
          notes={board.notes}            setNotes={board.setNotes}
          onAddTask={board.addTask}
          onOpenAssigneePicker={openFormAssigneePicker}
        />

        <MemberPickerSheet
          open={pickerMode === 'task'}
          title={assignTask ? `Assign to “${assignTask.title}”` : 'Choose a member'}
          members={board.members}
          onClose={closePicker}
          onPick={handleMemberPick}
        />

        <MemberPickerSheet
          open={pickerMode === 'form'}
          title="Choose assignees"
          members={board.members}
          multi
          selectedIds={board.preAssigned.map(m => m.id)}
          onClose={closePicker}
          onPick={handleMemberPick}
          onDone={closePicker}
        />
      </div>
    </div>
  )
}
