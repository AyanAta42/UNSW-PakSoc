export type TaskCategory = 'Task' | 'Game' | 'Stall'

export interface Member {
  id: string
  name: string
  role: 'President' | 'VP' | 'Exec' | 'Subcom'
  committee: string
}

export interface SubtaskItem {
  id: string
  title: string
}

export interface Task {
  id: string
  title: string
  category: TaskCategory
  subtasks: SubtaskItem[]
  assigned: Member[]
  notes: string
}
