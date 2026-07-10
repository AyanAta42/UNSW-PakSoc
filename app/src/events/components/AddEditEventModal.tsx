import { useState } from 'react'
import { createEvent }       from '@/events/services/createEvent'
import { updateEvent }       from '@/events/services/updateEvent'
import { uploadEventImage }  from '@/events/services/uploadEventImage'
import { ImageUploadZone }   from '@/events/components/ImageUploadZone'
import { TimelineEditor }    from '@/events/components/TimelineEditor'
import type { DbEvent, NewEvent, TimelineItem } from '@/events/types/Event'

interface Props {
  onClose:    () => void
  onCreated?: (ev: DbEvent) => void
  onUpdated?: (ev: DbEvent) => void
  event?:     DbEvent
}

const C   = { border: '#E5E7EB', muted: '#6B7280', dark: '#111827' }
const lbl = 'block text-[11px] font-bold uppercase tracking-wider mb-1.5'
const inp = { border: `1px solid ${C.border}`, color: C.dark, background: '#FAFAFA' }

export function AddEditEventModal({ onClose, onCreated, onUpdated, event }: Props) {
  const isEdit = !!event
  const [name, setName]         = useState(event?.name ?? '')
  const [location, setLocation] = useState(event?.location ?? '')
  const [datetime, setDatetime] = useState(event ? new Date(event.time).toISOString().slice(0, 16) : '')
  const [price, setPrice]       = useState(event?.price?.toString() ?? '0')
  const [timeline, setTimeline] = useState<TimelineItem[]>(event?.timeline?.length ? event.timeline : [])
  const [imageFile, setImageFile]       = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>(event?.image_url ?? '')
  const [dragOver, setDragOver]         = useState(false)
  const [saving, setSaving]             = useState(false)
  const [uploading, setUploading]       = useState(false)
  const [error, setError]               = useState('')

  function handleFile(file: File) {
    if (!file.type.startsWith('image/')) return
    setImageFile(file); setImagePreview(URL.createObjectURL(file))
  }

  async function submit() {
    if (!name.trim() || !datetime) return
    setSaving(true)
    try {
      let image_url = event?.image_url ?? undefined
      if (imageFile) { setUploading(true); image_url = await uploadEventImage(imageFile); setUploading(false) }
      const fields: NewEvent = {
        name: name.trim(), location,
        time: new Date(datetime).toISOString(),
        image_url, price: parseFloat(price) || 0,
        timeline: timeline.map(i => ({ time: i.time.trim(), title: i.title.trim() })).filter(i => i.time && i.title).sort((a, b) => a.time.localeCompare(b.time)),
      }
      if (isEdit && event) { await updateEvent(event.id, fields); onUpdated?.({ ...event, ...fields }) }
      else                 { const ev = await createEvent(fields); onCreated?.(ev) }
    } catch (e) { console.error(e); setError(e instanceof Error ? e.message : 'Something went wrong.') }
    finally { setSaving(false); setUploading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${C.border}` }}>
          <h2 style={{ color: C.dark }} className="font-extrabold text-base m-0">{isEdit ? 'Edit Event' : 'New Event'}</h2>
          <button onClick={onClose} style={{ color: C.muted }} className="text-xl bg-transparent border-none cursor-pointer leading-none hover:opacity-70">×</button>
        </div>
        <div className="p-6 flex flex-col gap-4 overflow-y-auto">
          <div><label style={{ color: C.muted }} className={lbl}>Event Name</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Eid Gala 2026" style={inp} className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-green-200" /></div>
          <div><label style={{ color: C.muted }} className={lbl}>Location</label>
            <input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Roundhouse, UNSW" style={inp} className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-green-200" /></div>
          <div><label style={{ color: C.muted }} className={lbl}>Date &amp; Time</label>
            <input type="datetime-local" value={datetime} onChange={e => setDatetime(e.target.value)} style={inp} className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-green-200" /></div>
          <div><label style={{ color: C.muted }} className={lbl}>Ticket Price (AUD)</label>
            <div className="relative"><span style={{ color: C.muted }} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold">$</span>
              <input type="number" min="0" step="0.01" value={price} onChange={e => setPrice(e.target.value)} placeholder="0.00" style={{ ...inp, paddingLeft: '1.75rem' }} className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-green-200" /></div>
            <p style={{ color: '#9CA3AF' }} className="text-[10px] mt-1">Set to 0 for a free event</p></div>
          <div><label style={{ color: C.muted }} className={lbl}>Event Timeline</label>
            <TimelineEditor items={timeline} onChange={setTimeline} /></div>
          <div><label style={{ color: C.muted }} className={lbl}>Event Image</label>
            <ImageUploadZone preview={imagePreview} dragOver={dragOver} onFile={handleFile} onClear={() => { setImageFile(null); setImagePreview('') }} onDragOver={setDragOver} /></div>
        </div>
        {error && <div className="mx-6 mb-2 px-3.5 py-2.5 rounded-xl text-sm" style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }}>{error}</div>}
        <div className="px-6 pb-5 flex gap-3">
          <button onClick={onClose} style={{ border: `1px solid ${C.border}`, color: C.muted }} className="flex-1 py-2.5 rounded-xl text-sm font-semibold cursor-pointer bg-transparent hover:bg-gray-50 transition-colors">Cancel</button>
          <button onClick={submit} disabled={!name.trim() || !datetime || saving}
            style={{ background: name.trim() && datetime ? '#111827' : '#F3F4F6', color: name.trim() && datetime ? '#fff' : '#9CA3AF' }}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold border-none cursor-pointer transition-all disabled:cursor-not-allowed">
            {uploading ? 'Uploading…' : saving ? 'Saving…' : isEdit ? 'Save Changes' : '+ Save as Draft'}
          </button>
        </div>
      </div>
    </div>
  )
}
