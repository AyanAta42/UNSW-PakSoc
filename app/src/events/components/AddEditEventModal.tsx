import { useState } from 'react'
import { createEvent }       from '@/events/services/createEvent'
import { updateEvent }       from '@/events/services/updateEvent'
import { uploadEventImage }  from '@/events/services/uploadEventImage'
import { logInteraction }    from '@/interactions/services/logInteraction'
import { ImageUploadZone }   from '@/events/components/ImageUploadZone'
import { TimelineEditor }    from '@/events/components/TimelineEditor'
import { TimeField, buildIso, buildEndIso, parseIsoDate, parseTimeHM, addHoursHM, formatHM } from '@/events/components/TimePickerInput'
import { CtaButtonsEditor }  from '@/events/components/CtaButtonsEditor'
import type { DbEvent, NewEvent, TimelineItem, EventButton } from '@/events/types/Event'
import { DEFAULT_BUTTONS }   from '@/events/types/Event'
import { ACCENT, ACCENT_TEXT, PALETTE } from '@/config/theme'

interface Props {
  onClose:    () => void
  onCreated?: (ev: DbEvent) => void
  onUpdated?: (ev: DbEvent) => void
  event?:     DbEvent
}

const inp = { border: `1px solid ${PALETTE.border}`, color: PALETTE.dark, background: PALETTE.input, borderRadius: 12, colorScheme: 'dark' } as const

function Label({ icon, children }: { icon: string; children: React.ReactNode }) {
  return (
    <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: PALETTE.muted }}>
      <span aria-hidden className="text-[13px] leading-none">{icon}</span>{children}
    </label>
  )
}

export function AddEditEventModal({ onClose, onCreated, onUpdated, event }: Props) {
  const isEdit = !!event

  const start0 = parseTimeHM(event?.time, '17:00')
  const end0   = event?.end_time ? parseTimeHM(event.end_time) : addHoursHM(start0, 2)

  const [name,     setName]     = useState(event?.name ?? '')
  const [location, setLocation] = useState(event?.location ?? '')
  const [price,    setPrice]    = useState(event?.price?.toString() ?? '0')
  const [timeline, setTimeline] = useState<TimelineItem[]>(event?.timeline ?? [])
  const [buttons,  setButtons]  = useState<EventButton[]>(
    event?.buttons?.length ? event.buttons : [...DEFAULT_BUTTONS]
  )

  const [eventDate, setEventDate] = useState(parseIsoDate(event?.time))
  const [startTime, setStartTime] = useState(start0)
  const [endTime,   setEndTime]   = useState(end0)

  const [imageFile,    setImageFile]    = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState(event?.image_url ?? '')
  const [dragOver,     setDragOver]     = useState(false)
  const [saving,       setSaving]       = useState(false)
  const [uploading,    setUploading]    = useState(false)
  const [error,        setError]        = useState('')
  const [mapPreview,   setMapPreview]   = useState(false)

  const crossesMidnight = !!endTime && endTime < startTime

  function handleFile(file: File) {
    if (!file.type.startsWith('image/')) return
    setImageFile(file); setImagePreview(URL.createObjectURL(file))
  }

  async function submit() {
    const startIso = buildIso(eventDate, startTime)
    if (!name.trim() || !startIso) return
    setSaving(true); setError('')
    try {
      let image_url = event?.image_url ?? undefined
      if (imageFile) { setUploading(true); image_url = await uploadEventImage(imageFile); setUploading(false) }

      const endIso = buildEndIso(eventDate, startTime, endTime)

      const fields: NewEvent = {
        name: name.trim(), location,
        time: startIso, end_time: endIso || undefined,
        image_url, price: parseFloat(price) || 0,
        timeline: timeline.map(i => ({ time: i.time.trim(), title: i.title.trim() })).filter(i => i.time && i.title).sort((a, b) => a.time.localeCompare(b.time)),
        buttons:  buttons.filter(b => b.label.trim()),
      }

      if (isEdit && event) {
        await updateEvent(event.id, fields)
        onUpdated?.({ ...event, ...fields })
        void logInteraction('event.updated', 'event', event.id, event.id, `updated event "${fields.name}"`)
      } else {
        const ev = await createEvent(fields)
        onCreated?.(ev)
        void logInteraction('event.created', 'event', ev.id, ev.id, `created event "${ev.name}"`)
      }
    } catch (e) { setError(e instanceof Error ? e.message : 'Something went wrong.') }
    finally { setSaving(false); setUploading(false) }
  }

  const canSave = name.trim() && eventDate

  return (
    <div className="motion-backdrop fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm sm:px-4" onClick={onClose}>
      <div onClick={e => e.stopPropagation()}
        className="motion-modal w-full max-w-md overflow-hidden max-h-[94dvh] sm:max-h-[92dvh] flex flex-col rounded-t-3xl sm:rounded-3xl"
        style={{ background: PALETTE.modal, border: `1px solid ${PALETTE.border}`, boxShadow: PALETTE.shadowLg }}>

        {/* Grab handle (mobile sheet affordance) */}
        <div className="sm:hidden flex justify-center pt-2.5">
          <div className="w-9 h-1 rounded-full" style={{ background: PALETTE.borderHover }} />
        </div>

        <div className="px-6 py-4 flex items-center justify-between shrink-0" style={{ borderBottom: `1px solid ${PALETTE.border}` }}>
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full" style={{ background: ACCENT, boxShadow: '0 0 10px rgba(34,197,94,0.7)' }} />
            <h2 style={{ color: PALETTE.dark }} className="font-extrabold text-base m-0">{isEdit ? 'Edit Event' : 'New Event'}</h2>
          </div>
          <button onClick={onClose} style={{ color: PALETTE.muted, background: PALETTE.cardAlt, border: `1px solid ${PALETTE.border}`, borderRadius: '50%' }} className="w-8 h-8 flex items-center justify-center text-lg cursor-pointer hover:border-white/30 transition-colors">×</button>
        </div>

        <div className="p-5 sm:p-6 flex flex-col gap-5 overflow-y-auto overscroll-contain">
          {/* Name */}
          <div><Label icon="✨">Event Name</Label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Eid Gala 2026" style={inp} className="w-full px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-500/30" /></div>

          {/* Location */}
          <div>
            <Label icon="📍">Location</Label>
            <div className="flex gap-2 items-center">
              <input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Roundhouse, UNSW" style={inp} className="flex-1 min-w-0 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-500/30" />
              <button type="button" onClick={() => location.trim() && setMapPreview(true)} disabled={!location.trim()}
                style={{ borderColor: PALETTE.border, color: location.trim() ? PALETTE.secondary : PALETTE.disabled, background: PALETTE.cardAlt, borderRadius: 12 }}
                className="shrink-0 px-3 py-2.5 text-xs font-semibold border cursor-pointer hover:bg-white/5 transition-colors disabled:cursor-not-allowed whitespace-nowrap">
                Preview
              </button>
            </div>
          </div>

          {/* When — date + times grouped in an accent panel */}
          <div className="p-4 flex flex-col gap-4"
            style={{ background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.18)', borderRadius: 16 }}>
            <div><Label icon="📅">Date</Label>
              <input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)}
                style={inp} className="w-full px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-500/30 cursor-pointer" /></div>
            <div className="grid grid-cols-2 gap-3">
              <TimeField label="Starts" value={startTime} onChange={setStartTime} />
              <TimeField label="Ends"   value={endTime}   onChange={setEndTime} />
            </div>
            {startTime && endTime && (
              <p className="m-0 text-xs font-semibold" style={{ color: '#86EFAC' }}>
                🕐 {formatHM(startTime)} – {formatHM(endTime)}{crossesMidnight && ' (ends next day)'}
              </p>
            )}
          </div>

          {/* Price */}
          <div><Label icon="💵">Ticket Price (AUD)</Label>
            <div className="relative"><span style={{ color: PALETTE.muted }} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold">$</span>
              <input type="number" min="0" step="0.01" value={price} onChange={e => setPrice(e.target.value)} placeholder="0.00"
                style={{ ...inp, paddingLeft: '1.75rem' }} className="w-full px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-500/30" /></div>
            <p style={{ color: PALETTE.disabled }} className="text-[10px] mt-1">Set to 0 for a free event</p></div>

          {/* CTA Buttons */}
          <div><Label icon="🔗">Action Buttons</Label>
            <CtaButtonsEditor buttons={buttons} onChange={setButtons} /></div>

          {/* Timeline */}
          <div><Label icon="🗓️">Event Timeline</Label>
            <TimelineEditor items={timeline} onChange={setTimeline} /></div>

          {/* Image */}
          <div><Label icon="🖼️">Event Image</Label>
            <ImageUploadZone preview={imagePreview} dragOver={dragOver} onFile={handleFile} onClear={() => { setImageFile(null); setImagePreview('') }} onDragOver={setDragOver} /></div>
        </div>

        {error && (
          <div className="mx-6 mb-2 px-3.5 py-2.5 text-sm"
            style={{ background: 'rgba(239,68,68,0.1)', color: '#F87171', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 12 }}>{error}</div>
        )}

        <div className="px-5 sm:px-6 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] flex gap-3 shrink-0" style={{ borderTop: `1px solid ${PALETTE.border}` }}>
          <button onClick={onClose}
            style={{ border: `1px solid ${PALETTE.border}`, color: PALETTE.secondary, borderRadius: 14, background: 'transparent' }}
            className="flex-1 py-2.5 text-sm font-semibold cursor-pointer hover:bg-white/5 transition-colors">Cancel</button>
          <button onClick={submit} disabled={!canSave || saving}
            style={{ background: canSave ? ACCENT : PALETTE.cardAlt, color: canSave ? ACCENT_TEXT : PALETTE.disabled, borderRadius: 14, boxShadow: canSave ? '0 0 20px rgba(34,197,94,0.25)' : 'none' }}
            className="flex-1 py-2.5 text-sm font-bold border-none cursor-pointer transition-all disabled:cursor-not-allowed">
            {uploading ? 'Uploading…' : saving ? 'Saving…' : isEdit ? 'Save Changes' : '+ Save as Draft'}
          </button>
        </div>
      </div>
      {mapPreview && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4" onClick={() => setMapPreview(false)}>
          <div onClick={e => e.stopPropagation()} className="w-full max-w-sm overflow-hidden"
            style={{ background: PALETTE.modal, borderRadius: 20, border: `1px solid ${PALETTE.border}`, boxShadow: PALETTE.shadowLg }}>
            <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: `1px solid ${PALETTE.border}` }}>
              <span className="text-sm font-bold truncate pr-2" style={{ color: PALETTE.dark }}>{location}</span>
              <button onClick={() => setMapPreview(false)}
                style={{ background: PALETTE.cardAlt, border: `1px solid ${PALETTE.border}`, color: PALETTE.muted, borderRadius: '50%' }}
                className="shrink-0 w-7 h-7 flex items-center justify-center cursor-pointer hover:border-white/30 transition-colors text-base leading-none">×</button>
            </div>
            <div style={{ height: 260 }}>
              <iframe
                title="Location preview"
                src={`https://maps.google.com/maps?q=${encodeURIComponent(location)}&output=embed&z=15`}
                className="w-full h-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
