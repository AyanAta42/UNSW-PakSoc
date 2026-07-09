import type { Member } from '../data/types'
import { getMemberSections, initials } from '../data/config'

interface Props {
  open: boolean
  title?: string
  members: Member[]
  multi?: boolean
  selectedIds?: string[]
  onClose: () => void
  onPick: (member: Member) => void
  onDone?: () => void
}

export function MemberPickerSheet({ open, title = 'Choose a member', members, multi, selectedIds = [], onClose, onPick, onDone }: Props) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[80]">
      <div className="absolute inset-0 bg-black/45 backdrop-blur-[2px]" onClick={onClose} />
      <div
        className="absolute bottom-0 left-0 right-0 rounded-t-[28px] max-h-[88vh] flex flex-col bg-white dark:bg-[#0D1610] shadow-[0_-8px_40px_rgba(0,0,0,0.18)] animate-[slideUp_0.28s_ease-out]"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-gray-200 dark:bg-[#AAFF00]/20" />
        </div>
        <div className="flex items-center justify-between px-5 pb-3 shrink-0">
          <div className="text-[15px] font-extrabold text-paksoc-deep dark:text-[#D4FAE3]">{title}</div>
          <button onClick={onClose} className="w-8 h-8 rounded-full border border-gray-200 dark:border-[#AAFF00]/20 flex items-center justify-center text-lg leading-none cursor-pointer text-gray-400 bg-white dark:bg-[#0D1610]">×</button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-4 min-h-0">
          {getMemberSections(members).map(section => (
            <div key={section.key} className="mb-3">
              <div className="flex items-center gap-2 px-1 pt-2 pb-1.5">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: section.color }} />
                <span className="text-[10px] font-bold uppercase tracking-[0.8px] text-paksoc-mid dark:text-[#5DE68A]">{section.label}</span>
              </div>
              <div className="flex flex-col gap-1.5">
                {section.members.map(m => (
                  <MemberPickerRow
                    key={m.id}
                    m={m}
                    color={section.color}
                    picked={selectedIds.includes(m.id)}
                    multi={multi}
                    onPick={() => onPick(m)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {multi && (
          <div className="shrink-0 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2 border-t border-gray-200 dark:border-[#AAFF00]/10">
            <button onClick={() => { onDone?.(); onClose() }}
              className="w-full py-3 rounded-xl text-sm font-bold border-none cursor-pointer bg-paksoc-mid text-white dark:bg-paksoc-bright dark:text-[#070C09]">
              Done{selectedIds.length > 0 ? ` (${selectedIds.length} selected)` : ''}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function MemberPickerRow({ m, color, picked, multi, onPick }: { m: Member; color: string; picked?: boolean; multi?: boolean; onPick: () => void }) {
  return (
    <button type="button" onClick={onPick}
      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left cursor-pointer active:scale-[0.98] transition-all ${picked ? 'ring-2 ring-paksoc-bright dark:ring-[#AAFF00]' : ''}`}
      style={{ borderLeft: `3px solid ${color}`, background: picked ? `${color}18` : `${color}0D`, border: `1px solid ${color}22`, borderLeftWidth: '3px' }}>
      <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-extrabold shrink-0 text-white" style={{ background: color }}>
        {initials(m.name)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-paksoc-deep dark:text-[#D4FAE3] truncate">{m.name}</div>
        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded capitalize" style={{ background: `${color}18`, color }}>{m.role.replace(/_/g, ' ')}</span>
      </div>
      {multi && picked && <span className="text-paksoc-bright font-bold shrink-0">✓</span>}
    </button>
  )
}
