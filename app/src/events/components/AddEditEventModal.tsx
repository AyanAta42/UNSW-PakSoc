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

const C   = { border: '#E5E7EB', muted: '#6B7280', dark: '#111827' }
const lbl = 'block text-[11px] font-bold uppercase tracking-wider mb-1.5 text-[#6B7280]'
const inp = { border: `1px solid ${C.border}`, color: C.dark, background: '#FAFAFA' }

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden max-h-[92vh] flex flex-col" onClick={e => e.stopPropagation()}>

        <div className="px-6 py-4 flex items-center justify-between shrink-0" style={{ borderBottom: `1px solid ${C.border}` }}>
          <h2 style={{ color: C.dark }} className="font-extrabold text-base m-0">{isEdit ? 'Edit Event' : 'New Event'}</h2>
          <button onClick={onClose} style={{ color: C.muted }} className="text-xl bg-transparent border-none cursor-pointer leading-none hover:opacity-70">×</button>
        </div>

        <div className="p-6 flex flex-col gap-5 overflow-y-auto">
          {/* Name */}
          <div><label className={lbl}>Event Name</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Eid Gala 2026" style={inp} className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-green-200" /></div>

          {/* Location */}
          <div><label className={lbl}>Location</label>
            <input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Roundhouse, UNSW" style={inp} className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-green-200" /></div>

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
            <div className="relative"><span style={{ color: C.muted }} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold">$</span>
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

        {error && <div className="mx-6 mb-2 px-3.5 py-2.5 rounded-xl text-sm" style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }}>{error}</div>}

        <div className="px-6 pb-5 flex gap-3 shrink-0">
          <button onClick={onClose} style={{ border: `1px solid ${C.border}`, color: C.muted }} className="flex-1 py-2.5 rounded-xl text-sm font-semibold cursor-pointer bg-transparent hover:bg-gray-50 transition-colors">Cancel</button>
          <button onClick={submit} disabled={!canSave || saving}
            style={{ background: canSave ? '#111827' : '#F3F4F6', color: canSave ? '#fff' : '#9CA3AF' }}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold border-none cursor-pointer transition-all disabled:cursor-not-allowed">
            {uploading ? 'Uploading…' : saving ? 'Saving…' : isEdit ? 'Save Changes' : '+ Save as Draft'}
          </button>
        </div>
      </div>
    </div>
  )
}
