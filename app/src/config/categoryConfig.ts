import type { Committee } from '@/members/types/Member'

export const DEFAULT_CAT_CFG: Record<string, { color: string; activeCls: string; headerCls: string }> = {
  Task:  { color: '#60A5FA', activeCls: 'bg-blue-500/10   border-blue-400/70   text-blue-300',   headerCls: 'bg-blue-500/10   text-blue-300'   },
  Game:  { color: '#F87171', activeCls: 'bg-red-500/10    border-red-400/70    text-red-300',    headerCls: 'bg-red-500/10    text-red-300'    },
  Stall: { color: '#FB923C', activeCls: 'bg-orange-500/10 border-orange-400/70 text-orange-300', headerCls: 'bg-orange-500/10 text-orange-300' },
}
/** Returns config for any category — custom ones get a generic teal style. */
export function getCatCfg(cat: string) {
  return DEFAULT_CAT_CFG[cat] ?? { color: '#2DD4BF', activeCls: 'bg-teal-500/10 border-teal-400/70 text-teal-300', headerCls: 'bg-teal-500/10 text-teal-300' }
}

export const DEFAULT_TASK_CATEGORIES: string[] = ['Task', 'Game', 'Stall']

/** @deprecated use DEFAULT_TASK_CATEGORIES */
export const ALL_CATS = DEFAULT_TASK_CATEGORIES
/** @deprecated use getCatCfg */
export const CAT_CFG = DEFAULT_CAT_CFG as Record<string, { color: string; activeCls: string; headerCls: string }>

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
  president:      { label: 'President',      color: '#C084FC' },
  vice_president: { label: 'Vice President', color: '#4ADE80' },
} as const

/** Shared Tailwind input classes for the dark task forms. */
export const inputCls = 'w-full px-3 py-2.5 border border-[#1D231F] rounded-lg bg-[#090C0A] text-[#F8FAFC] text-sm outline-none focus:border-[#22C55E] transition-colors placeholder:text-[#475569]'
export const labelCls = 'block text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider mb-1.5'
