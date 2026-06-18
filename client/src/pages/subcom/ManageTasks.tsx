import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTaskBoard } from './data/useTaskBoard'
import { LeftPanel }   from './components/LeftPanel'
import { MiddlePanel } from './components/MiddlePanel'
import { RightPanel }  from './components/RightPanel'

export default function ManageTasks() {
  const navigate = useNavigate()
  const { eventId = '' } = useParams<{ eventId: string }>()
  const [dark, setDark] = useState(false)
  const board = useTaskBoard(eventId)

  return (
    <div className={dark ? 'dark' : ''}>
      <div className="flex h-screen overflow-hidden font-sans bg-[#F4F6F2] dark:bg-[#070C09]">

        <LeftPanel
          members={board.members}
          loading={board.loading}
          onBack={() => navigate('/')}
          onDragStart={board.dragStart}
        />

        <MiddlePanel
          dark={dark}
          tasks={board.tasks}
          loading={board.loading}
          overTask={board.overTask}
          onToggleDark={() => setDark(d => !d)}
          onDragOver={board.dragOver}
          onDragLeave={board.dragLeave}
          onDrop={board.drop}
          onRemoveTask={board.removeTask}
          onRemoveAssigned={board.removeAssigned}
        />

        <RightPanel
          title={board.title}            setTitle={board.setTitle}
          cat={board.cat}                setCat={board.setCat}
          subtasks={board.subtasks}      setSubtasks={board.setSubtasks}
          preAssigned={board.preAssigned} setPreAssigned={board.setPreAssigned}
          notes={board.notes}            setNotes={board.setNotes}
          overForm={board.overForm}      setOverForm={board.setOverForm}
          onDropForm={board.dropForm}
          onAddTask={board.addTask}
        />

      </div>
    </div>
  )
}
