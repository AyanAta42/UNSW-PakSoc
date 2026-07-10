import type { Member } from '@/members/types/Member'

export type TaskCategory = 'Task' | 'Game' | 'Stall'

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
