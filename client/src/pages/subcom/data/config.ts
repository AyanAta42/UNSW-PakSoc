import type { TaskCategory } from './types'

export const CAT_CFG: Record<TaskCategory, { icon: string; color: string; activeCls: string; headerCls: string }> = {
  Task:  { icon: '📋', color: '#3B9DDD', activeCls: 'bg-blue-50   border-blue-400   text-blue-600',   headerCls: 'bg-blue-50   text-blue-600'   },
  Game:  { icon: '🎮', color: '#E74C3C', activeCls: 'bg-red-50    border-red-400    text-red-600',    headerCls: 'bg-red-50    text-red-600'    },
  Stall: { icon: '🏪', color: '#E67E22', activeCls: 'bg-orange-50 border-orange-400 text-orange-600', headerCls: 'bg-orange-50 text-orange-600' },
}

export const ALL_CATS: TaskCategory[] = ['Task', 'Game', 'Stall']

export const COMM_CFG: Record<string, { color: string; icon: string }> = {
  Presidents: { color: '#C9A84C', icon: '👑' },
  Sports:     { color: '#3B9DDD', icon: '🏏' },
  Marketing:  { color: '#E67E22', icon: '📢' },
  Events:     { color: '#E74C3C', icon: '🎉' },
  HR:         { color: '#A855F7', icon: '🤝' },
}

export const COMM_ORDER = ['Presidents', 'Sports', 'Marketing', 'Events', 'HR']

export const initials = (n: string) => n.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

export const inputCls = 'w-full px-3 py-2.5 border border-gray-200 dark:border-[#00FF66]/[.15] rounded-lg bg-gray-50 dark:bg-[#070C09] text-paksoc-deep dark:text-[#D4FAE3] text-sm outline-none focus:border-paksoc-bright dark:focus:border-paksoc-bright transition-colors placeholder:text-gray-400 dark:placeholder:text-[#1E4029]'
export const labelCls = 'block text-[11px] font-bold text-paksoc-mid dark:text-[#2B5C3C] uppercase tracking-wider mb-1.5'
