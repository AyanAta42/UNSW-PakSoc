import type { DbEvent } from '@/events/types/Event'
import { dateParts }    from '@/events/utils/dateParts'
import { eventImageUrl } from '@/events/utils/eventImageUrl'
import { TICKETS_URL }   from '@/config/externalLinks'
import { ACCENT, PALETTE } from '@/config/theme'

interface Props { event: DbEvent; selected: boolean; now: Date; onClick: () => void }

export function PublicEventCard({ event: ev, selected, now, onClick }: Props) {
  const { month, day, time } = dateParts(ev.time, ev.end_time)
  const img   = eventImageUrl(ev)
  const ended = new Date(ev.time) <= now

  return (
    <div onClick={onClick}
      style={{
        background:   PALETTE.card,
        border:       `1px solid ${selected ? ACCENT : PALETTE.border}`,
        borderRadius: 18,
        boxShadow:    selected ? '0 0 40px rgba(34,197,94,0.12)' : PALETTE.shadowSm,
      }}
      className="motion-card overflow-hidden cursor-pointer flex flex-col min-w-0 w-full">

      <div className="relative overflow-hidden" style={{ height: 120 }}>
        {img
          ? <img src={img} alt={ev.name} className="motion-card-poster w-full h-full object-cover" />
          : <div className="motion-card-poster w-full h-full" style={{ background: `linear-gradient(135deg, ${PALETTE.cardAlt}, ${PALETTE.card})` }} />
        }
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 50%)' }} />

        <div className="absolute top-2 left-2 px-2.5 py-1 text-center"
          style={{ background: 'rgba(10,10,10,0.9)', border: `1px solid ${PALETTE.border}`, borderRadius: 10 }}>
          <div className="font-extrabold tracking-widest" style={{ fontSize: 9, color: ended ? PALETTE.muted : ACCENT }}>{month}</div>
          <div className="text-base font-extrabold leading-none"    style={{ color: ended ? PALETTE.muted : ACCENT }}>{day}</div>
        </div>
      </div>

      <div className="px-4 pt-3 pb-4 flex flex-col flex-1 gap-1">
        <div className="flex items-start justify-between gap-2 mb-0.5">
          <div style={{ color: PALETTE.dark, fontWeight: 700 }} className="text-sm leading-snug flex items-center gap-1.5 flex-wrap">
            {ev.name}
            {ended ? (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide"
                style={{ background: 'rgba(239,68,68,0.15)', color: '#F87171' }}>Ended</span>
            ) : (
              <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wide"
                style={{ background: 'rgba(34,197,94,0.15)', color: '#4ADE80' }}>Upcoming</span>
            )}
          </div>
          <span style={{ color: PALETTE.muted }} className="text-[11px] shrink-0 mt-0.5">
            {ev.price && ev.price > 0 ? `$${Number(ev.price).toFixed(2)}` : 'Free'}
          </span>
        </div>
        <div className="text-[11px] flex items-center gap-1.5" style={{ color: PALETTE.muted }}>
          <span style={{ color: ended ? PALETTE.disabled : ACCENT }}>◷</span>{time}
        </div>
        <div className="text-[11px] truncate flex items-center gap-1.5" style={{ color: PALETTE.muted }}>
          <span style={{ color: ended ? PALETTE.disabled : ACCENT }}>◎</span>{ev.location}
        </div>
        {!ended && (
          <a href={TICKETS_URL} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
            style={{ color: ACCENT }} className="text-xs font-semibold no-underline hover:opacity-70 transition-opacity mt-1 self-start">
            Get Tickets →
          </a>
        )}
        <p className="lg:hidden text-[10px] m-0 mt-1.5 font-semibold" style={{ color: PALETTE.disabled }}>Tap for schedule →</p>
      </div>
    </div>
  )
}
