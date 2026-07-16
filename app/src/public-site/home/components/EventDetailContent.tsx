import type { DbEvent } from '@/events/types/Event'
import { dateParts }          from '@/events/utils/dateParts'
import { getEventButtons }    from '@/events/utils/getEventButtons'
import { EventCtaButton }     from '@/events/components/EventCtaButton'
import { formatTimelineTime } from '@/shared/utils/formatTimelineTime'
import { ACCENT, PALETTE }    from '@/config/theme'

interface Props { event: DbEvent; now: Date; hideButtons?: boolean }

export function EventDetailContent({ event, now, hideButtons = false }: Props) {
  const { month, day, time } = dateParts(event.time, event.end_time)
  const isEnded  = new Date(event.time) <= now
  const schedule = event.timeline ?? []
  const btns     = getEventButtons(event.buttons)

  return (
    <>
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div style={{ color: PALETTE.dark, fontFamily: '"Satoshi", sans-serif', fontWeight: 800 }}
          className="text-base leading-snug">{event.name}</div>
        <div className="px-2.5 py-1 text-center shrink-0"
          style={{ background: PALETTE.cardAlt, border: `1px solid ${isEnded ? PALETTE.border : 'rgba(34,197,94,0.4)'}`, borderRadius: 10 }}>
          <div className="font-extrabold tracking-widest" style={{ fontSize: 9, color: isEnded ? PALETTE.muted : ACCENT }}>{month}</div>
          <div className="text-sm font-extrabold leading-none"    style={{ color: isEnded ? PALETTE.muted : ACCENT }}>{day}</div>
        </div>
      </div>

      {/* Meta */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2 text-xs" style={{ color: PALETTE.muted }}><span style={{ color: ACCENT }}>◷</span>{time}</div>
        <div className="flex items-center gap-2 text-xs" style={{ color: PALETTE.muted }}><span style={{ color: ACCENT }}>◎</span>{event.location}</div>
        {event.price != null && (
          <div className="flex items-center gap-2 text-xs" style={{ color: PALETTE.muted }}>
            <span style={{ color: ACCENT }}>$</span>{event.price > 0 ? `$${Number(event.price).toFixed(2)}` : 'Free entry'}
          </div>
        )}
      </div>

      {/* Status badge */}
      {isEnded
        ? <span className="text-[9px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide w-fit"
            style={{ background: 'rgba(239,68,68,0.15)', color: '#F87171' }}>Ended</span>
        : <span className="text-[9px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wide w-fit"
            style={{ background: 'rgba(34,197,94,0.15)', color: '#4ADE80' }}>Upcoming</span>
      }

      {/* CTA buttons (hidden in MobileEventSheet — shown below map there) */}
      {!hideButtons && btns.length > 0 && !isEnded && (
        <div className="flex flex-col gap-2">
          {btns.map((b, i) => (
            <EventCtaButton key={i} label={b.label} url={b.url} variant={i === 0 ? 'primary' : 'secondary'}
              className="w-full py-2.5 text-xs" />
          ))}
        </div>
      )}

      {/* Timeline */}
      {schedule.length > 0 && (
        <div className="pt-1">
          <div style={{ color: PALETTE.muted }} className="text-[10px] font-bold uppercase tracking-widest mb-3">Timeline</div>
          <div className="flex flex-col">
            {schedule.map((item, i) => (
              <div key={`${item.time}-${i}`} className="flex gap-3">
                <div className="flex flex-col items-center shrink-0" style={{ width: 14 }}>
                  <div className="w-2 h-2 rounded-full mt-1 shrink-0" style={{ background: ACCENT }} />
                  {i < schedule.length - 1 && <div className="w-px flex-1 my-1" style={{ background: PALETTE.border, minHeight: 18 }} />}
                </div>
                <div className="pb-4 min-w-0">
                  <div style={{ color: ACCENT }} className="text-xs font-semibold">{formatTimelineTime(item.time)}</div>
                  <div style={{ color: PALETTE.secondary }} className="text-sm leading-snug">{item.title}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
