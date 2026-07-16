import { useState } from 'react'
import { createEvent }       from '@/events/services/createEvent'
import { updateEvent }       from '@/events/services/updateEvent'
import { uploadEventImage }  from '@/events/services/uploadEventImage'
import { ImageUploadZone }   from '@/events/components/ImageUploadZone'
import { TimelineEditor }    from '@/events/components/TimelineEditor'
import { TimeSelect12h, buildIso, parseIsoDate, parseTime12, addHours12 } from '@/events/components/TimePickerInput'
import { CtaButtonsEditor }  from '@/events/components/CtaButtonsEditor'
import type { DbEvent, NewEvent, TimelineItem, EventButton } from '@/events/types/Event'
import { DEFAULT_BUTTONS }   from '@/events/types/Event'

interface Props {
  onClose:    () => void
  onCreated?: (ev: DbEvent) => void
  onUpdated?: (ev: DbEvent) => void
  event?:     DbEvent
}

import { ACCENT, ACCENT_TEXT, PALETTE } from '@/config/theme'

const lbl = 'block text-[11px] font-bold uppercase tracking-wider mb-1.5 text-[#94A3B8]'
const inp = { border: `1px solid ${PALETTE.border}`, color: PALETTE.dark, background: PALETTE.input }

export function AddEditEventModal({ onClose, onCreated, onUpdated, event }: Props) {
  const isEdit = !!event

  const start0 = parseTime12(event?.time, { hour: 5, minute: 0, period: 'PM' })
  const end0   = event?.end_time ? parseTime12(event.end_time) : addHours12(start0, 2)

  const [name,     setName]     = useState(event?.name ?? '')
  const [location, setLocation] = useState(event?.location ?? '')
  const [price,    setPrice]    = useState(event?.price?.toString() ?? '0')
  const [timeline, setTimeline] = useState<TimelineItem[]>(event?.timeline ?? [])
  const [buttons,  setButtons]  = useState<EventButton[]>(
    event?.buttons?.length ? event.buttons : [...DEFAULT_BUTTONS]
  )

  const [eventDate,   setEventDate]   = useState(parseIsoDate(event?.time))
  const [startHour,   setStartHour]   = useState(start0.hour)
  const [startMinute, setStartMinute] = useState(start0.minute)
  const [startPeriod, setStartPeriod] = useState(start0.period)
  const [endHour,     setEndHour]     = useState(end0.hour)
  const [endMinute,   setEndMinute]   = useState(end0.minute)
  const [endPeriod,   setEndPeriod]   = useState(end0.period)

  const [imageFile,    setImageFile]    = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState(event?.image_url ?? '')
  const [dragOver,     setDragOver]     = useState(false)
  const [saving,       setSaving]       = useState(false)
  const [uploading,    setUploading]    = useState(false)
  const [error,        setError]        = useState('')
  const [mapPreview,   setMapPreview]   = useState(false)

  function handleFile(file: File) {
    if (!file.type.startsWith('image/')) return
    setImageFile(file); setImagePreview(URL.createObjectURL(file))
  }

  async function submit() {
    const startIso = buildIso(eventDate, startHour, startMinute, startPeriod)
    if (!name.trim() || !startIso) return
    setSaving(true); setError('')
    try {
      let image_url = event?.image_url ?? undefined
      if (imageFile) { setUploading(true); image_url = await uploadEventImage(imageFile); setUploading(false) }

      const endIso = buildIso(eventDate, endHour, endMinute, endPeriod)

      const fields: NewEvent = {
        name: name.trim(), location,
        time: startIso, end_time: endIso || undefined,
        image_url, price: parseFloat(price) || 0,
        timeline: timeline.map(i => ({ time: i.time.trim(), title: i.title.trim() })).filter(i => i.time && i.title).sort((a, b) => a.time.localeCompare(b.time)),
        buttons:  buttons.filter(b => b.label.trim()),
      }

      if (isEdit && event) { await updateEvent(event.id, fields); onUpdated?.({ ...event, ...fields }) }
      else                 { const ev = await createEvent(fields); onCreated?.(ev) }
    } catch (e) { setError(e instanceof Error ? e.message : 'Something went wrong.') }
    finally { setSaving(false); setUploading(false) }
  }

  const canSave = name.trim() && eventDate

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="w-full max-w-md overflow-hidden max-h-[92vh] flex flex-col"
        style={{ background: PALETTE.modal, borderRadius: 24, border: `1px solid ${PALETTE.border}`, boxShadow: PALETTE.shadowLg }}>

        <div className="px-6 py-4 flex items-center justify-between shrink-0" style={{ borderBottom: `1px solid ${PALETTE.border}` }}>
          <h2 style={{ color: PALETTE.dark }} className="font-extrabold text-base m-0">{isEdit ? 'Edit Event' : 'New Event'}</h2>
          <button onClick={onClose} style={{ color: PALETTE.muted, background: PALETTE.cardAlt, border: `1px solid ${PALETTE.border}`, borderRadius: '50%' }} className="w-8 h-8 flex items-center justify-center text-lg cursor-pointer hover:border-white/30 transition-colors">×</button>
        </div>

        <div className="p-6 flex flex-col gap-5 overflow-y-auto">
          {/* Name */}
          <div><label className={lbl}>Event Name</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Eid Gala 2026" style={inp} className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-green-200" /></div>

          {/* Location */}
          <div>
            <label className={lbl}>Location</label>
            <div className="flex gap-2 items-center">
              <input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Roundhouse, UNSW" style={inp} className="flex-1 px-3.5 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-green-200" />
              <button type="button" onClick={() => location.trim() && setMapPreview(true)} disabled={!location.trim()}
                style={{ borderColor: PALETTE.border, color: location.trim() ? PALETTE.secondary : PALETTE.disabled, background: PALETTE.cardAlt, borderRadius: 12 }}
                className="shrink-0 px-3 py-2.5 text-xs font-semibold border cursor-pointer hover:bg-white/5 transition-colors disabled:cursor-not-allowed whitespace-nowrap">
                Preview
              </button>
            </div>
          </div>

          {/* Date & times */}
          <div><label className={lbl}>Date</label>
            <input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)}
              style={inp} className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-green-200" /></div>
          <div className="grid grid-cols-2 gap-3">
            <TimeSelect12h label="Start Time"
              hour={startHour} minute={startMinute} period={startPeriod}
              onHour={setStartHour} onMinute={setStartMinute} onPeriod={setStartPeriod} />
            <TimeSelect12h label="End Time"
              hour={endHour} minute={endMinute} period={endPeriod}
              onHour={setEndHour} onMinute={setEndMinute} onPeriod={setEndPeriod} />
          </div>

          {/* Price */}
          <div><label className={lbl}>Ticket Price (AUD)</label>
            <div className="relative"><span style={{ color: PALETTE.muted }} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold">$</span>
              <input type="number" min="0" step="0.01" value={price} onChange={e => setPrice(e.target.value)} placeholder="0.00"
                style={{ ...inp, paddingLeft: '1.75rem' }} className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-green-200" /></div>
            <p style={{ color: '#9CA3AF' }} className="text-[10px] mt-1">Set to 0 for a free event</p></div>

          {/* CTA Buttons */}
          <div><label className={lbl}>Action Buttons</label>
            <CtaButtonsEditor buttons={buttons} onChange={setButtons} /></div>

          {/* Timeline */}
          <div><label className={lbl}>Event Timeline</label>
            <TimelineEditor items={timeline} onChange={setTimeline} /></div>

          {/* Image */}
          <div><label className={lbl}>Event Image</label>
            <ImageUploadZone preview={imagePreview} dragOver={dragOver} onFile={handleFile} onClear={() => { setImageFile(null); setImagePreview('') }} onDragOver={setDragOver} /></div>
        </div>

        {error && (
          <div className="mx-6 mb-2 px-3.5 py-2.5 text-sm"
            style={{ background: 'rgba(239,68,68,0.1)', color: '#F87171', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 12 }}>{error}</div>
        )}

        <div className="px-6 pb-5 flex gap-3 shrink-0">
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
