import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { DbEvent } from '@/events/types/Event'
import { eventImageUrl } from '@/events/utils/eventImageUrl'
import { formatDate }    from '@/shared/utils/formatDate'
import { ConfirmModal }  from '@/shared/components/ConfirmModal'
import { ACCENT, ACCENT_TEXT, PALETTE } from '@/config/theme'

interface Props {
  event:       DbEvent
  canEdit?:    boolean
  onAnnounce:  (id: string) => void
  onUnpublish: (id: string) => void
  onEdit:      (ev: DbEvent) => void
  onDelete:    (id: string) => void
}

type Pending = 'delete' | 'announce' | 'unpublish' | null

export function AdminEventCard({ event: ev, canEdit = true, onAnnounce, onUnpublish, onEdit, onDelete }: Props) {
  const navigate = useNavigate()
  const [pending, setPending] = useState<Pending>(null)
  const [hovered, setHovered] = useState(false)
  const isLive  = ev.public
  const isEnded = new Date(ev.time) <= new Date()
  const img     = eventImageUrl(ev)

  function confirm() {
    if (pending === 'delete')    onDelete(ev.id)
    if (pending === 'announce')  onAnnounce(ev.id)
    if (pending === 'unpublish') onUnpublish(ev.id)
    setPending(null)
  }

  const modalProps: Record<NonNullable<Pending>, { title: string; message: string; confirmLabel: string; danger: boolean }> = {
    delete:    { title: 'Delete event?',     message: 'This will permanently remove the event and all its tasks. This cannot be undone.',             confirmLabel: 'Delete',    danger: true  },
    announce:  { title: 'Announce event?',   message: 'This will make the event visible to everyone on the public site.',                             confirmLabel: 'Announce',  danger: false },
    unpublish: { title: 'Unpublish event?',  message: 'The event will be hidden from the public site. You can announce it again at any time.',        confirmLabel: 'Unpublish', danger: false },
  }

  return (
    <>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background:   PALETTE.card,
          border:       `1px solid ${hovered ? PALETTE.borderHover : PALETTE.border}`,
          borderRadius: 18,
          boxShadow:    hovered ? PALETTE.shadowMd : PALETTE.shadowSm,
          transition:   'border-color 0.2s, box-shadow 0.2s',
        }}
        className="motion-card overflow-hidden flex flex-col">

        <div className="relative" style={{ height: 120 }}>
          {img
            ? <img src={img} alt={ev.name} className="w-full h-full object-cover" />
            : <div className="w-full h-full" style={{ background: `linear-gradient(135deg, ${PALETTE.cardAlt}, ${PALETTE.card})` }} />
          }
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 55%)' }} />
          {isLive && !isEnded && (
            <div className="absolute top-2 right-2 rounded-full px-2 py-0.5 text-[9px] font-extrabold tracking-widest uppercase"
              style={{ background: 'rgba(34,197,94,0.15)', color: '#4ADE80' }}>Live</div>
          )}
        </div>

        <div className="p-4 flex flex-col gap-2.5 flex-1">
          {canEdit && (
            <div className="flex items-center justify-end gap-1 -mt-1">
              <button onClick={() => onEdit(ev)}
                style={{ color: PALETTE.muted, background: 'transparent', borderRadius: 8 }}
                className="border-none cursor-pointer text-xs px-2 py-1 hover:bg-white/5 hover:text-green-400 transition-all">Edit</button>
              <button onClick={() => setPending('delete')}
                style={{ color: PALETTE.muted, background: 'transparent', borderRadius: 8 }}
                className="border-none cursor-pointer text-xs px-2 py-1 hover:bg-red-500/10 hover:text-red-400 transition-all">Delete</button>
            </div>
          )}
          <h3 className="text-sm font-bold m-0" style={{ color: PALETTE.dark }}>{ev.name}</h3>
          <div className="flex flex-col gap-0.5">
            <span className="text-xs" style={{ color: PALETTE.muted }}>{formatDate(ev.time, ev.end_time)}</span>
            <span className="text-xs" style={{ color: PALETTE.muted }}>{ev.location}</span>
            {ev.price != null && (
              <span className="text-xs" style={{ color: PALETTE.muted }}>
                {ev.price > 0 ? `$${Number(ev.price).toFixed(2)}` : 'Free'}
              </span>
            )}
          </div>
          <div className="flex gap-2 mt-auto pt-1">
            <button onClick={() => navigate(`/subcom/tasks/${ev.id}`)}
              style={{ color: PALETTE.secondary, border: `1px solid ${PALETTE.border}`, background: 'transparent', borderRadius: 12 }}
              className="flex-1 py-1.5 text-xs font-semibold cursor-pointer hover:border-green-500 hover:text-green-400 transition-all">Tasks</button>
            {canEdit && !isEnded && (isLive
              ? <button onClick={() => setPending('unpublish')}
                  style={{ background: PALETTE.cardAlt, color: PALETTE.secondary, borderRadius: 12 }}
                  className="flex-1 border-none py-1.5 text-xs font-semibold cursor-pointer hover:bg-white/5 transition-all">Unpublish</button>
              : <button onClick={() => setPending('announce')}
                  style={{ background: ACCENT, color: ACCENT_TEXT, borderRadius: 12, boxShadow: '0 0 20px rgba(34,197,94,0.25)' }}
                  className="flex-1 border-none py-1.5 text-xs font-bold cursor-pointer hover:opacity-85 transition-all">Announce</button>
            )}
          </div>
        </div>
      </div>

      {pending && (
        <ConfirmModal {...modalProps[pending]} onConfirm={confirm} onCancel={() => setPending(null)} />
      )}
    </>
  )
}
