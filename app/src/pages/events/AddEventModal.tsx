import { useState, useRef, DragEvent } from 'react'
import { createEvent, updateEvent, uploadEventImage, type NewEvent, type DbEvent, type TimelineItem } from '@/lib/db'

const emptyTimeline = (): TimelineItem => ({ time: '', title: '' })

interface Props {
  onClose:    () => void
  onCreated?: (ev: DbEvent) => void
  onUpdated?: (ev: DbEvent) => void
  event?:     DbEvent
}

const C = {
  border: '#E5E7EB',
  muted:  '#6B7280',
  dark:   '#111827',
}
const A = '#22C55E'

export function AddEventModal({ onClose, onCreated, onUpdated, event }: Props) {
  const isEdit = !!event
  const [name, setName]         = useState(event?.name ?? '')
  const [location, setLocation] = useState(event?.location ?? '')
  const [datetime, setDatetime] = useState(event ? new Date(event.time).toISOString().slice(0, 16) : '')
  const [price, setPrice]       = useState(event?.price?.toString() ?? '0')
  const [timeline, setTimeline]   = useState<TimelineItem[]>(event?.timeline?.length ? event.timeline : [])
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState('')

  // image state
  const [imageFile, setImageFile]       = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>(event?.image_url ?? '')
  const [dragOver, setDragOver]         = useState(false)
  const [uploading, setUploading]       = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  function handleFile(file: File) {
    if (!file.type.startsWith('image/')) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  function onDrop(e: DragEvent) {
    e.preventDefault(); setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  async function submit() {
    if (!name.trim() || !datetime) return
    setSaving(true)
    try {
      let image_url = event?.image_url ?? undefined

      if (imageFile) {
        setUploading(true)
        image_url = await uploadEventImage(imageFile)
        setUploading(false)
      }

      const cleanedTimeline = timeline
        .map(item => ({ time: item.time.trim(), title: item.title.trim() }))
        .filter(item => item.time && item.title)
        .sort((a, b) => a.time.localeCompare(b.time))

      const fields: NewEvent = {
        name: name.trim(),
        location,
        time: new Date(datetime).toISOString(),
        image_url,
        price: parseFloat(price) || 0,
        timeline: cleanedTimeline,
      }

      if (isEdit && event) {
        await updateEvent(event.id, fields)
        onUpdated?.({ ...event, ...fields })
      } else {
        const ev = await createEvent(fields)
        onCreated?.(ev)
      }
    } catch (e) {
      console.error(e)
      setError(e instanceof Error ? e.message : 'Something went wrong.')
    }
    finally { setSaving(false); setUploading(false) }
  }

  const inp = { border: `1px solid ${C.border}`, color: C.dark, background: '#FAFAFA' }
  const lbl = 'block text-[11px] font-bold uppercase tracking-wider mb-1.5'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${C.border}` }}>
          <h2 style={{ color: C.dark }} className="font-extrabold text-base m-0">{isEdit ? 'Edit Event' : 'New Event'}</h2>
          <button onClick={onClose} style={{ color: C.muted }} className="text-xl bg-transparent border-none cursor-pointer leading-none hover:opacity-70">×</button>
        </div>

        <div className="p-6 flex flex-col gap-4 overflow-y-auto">

          {/* Event Name */}
          <div>
            <label style={{ color: C.muted }} className={lbl}>Event Name</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Eid Gala 2026"
              style={inp} className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-green-200" />
          </div>

          {/* Location */}
          <div>
            <label style={{ color: C.muted }} className={lbl}>Location</label>
            <input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Roundhouse, UNSW"
              style={inp} className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-green-200" />
          </div>

          {/* Date & Time */}
          <div>
            <label style={{ color: C.muted }} className={lbl}>Date &amp; Time</label>
            <input type="datetime-local" value={datetime} onChange={e => setDatetime(e.target.value)}
              style={inp} className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-green-200" />
          </div>

          {/* Price */}
          <div>
            <label style={{ color: C.muted }} className={lbl}>Ticket Price (AUD)</label>
            <div className="relative">
              <span style={{ color: C.muted }} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold">$</span>
              <input
                type="number" min="0" step="0.01" value={price}
                onChange={e => setPrice(e.target.value)}
                placeholder="0.00"
                style={{ ...inp, paddingLeft: '1.75rem' }}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-green-200"
              />
            </div>
            <p style={{ color: '#9CA3AF' }} className="text-[10px] mt-1">Set to 0 for a free event</p>
          </div>

          {/* Timeline */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label style={{ color: C.muted }} className={lbl + ' mb-0'}>Event Timeline</label>
              <button type="button" onClick={() => setTimeline(items => [...items, emptyTimeline()])}
                style={{ color: A }}
                className="text-xs font-semibold bg-transparent border-none cursor-pointer hover:opacity-80">
                + Add item
              </button>
            </div>
            {timeline.length === 0 && (
              <p style={{ color: '#9CA3AF' }} className="text-xs m-0">Optional schedule shown on the home page sidebar.</p>
            )}
            <div className="flex flex-col gap-2">
              {timeline.map((item, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input
                    type="time"
                    value={item.time}
                    onChange={e => setTimeline(items => items.map((row, idx) => idx === i ? { ...row, time: e.target.value } : row))}
                    style={inp}
                    className="w-[110px] shrink-0 px-2.5 py-2 rounded-xl text-sm outline-none focus:ring-2 focus:ring-green-200"
                  />
                  <input
                    value={item.title}
                    onChange={e => setTimeline(items => items.map((row, idx) => idx === i ? { ...row, title: e.target.value } : row))}
                    placeholder="e.g. Kahoot"
                    style={inp}
                    className="flex-1 px-3 py-2 rounded-xl text-sm outline-none focus:ring-2 focus:ring-green-200"
                  />
                  <button type="button" onClick={() => setTimeline(items => items.filter((_, idx) => idx !== i))}
                    style={{ color: '#9CA3AF' }}
                    className="bg-transparent border-none cursor-pointer text-lg leading-none hover:text-red-500 px-1">
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Image upload */}
          <div>
            <label style={{ color: C.muted }} className={lbl}>Event Image</label>

            {imagePreview ? (
              <div className="relative rounded-xl overflow-hidden" style={{ height: 140 }}>
                <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />
                <button
                  onClick={() => { setImageFile(null); setImagePreview('') }}
                  className="absolute top-2 right-2 bg-black/60 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs border-none cursor-pointer hover:bg-black/80">
                  ×
                </button>
                <div className="absolute bottom-2 right-2">
                  <button onClick={() => fileRef.current?.click()}
                    style={{ background: 'rgba(0,0,0,0.55)', color: '#fff' }}
                    className="text-xs px-2.5 py-1 rounded-lg border-none cursor-pointer hover:opacity-80">
                    Change
                  </button>
                </div>
              </div>
            ) : (
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                onClick={() => fileRef.current?.click()}
                style={{
                  border: `2px dashed ${dragOver ? A : C.border}`,
                  background: dragOver ? 'rgba(34,197,94,0.05)' : '#FAFAFA',
                }}
                className="rounded-xl h-28 flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-colors">
                <svg width="24" height="24" fill="none" stroke={C.muted} strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                </svg>
                <span style={{ color: C.muted }} className="text-xs font-medium">Drag & drop or click to upload</span>
                <span style={{ color: '#9CA3AF' }} className="text-[10px]">PNG, JPG, WEBP</span>
              </div>
            )}

            <input ref={fileRef} type="file" accept="image/*" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
          </div>

        </div>

        {/* Error */}
        {error && (
          <div className="mx-6 mb-2 px-3.5 py-2.5 rounded-xl text-sm" style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }}>
            {error}
          </div>
        )}

        {/* Footer */}
        <div className="px-6 pb-5 flex gap-3">
          <button onClick={onClose} style={{ border: `1px solid ${C.border}`, color: C.muted }}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold cursor-pointer bg-transparent hover:bg-gray-50 transition-colors">
            Cancel
          </button>
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
