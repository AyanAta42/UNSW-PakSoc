import { useState } from 'react'
import type { DbEvent } from '@/events/types/Event'
import { eventImageUrl } from '@/events/utils/eventImageUrl'
import { formatDate }    from '@/shared/utils/formatDate'
import { ACCENT, PALETTE } from '@/config/theme'

interface Props { event: DbEvent; onClick: () => void }

export function AllEventsCard({ event: ev, onClick }: Props) {
  const isEnded = new Date(ev.time) <= new Date()
  const img     = eventImageUrl(ev)
  const [hovered, setHovered] = useState(false)

  return (
    <button type="button" onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background:   PALETTE.card,
        border:       `1px solid ${hovered ? ACCENT : PALETTE.border}`,
        borderRadius: 18,
        boxShadow:    hovered ? '0 0 40px rgba(34,197,94,0.12)' : PALETTE.shadowSm,
        transition:   'border-color 0.2s, box-shadow 0.2s, transform 0.2s',
        transform:    hovered ? 'translateY(-2px)' : 'none',
      }}
      className="overflow-hidden flex flex-col text-left cursor-pointer w-full">
      <div className="relative" style={{ height: 120 }}>
        {img
          ? <img src={img} alt={ev.name} className="w-full h-full object-cover" />
          : <div className="w-full h-full" style={{ background: `linear-gradient(135deg, ${PALETTE.cardAlt}, ${PALETTE.card})` }} />
        }
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 50%)' }} />
      </div>
      <div className="p-4 flex flex-col gap-1.5 flex-1">
        <h3 className="text-sm font-bold m-0" style={{ color: PALETTE.dark }}>{ev.name}</h3>
        <div className="flex flex-col gap-0.5">
          <span className="text-xs" style={{ color: PALETTE.muted }}>{formatDate(ev.time, ev.end_time)}</span>
          <span className="text-xs" style={{ color: PALETTE.muted }}>{ev.location}</span>
          {ev.price != null && (
            <span className="text-xs" style={{ color: isEnded ? PALETTE.disabled : ACCENT }}>
              {ev.price > 0 ? `$${Number(ev.price).toFixed(2)}` : 'Free'}
            </span>
          )}
        </div>
      </div>
    </button>
  )
}
