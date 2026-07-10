import type { TaskCategory } from '@/tasks/types/Task'
import type { Committee } from '@/members/types/Member'

export const CAT_CFG: Record<TaskCategory, { color: string; activeCls: string; headerCls: string }> = {
  Task:  { color: '#3B9DDD', activeCls: 'bg-blue-50   border-blue-400   text-blue-600',   headerCls: 'bg-blue-50   text-blue-600'   },
  Game:  { color: '#E74C3C', activeCls: 'bg-red-50    border-red-400    text-red-600',    headerCls: 'bg-red-50    text-red-600'    },
  Stall: { color: '#E67E22', activeCls: 'bg-orange-50 border-orange-400 text-orange-600', headerCls: 'bg-orange-50 text-orange-600' },
}

export const ALL_CATS: TaskCategory[] = ['Task', 'Game', 'Stall']

export const COMM_CFG: Record<string, { color: string }> = {
  Presidents: { color: '#C9A84C' },
  Sports:     { color: '#3B9DDD' },
  Marketing:  { color: '#E67E22' },
  Events:     { color: '#E74C3C' },
  HR:         { color: '#A855F7' },
}

export const COMM_ORDER = ['Presidents', 'Sports', 'Marketing', 'Events', 'HR']
export const COMMITTEE_ORDER: Committee[] = ['Sports', 'Marketing', 'Events', 'HR']

export const ROLE_SECTION_CFG = {
  president:      { label: 'President',      color: '#9333EA' },
  vice_president: { label: 'Vice President', color: '#16A34A' },
} as const

/** Shared Tailwind input classes for dark/light task forms. */
export const inputCls = 'w-full px-3 py-2.5 border border-gray-200 dark:border-[#AAFF00]/[.15] rounded-lg bg-gray-50 dark:bg-[#070C09] text-paksoc-deep dark:text-[#D4FAE3] text-sm outline-none focus:border-paksoc-bright dark:focus:border-paksoc-bright transition-colors placeholder:text-gray-400 dark:placeholder:text-[#1E4029]'
export const labelCls = 'block text-[11px] font-bold text-paksoc-mid dark:text-[#2B5C3C] uppercase tracking-wider mb-1.5'
