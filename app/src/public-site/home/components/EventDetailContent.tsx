import type { DbEvent } from '@/events/types/Event'
import { dateParts }            from '@/events/utils/dateParts'
import { formatTimelineTime }   from '@/shared/utils/formatTimelineTime'
import { ACCENT, PALETTE }      from '@/config/theme'

interface Props { event: DbEvent; now: Date }

/** Renders event name, time, location, status badge, and optional timeline. */
export function EventDetailContent({ event, now }: Props) {
  const { month, day, time } = dateParts(event.time)
  const isEnded  = new Date(event.time) <= now
  const schedule = event.timeline ?? []

  return (
    <>
      <div className="flex items-start justify-between gap-2">
        <div style={{ color: PALETTE.dark, fontFamily: '"Satoshi", sans-serif', fontWeight: 900 }} className="text-base leading-snug">{event.name}</div>
        <div className="rounded-lg px-2.5 py-1 text-center shrink-0" style={{ background: '#fff', border: `1px solid ${isEnded ? PALETTE.border : ACCENT}` }}>
          <div className="font-extrabold tracking-widest" style={{ fontSize: 9, color: isEnded ? '#9CA3AF' : ACCENT }}>{month}</div>
          <div className="text-sm font-extrabold leading-none" style={{ color: isEnded ? '#9CA3AF' : ACCENT }}>{day}</div>
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2 text-xs" style={{ color: PALETTE.muted }}><span style={{ color: ACCENT }}>◷</span> {time}</div>
        <div className="flex items-center gap-2 text-xs" style={{ color: PALETTE.muted }}><span style={{ color: ACCENT }}>◎</span> {event.location}</div>
        {event.price != null && <div className="flex items-center gap-2 text-xs" style={{ color: PALETTE.muted }}><span style={{ color: ACCENT }}>$</span>{event.price > 0 ? `$${Number(event.price).toFixed(2)}` : 'Free entry'}</div>}
      </div>
      {isEnded
        ? <span className="text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide w-fit" style={{ background: '#F3F4F6', color: '#9CA3AF' }}>Ended</span>
        : <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wide w-fit" style={{ background: 'rgba(34,197,94,0.12)', color: ACCENT }}>Upcoming</span>
      }
      {schedule.length > 0 && (
        <div className="pt-1">
          <div style={{ color: PALETTE.dark }} className="text-[11px] font-bold uppercase tracking-widest mb-3">Timeline</div>
          <div className="flex flex-col">
            {schedule.map((item, i) => (
              <div key={`${item.time}-${item.title}-${i}`} className="flex gap-3">
                <div className="flex flex-col items-center shrink-0" style={{ width: 14 }}>
                  <div className="w-2.5 h-2.5 rounded-full mt-1 shrink-0" style={{ background: ACCENT }} />
                  {i < schedule.length - 1 && <div className="w-px flex-1 my-1" style={{ background: PALETTE.border, minHeight: 18 }} />}
                </div>
                <div className="pb-4 min-w-0">
                  <div style={{ color: ACCENT }} className="text-xs font-semibold">{formatTimelineTime(item.time)}</div>
                  <div style={{ color: PALETTE.dark }} className="text-sm leading-snug">{item.title}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
