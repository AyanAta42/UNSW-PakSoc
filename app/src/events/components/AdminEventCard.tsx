import { useNavigate } from 'react-router-dom'
import type { DbEvent } from '@/events/types/Event'
import { eventImageUrl } from '@/events/utils/eventImageUrl'
import { formatDate }    from '@/shared/utils/formatDate'

interface Props {
  event:       DbEvent
  onAnnounce:  (id: string) => void
  onUnpublish: (id: string) => void
  onEdit:      (ev: DbEvent) => void
  onDelete:    (id: string) => void
}

export function AdminEventCard({ event: ev, onAnnounce, onUnpublish, onEdit, onDelete }: Props) {
  const navigate = useNavigate()
  const isLive   = ev.public
  const isEnded  = new Date(ev.time) <= new Date()
  const img      = eventImageUrl(ev)

  return (
    <div className="bg-white rounded-xl overflow-hidden border shadow-sm flex flex-col transition-all"
      style={{ borderColor: isEnded ? '#E5E7EB' : isLive ? '#86EFAC' : '#E5E7EB' }}>
      <div className="relative" style={{ height: 120 }}>
        {img ? <img src={img} alt={ev.name} className="w-full h-full object-cover" />
              : <div className="w-full h-full" style={{ background: 'linear-gradient(135deg,#DCFCE7,#BBF7D0)' }} />}
      </div>
      <div className="p-4 flex flex-col gap-2.5 flex-1">
        <div className="flex items-center justify-end gap-1 -mt-1">
          <button onClick={() => onEdit(ev)} className="text-gray-400 hover:text-green-600 bg-transparent border-none cursor-pointer text-xs px-2 py-1 rounded-lg hover:bg-gray-50 transition-all">Edit</button>
          <button onClick={() => onDelete(ev.id)} className="text-gray-400 hover:text-red-500 bg-transparent border-none cursor-pointer text-xs px-2 py-1 rounded-lg hover:bg-red-50 transition-all">Delete</button>
        </div>
        <h3 className="text-base font-bold m-0" style={{ color: '#111827' }}>{ev.name}</h3>
        <div className="flex flex-col gap-0.5">
          <span className="text-xs" style={{ color: '#6B7280' }}>{formatDate(ev.time)}</span>
          <span className="text-xs" style={{ color: '#6B7280' }}>{ev.location}</span>
          {ev.price != null && <span className="text-xs" style={{ color: '#6B7280' }}>{ev.price > 0 ? `$${Number(ev.price).toFixed(2)}` : 'Free'}</span>}
        </div>
        <div className="flex gap-2 mt-auto pt-1">
          <button onClick={() => navigate(`/subcom/tasks/${ev.id}`)}
            className="flex-1 bg-transparent border rounded-xl py-1.5 text-xs font-semibold cursor-pointer hover:border-green-500 hover:text-green-600 transition-all"
            style={{ borderColor: '#E5E7EB', color: '#6B7280' }}>Tasks</button>
          {!isEnded && (isLive
            ? <button onClick={() => onUnpublish(ev.id)} className="flex-1 bg-gray-100 text-gray-500 border-none rounded-xl py-1.5 text-xs font-semibold cursor-pointer hover:bg-gray-200 transition-all">Unpublish</button>
            : <button onClick={() => onAnnounce(ev.id)}  className="flex-1 text-white border-none rounded-xl py-1.5 text-xs font-bold cursor-pointer hover:opacity-90 transition-all shadow-sm" style={{ background: '#22C55E' }}>Announce</button>
          )}
        </div>
      </div>
    </div>
  )
}
