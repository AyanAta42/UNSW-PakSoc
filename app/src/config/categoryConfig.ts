import type { Committee } from '@/members/types/Member'

export const DEFAULT_CAT_CFG: Record<string, { color: string; activeCls: string; headerCls: string }> = {
  Task:  { color: '#60A5FA', activeCls: 'bg-blue-500/10   border-blue-400/70   text-blue-300',   headerCls: 'bg-blue-500/10   text-blue-300'   },
  Game:  { color: '#F87171', activeCls: 'bg-red-500/10    border-red-400/70    text-red-300',    headerCls: 'bg-red-500/10    text-red-300'    },
  Stall: { color: '#FB923C', activeCls: 'bg-orange-500/10 border-orange-400/70 text-orange-300', headerCls: 'bg-orange-500/10 text-orange-300' },
}
/** Returns config for any category — custom ones get a calm neutral gray style. */
export function getCatCfg(cat: string) {
  return DEFAULT_CAT_CFG[cat] ?? { color: '#94A3B8', activeCls: 'bg-slate-500/10 border-slate-400/60 text-slate-300', headerCls: 'bg-slate-500/10 text-slate-300' }
}

export const DEFAULT_TASK_CATEGORIES: string[] = ['Task', 'Game', 'Stall']

/** @deprecated use DEFAULT_TASK_CATEGORIES */
export const ALL_CATS = DEFAULT_TASK_CATEGORIES
/** @deprecated use getCatCfg */
export const CAT_CFG = DEFAULT_CAT_CFG as Record<string, { color: string; activeCls: string; headerCls: string }>

/** Muted, low-saturation tones that sit calmly on the dark UI instead of clashing like flat primary colours. */
export const COMM_CFG: Record<string, { color: string }> = {
  Presidents: { color: '#C9A97E' },
  Sports:     { color: '#6FA8C7' },
  Marketing:  { color: '#C79A6B' },
  Events:     { color: '#BD7F7F' },
  HR:         { color: '#9B8FC2' },
}

export const COMM_ORDER = ['Presidents', 'Sports', 'Marketing', 'Events', 'HR']
export const COMMITTEE_ORDER: Committee[] = ['Sports', 'Marketing', 'Events', 'HR']

export const ROLE_SECTION_CFG = {
  president:      { label: 'President',      color: '#D4B36A' },
  vice_president: { label: 'Vice President', color: '#6FBF97' },
  arc_delegate:   { label: 'Arc Delegate',   color: '#2DD4BF' },
} as const

/** Shared Tailwind input classes for the dark task forms. */
export const inputCls = 'w-full px-3 py-2.5 border border-[#1D2129] rounded-lg bg-[#090C13] text-[#F8FAFC] text-sm outline-none focus:border-[#22C55E] transition-colors placeholder:text-[#475569]'
export const labelCls = 'block text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider mb-1.5'
