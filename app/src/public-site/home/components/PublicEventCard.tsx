import type { DbEvent } from '@/events/types/Event'
import { dateParts }    from '@/events/utils/dateParts'
import { eventImageUrl } from '@/events/utils/eventImageUrl'
import { TICKETS_URL }   from '@/config/externalLinks'
import { ACCENT, PALETTE } from '@/config/theme'

interface Props {
  event:      DbEvent
  selected:   boolean
  now:        Date
  onClick:    () => void
}

/** Public-facing event card shown on the home page events grid. */
export function PublicEventCard({ event: ev, selected, now, onClick }: Props) {
  const { month, day, time } = dateParts(ev.time)
  const img   = eventImageUrl(ev)
  const ended = new Date(ev.time) <= now

  return (
    <div onClick={onClick}
      style={{
        border: selected ? `2px solid ${ACCENT}` : ended ? `1px solid ${PALETTE.border}` : `1.5px solid ${ACCENT}`,
        boxShadow: ended ? PALETTE.shadow : '0 4px 18px rgba(34,197,94,0.13)',
      }}
      className="rounded-xl overflow-hidden cursor-pointer hover:-translate-y-0.5 active:scale-[0.98] transition-all flex flex-col bg-white min-w-0 w-full">
      <div className="relative" style={{ height: 120 }}>
        {img ? <img src={img} alt={ev.name} className="w-full h-full object-cover" />
              : <div className="w-full h-full" style={{ background: ended ? 'linear-gradient(135deg,#F3F4F6,#E5E7EB)' : 'linear-gradient(135deg,#DCFCE7,#BBF7D0)' }} />}
        {!ended && <div className="absolute top-2 right-2 rounded-full px-2 py-0.5 text-[9px] font-extrabold tracking-widest uppercase" style={{ background: ACCENT, color: '#fff' }}>Upcoming</div>}
        <div className="absolute top-2 left-2 rounded-lg px-2.5 py-1 text-center shadow-sm" style={{ background: '#fff', border: `1px solid ${ended ? '#E5E7EB' : ACCENT}` }}>
          <div className="font-extrabold tracking-widest" style={{ fontSize: 9, color: ended ? '#9CA3AF' : ACCENT }}>{month}</div>
          <div className="text-base font-extrabold leading-none" style={{ color: ended ? '#9CA3AF' : ACCENT }}>{day}</div>
        </div>
      </div>
      <div className="px-3 pt-2.5 pb-3 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-1 mb-1.5">
          <div style={{ color: PALETTE.dark, fontWeight: 600 }} className="text-sm leading-snug flex items-center gap-1.5 flex-wrap">
            {ev.name}
            {ended && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide" style={{ background: '#F3F4F6', color: '#9CA3AF' }}>Ended</span>}
          </div>
          <span style={{ color: PALETTE.muted }} className="text-[11px] shrink-0 mt-0.5">{ev.price && ev.price > 0 ? `$${Number(ev.price).toFixed(2)}` : 'Free'}</span>
        </div>
        <div className="text-[11px] mb-0.5 flex items-center gap-1.5" style={{ color: ended ? '#9CA3AF' : PALETTE.muted }}><span style={{ color: ended ? '#9CA3AF' : ACCENT }}>◷</span>{time}</div>
        <div className="text-[11px] mb-2.5 truncate flex items-center gap-1.5" style={{ color: ended ? '#9CA3AF' : PALETTE.muted }}><span style={{ color: ended ? '#9CA3AF' : ACCENT }}>◎</span>{ev.location}</div>
        {!ended && <a href={TICKETS_URL} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ color: ACCENT }} className="text-xs font-semibold no-underline hover:opacity-70 transition-opacity mt-auto self-start">Get Tickets →</a>}
        <p className="lg:hidden text-[10px] m-0 mt-2 font-semibold" style={{ color: '#9CA3AF' }}>Tap for schedule →</p>
      </div>
    </div>
  )
}
