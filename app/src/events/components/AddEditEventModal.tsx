import { useState } from 'react'
import { createEvent }       from '@/events/services/createEvent'
import { updateEvent }       from '@/events/services/updateEvent'
import { uploadEventImage }  from '@/events/services/uploadEventImage'
import { ImageUploadZone }   from '@/events/components/ImageUploadZone'
import { TimelineEditor }    from '@/events/components/TimelineEditor'
import { TimePickerInput, buildIso, parseIso } from '@/events/components/TimePickerInput'
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

const DEFAULT_CATS = ['Task', 'Game', 'Stall']

export function AddEditEventModal({ onClose, onCreated, onUpdated, event }: Props) {
  const isEdit = !!event

  const start0 = parseIso(event?.time)
  const end0   = parseIso(event?.end_time)

  const [name,     setName]     = useState(event?.name ?? '')
  const [location, setLocation] = useState(event?.location ?? '')
  const [price,    setPrice]    = useState(event?.price?.toString() ?? '0')
  const [timeline, setTimeline] = useState<TimelineItem[]>(event?.timeline ?? [])
  const [buttons,  setButtons]  = useState<EventButton[]>(
    event?.buttons?.length ? event.buttons : [...DEFAULT_BUTTONS]
  )
  const [customCats, setCustomCats] = useState<string[]>(event?.custom_categories ?? [])
  const [newCat, setNewCat]         = useState('')

  const [startDate,   setStartDate]   = useState(start0.date)
  const [startHour,   setStartHour]   = useState(start0.hour)
  const [startMinute, setStartMinute] = useState(start0.minute)
  const [endDate,     setEndDate]     = useState(end0.date || start0.date)
  const [endHour,     setEndHour]     = useState(end0.hour || start0.hour + 2)
  const [endMinute,   setEndMinute]   = useState(end0.minute)

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

  function addCustomCat() {
    const v = newCat.trim()
    if (!v || DEFAULT_CATS.includes(v) || customCats.includes(v)) return
    setCustomCats(p => [...p, v]); setNewCat('')
  }

  async function submit() {
    const startIso = buildIso(startDate, startHour, startMinute)
    if (!name.trim() || !startIso) return
    setSaving(true); setError('')
    try {
      let image_url = event?.image_url ?? undefined
      if (imageFile) { setUploading(true); image_url = await uploadEventImage(imageFile); setUploading(false) }

      const endIso = buildIso(endDate || startDate, endHour, endMinute)

      const fields: NewEvent = {
        name: name.trim(), location,
        time: startIso, end_time: endIso || undefined,
        image_url, price: parseFloat(price) || 0,
        timeline: timeline.map(i => ({ time: i.time.trim(), title: i.title.trim() })).filter(i => i.time && i.title).sort((a, b) => a.time.localeCompare(b.time)),
        buttons:  buttons.filter(b => b.label.trim()),
        custom_categories: customCats,
      }

      if (isEdit && event) { await updateEvent(event.id, fields); onUpdated?.({ ...event, ...fields }) }
      else                 { const ev = await createEvent(fields); onCreated?.(ev) }
    } catch (e) { setError(e instanceof Error ? e.message : 'Something went wrong.') }
    finally { setSaving(false); setUploading(false) }
  }

  const canSave = name.trim() && startDate
  const allCats = [...DEFAULT_CATS, ...customCats]

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

          {/* Start time */}
          <TimePickerInput label="Start Date & Time"
            date={startDate} hour={startHour} minute={startMinute}
            onDate={setStartDate} onHour={setStartHour} onMinute={setStartMinute} />

          {/* End time */}
          <TimePickerInput label="End Date & Time"
            date={endDate || startDate} hour={endHour} minute={endMinute}
            onDate={setEndDate} onHour={setEndHour} onMinute={setEndMinute} />

          {/* Price */}
          <div><label className={lbl}>Ticket Price (AUD)</label>
            <div className="relative"><span style={{ color: C.muted }} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold">$</span>
              <input type="number" min="0" step="0.01" value={price} onChange={e => setPrice(e.target.value)} placeholder="0.00"
                style={{ ...inp, paddingLeft: '1.75rem' }} className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-green-200" /></div>
            <p style={{ color: '#9CA3AF' }} className="text-[10px] mt-1">Set to 0 for a free event</p></div>

          {/* CTA Buttons */}
          <div><label className={lbl}>Action Buttons</label>
            <CtaButtonsEditor buttons={buttons} onChange={setButtons} /></div>

          {/* Custom task categories */}
          <div>
            <label className={lbl}>Task Categories</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {allCats.map(c => (
                <span key={c} className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold"
                  style={{ background: DEFAULT_CATS.includes(c) ? '#F3F4F6' : '#DCFCE7', color: DEFAULT_CATS.includes(c) ? '#6B7280' : '#16A34A', border: '1px solid #E5E7EB' }}>
                  {c}
                  {!DEFAULT_CATS.includes(c) && (
                    <button type="button" onClick={() => setCustomCats(p => p.filter(x => x !== c))}
                      className="bg-transparent border-none cursor-pointer text-sm leading-none hover:text-red-400 p-0 ml-0.5">×</button>
                  )}
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={newCat} onChange={e => setNewCat(e.target.value)} onKeyDown={e => e.key === 'Enter' && addCustomCat()}
                placeholder="Add custom category…" style={inp} className="flex-1 px-3 py-2 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-200" />
              <button type="button" onClick={addCustomCat} disabled={!newCat.trim()}
                style={{ background: newCat.trim() ? '#22C55E' : '#F3F4F6', color: newCat.trim() ? '#fff' : '#9CA3AF' }}
                className="px-3 py-2 rounded-lg text-xs font-bold border-none cursor-pointer transition-colors shrink-0">Add</button>
            </div>
            <p style={{ color: '#9CA3AF' }} className="text-[10px] mt-1">Grey = default (always available). Green = this event only.</p>
          </div>

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
