import type { Member } from '@/members/types/Member'

/** String union kept loose so event-specific custom categories work without casting. */
export type TaskCategory = string

export const DEFAULT_TASK_CATEGORIES: TaskCategory[] = ['Task', 'Game', 'Stall']

export interface SubtaskItem { id: string; title: string; done: boolean }

export interface Task {
  id:       string
  title:    string
  category: TaskCategory
  subtasks: SubtaskItem[]
  assigned: Member[]
  notes:    string
}
