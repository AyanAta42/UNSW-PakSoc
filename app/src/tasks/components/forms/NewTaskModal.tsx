import type { Dispatch, SetStateAction } from 'react'
import type { Member } from '@/members/types/Member'
import { NewTaskForm, CreateTaskButton } from './NewTaskForm'
import { useSheetSwipe } from '@/shared/hooks/useSheetSwipe'

interface Props {
  open:          boolean;       onClose:        () => void
  title:         string;        setTitle:       Dispatch<SetStateAction<string>>
  cat:           string;        setCat:         Dispatch<SetStateAction<string>>
  allCategories: string[]
  onAddCategory:    (name: string) => void
  onRemoveCategory: (name: string) => void
  subtasks:      string[];      setSubtasks:    Dispatch<SetStateAction<string[]>>
  preAssigned:   Member[];      setPreAssigned: Dispatch<SetStateAction<Member[]>>
  notes:         string;        setNotes:       Dispatch<SetStateAction<string>>
  onAddTask:     () => void
  onOpenAssigneePicker: () => void
}

export function NewTaskModal({ open, onClose, title, setTitle, cat, setCat, allCategories, onAddCategory, onRemoveCategory, subtasks, setSubtasks, preAssigned, setPreAssigned, notes, setNotes, onAddTask, onOpenAssigneePicker }: Props) {
  // useSheetSwipe already ref-counts a scroll lock on the page behind — a second
  // hand-rolled `body.style.overflow` lock here only fought its save/restore.
  const { sheetRef, scrollRef, close, backdropOpacity, sheetStyle, touchHandlers } = useSheetSwipe(onClose, open)

  if (!open) return null

  function handleCreate() {
    if (!title.trim()) return
    onAddTask(); onClose()
  }

  return (
    <div className="fixed inset-0 z-[70] lg:hidden">
      <div className="absolute inset-0 bg-black/55 touch-none transition-opacity duration-[220ms]" style={{ opacity: backdropOpacity }} onClick={close} />
      <div ref={sheetRef} style={sheetStyle} {...touchHandlers} className="absolute bottom-0 left-0 right-0 rounded-t-[28px] h-[85dvh] flex flex-col bg-[#0D1119] border-t border-[#1D2129] shadow-[0_-8px_60px_rgba(0,0,0,0.6)] animate-[slideUp_0.22s_ease-out]" onClick={e => e.stopPropagation()}>
        <div className="flex justify-center pt-3 pb-1 shrink-0"><div className="w-10 h-1 rounded-full bg-[#1D2129]" /></div>
        <div className="flex items-center justify-between px-5 pb-3 shrink-0">
          <div>
            <div className="text-[15px] font-extrabold text-[#F8FAFC]">New Task</div>
            <div className="text-xs text-[#64748B] mt-0.5">Fill in details below</div>
          </div>
          <button onClick={close} className="w-8 h-8 rounded-full border border-[#1D2129] bg-[#080B12] flex items-center justify-center text-lg leading-none cursor-pointer text-[#94A3B8] hover:bg-white/5 transition-colors">{'×'}</button>
        </div>
        <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto no-scrollbar overscroll-contain px-5 pb-5">
          <NewTaskForm title={title} setTitle={setTitle} cat={cat} setCat={setCat} allCategories={allCategories}
            onAddCategory={onAddCategory} onRemoveCategory={onRemoveCategory}
            subtasks={subtasks} setSubtasks={setSubtasks} preAssigned={preAssigned} setPreAssigned={setPreAssigned}
            notes={notes} setNotes={setNotes} mobileAssignees onOpenAssigneePicker={onOpenAssigneePicker} onAddTask={handleCreate} hideSubmit />
        </div>
        {/* Pinned footer — Create button always visible while the form scrolls */}
        <div className="shrink-0 px-5 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] border-t border-[#1D2129] bg-[#0D1119]">
          <CreateTaskButton title={title} onAddTask={handleCreate} label="Create Task" />
        </div>
      </div>
    </div>
  )
}
