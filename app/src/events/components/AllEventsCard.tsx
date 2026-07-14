import type { DbEvent } from '@/events/types/Event'
import { eventImageUrl } from '@/events/utils/eventImageUrl'
import { formatDate }    from '@/shared/utils/formatDate'

interface Props { event: DbEvent; onClick: () => void }

export function AllEventsCard({ event: ev, onClick }: Props) {
  const isEnded = new Date(ev.time) <= new Date()
  const img     = eventImageUrl(ev)

  return (
    <button type="button" onClick={onClick}
      className="bg-white rounded-xl overflow-hidden border shadow-sm flex flex-col text-left cursor-pointer hover:-translate-y-0.5 transition-all w-full"
      style={{ borderColor: isEnded ? '#E5E7EB' : '#86EFAC' }}>
      <div className="relative" style={{ height: 120 }}>
        {img ? <img src={img} alt={ev.name} className="w-full h-full object-cover" />
              : <div className="w-full h-full" style={{ background: isEnded ? 'linear-gradient(135deg,#F3F4F6,#E5E7EB)' : 'linear-gradient(135deg,#DCFCE7,#BBF7D0)' }} />}
      </div>
      <div className="p-4 flex flex-col gap-2 flex-1">
        <h3 className="text-base font-bold m-0" style={{ color: '#111827' }}>{ev.name}</h3>
        <div className="flex flex-col gap-0.5">
          <span className="text-xs" style={{ color: '#6B7280' }}>{formatDate(ev.time)}</span>
          <span className="text-xs" style={{ color: '#6B7280' }}>{ev.location}</span>
          {ev.price != null && <span className="text-xs" style={{ color: '#6B7280' }}>{ev.price > 0 ? `$${Number(ev.price).toFixed(2)}` : 'Free'}</span>}
        </div>
      </div>
    </button>
  )
}
