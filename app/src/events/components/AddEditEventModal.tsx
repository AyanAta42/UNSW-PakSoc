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
import { useSheetSwipe }     from '@/shared/hooks/useSheetSwipe'
import { toast, errorMessage } from '@/shared/toast/toast'
import { ConfirmModal }      from '@/shared/components/ConfirmModal'

interface Props {
  onClose:          () => void
  onCreated?:       (ev: DbEvent) => void
  onCreateSettled?: (tempId: string, ev: DbEvent | null) => void
  onUpdated?:       (ev: DbEvent) => void
  onDelete?:        (id: string) => void
  event?:           DbEvent
}

// No `colorScheme: 'dark'` here — on a plain text field it makes mobile
// browsers misrender the native caret/selection chrome; the Date field below
// adds it back explicitly since its native calendar popover does need it.
const inp = { border: `1px solid ${PALETTE.border}`, color: PALETTE.dark, background: PALETTE.input, borderRadius: 12 } as const

/** Compact professional line icons for field labels (replaces emoji). */
function Ic({ path }: { path: React.ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="shrink-0">
      {path}
    </svg>
  )
}

const ICON = {
  name:     <><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" /></>,
  location: <><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></>,
  date:     <><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></>,
  price:    <><line x1="12" y1="2" x2="12" y2="22" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></>,
  link:     <><path d="M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></>,
  note:     <><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></>,
  timeline: <><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></>,
  image:    <><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></>,
  clock:    <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
} as const

function Label({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: PALETTE.muted }}>
      <Ic path={icon} />{children}
    </label>
  )
}

export function AddEditEventModal({ onClose, onCreated, onCreateSettled, onUpdated, onDelete, event }: Props) {
  const isEdit = !!event
  const [confirmDelete, setConfirmDelete] = useState(false)

  const start0 = parseTimeHM(event?.time, '17:00')
  const end0   = event?.end_time ? parseTimeHM(event.end_time) : addHoursHM(start0, 2)

  const [name,     setName]     = useState(event?.name ?? '')
  const [location, setLocation] = useState(event?.location ?? '')
  const [price,    setPrice]    = useState(event?.price?.toString() ?? '0')
  const [bannerNote, setBannerNote] = useState(event?.banner_note ?? '')
  const [timeline, setTimeline] = useState<TimelineItem[]>(event?.timeline ?? [])
  const [buttons,  setButtons]  = useState<EventButton[]>(
    event?.buttons?.length ? event.buttons : [...DEFAULT_BUTTONS]
  )

  const [eventDate, setEventDate] = useState(parseIsoDate(event?.time) || new Date().toLocaleDateString('en-CA'))
  const [startTime, setStartTime] = useState(start0)
  const [endTime,   setEndTime]   = useState(end0)

  const [imageFile,    setImageFile]    = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState(event?.image_url ?? '')
  const [dragOver,     setDragOver]     = useState(false)
  const [mapPreview,   setMapPreview]   = useState(false)

  const { sheetRef, scrollRef, close, backdropOpacity, sheetStyle, touchHandlers } = useSheetSwipe(onClose)

  const crossesMidnight = !!endTime && endTime < startTime

  function handleFile(file: File) {
    if (!file.type.startsWith('image/')) return
    setImageFile(file); setImagePreview(URL.createObjectURL(file))
  }

  // Reflects the change instantly (locally and, via realtime, on every other
  // device) instead of waiting on the image upload + network round trip.
  // The write happens in the background; failures roll back and toast.
  async function submit() {
    const startIso = buildIso(eventDate, startTime)
    if (!name.trim() || !startIso) return

    const endIso = buildEndIso(eventDate, startTime, endTime)
    // A freshly-picked file already has a local blob preview URL — use it as
    // the optimistic image so the picture shows immediately, then swap in the
    // real storage URL once the upload finishes.
    const optimisticImageUrl = imageFile ? imagePreview : (event?.image_url ?? undefined)

    const fields: NewEvent = {
      name: name.trim(), location,
      time: startIso, end_time: endIso || undefined,
      image_url: optimisticImageUrl, price: parseFloat(price) || 0,
      // Empty → null (not undefined) so clearing the note actually wipes the
      // stored value instead of the key being dropped from the update body.
      banner_note: bannerNote.trim() || null,
      timeline: timeline.map(i => ({ time: i.time.trim(), title: i.title.trim() })).filter(i => i.time && i.title).sort((a, b) => a.time.localeCompare(b.time)),
      buttons:  buttons.filter(b => b.label.trim()),
    }

    if (isEdit && event) {
      onUpdated?.({ ...event, ...fields })
      try {
        const image_url = imageFile ? await uploadEventImage(imageFile) : fields.image_url
        const finalFields = { ...fields, image_url }
        await updateEvent(event.id, finalFields)
        if (imageFile) onUpdated?.({ ...event, ...finalFields })
        toast.success('Event updated')
        void logInteraction('event.updated', 'event', event.id, event.id, `updated event "${fields.name}"`)
      } catch (e) {
        onUpdated?.(event)
        toast.error("Couldn't update event", errorMessage(e, 'Please try again.'))
      }
    } else {
      const tempId = `temp_${Date.now()}`
      onCreated?.({ id: tempId, public: false, ...fields })
      try {
        const image_url = imageFile ? await uploadEventImage(imageFile) : fields.image_url
        const ev = await createEvent({ ...fields, image_url })
        onCreateSettled?.(tempId, ev)
        toast.success('Event created')
        void logInteraction('event.created', 'event', ev.id, ev.id, `created event "${ev.name}"`)
      } catch (e) {
        onCreateSettled?.(tempId, null)
        toast.error("Couldn't create event", errorMessage(e, 'Please try again.'))
      }
    }
  }

  const canSave = name.trim() && eventDate

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:px-4">
      {/* Blur is desktop-only: a backdrop-filter forces the compositor to snapshot
          the whole page behind before the first frame can paint, which on a phone
          showed as a black layer sitting there while the sheet was still sliding
          up. The mobile sheet uses a flat scrim, same as MobileEventSheet. */}
      <div
        className="absolute inset-0 bg-black/60 touch-none transition-opacity duration-[220ms] sm:backdrop-blur-sm sm:animate-[fadeIn_var(--motion-fast)_var(--motion-ease)]"
        style={{ opacity: backdropOpacity }}
        onClick={close}
      />
      <div ref={sheetRef} {...touchHandlers} onClick={e => e.stopPropagation()}
        className="relative w-full max-w-md overflow-hidden max-h-[94dvh] sm:max-h-[92dvh] flex flex-col rounded-t-3xl sm:rounded-3xl animate-[slideUp_0.22s_ease-out] sm:animate-[modalIn_var(--motion-base)_var(--motion-ease)]"
        style={{ background: PALETTE.modal, border: `1px solid ${PALETTE.border}`, boxShadow: PALETTE.shadowLg, ...sheetStyle }}>

        {/* Grab handle (mobile sheet affordance) */}
        <div className="sm:hidden flex justify-center pt-2.5">
          <div className="w-9 h-1 rounded-full" style={{ background: PALETTE.borderHover }} />
        </div>

        <div className="px-6 py-4 flex items-center justify-between shrink-0" style={{ borderBottom: `1px solid ${PALETTE.border}` }}>
          <div className="flex items-center">
            <h2 style={{ color: PALETTE.dark }} className="font-extrabold text-base m-0">{isEdit ? 'Edit Event' : 'New Event'}</h2>
          </div>
          <button onClick={close} style={{ color: PALETTE.muted, background: PALETTE.cardAlt, border: `1px solid ${PALETTE.border}`, borderRadius: '50%' }} className="w-8 h-8 flex items-center justify-center text-lg cursor-pointer hover:border-white/30 transition-colors">×</button>
        </div>

        <div ref={scrollRef} className="p-5 sm:p-6 flex flex-col gap-3.5 overflow-y-auto overscroll-contain">
          {/* Name */}
          <div><Label icon={ICON.name}>Event Name</Label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Raunaq Fest" style={inp} className="w-full px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-500/30" /></div>

          {/* Location */}
          <div>
            <Label icon={ICON.location}>Location</Label>
            <div className="flex gap-2 items-center">
              <input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Patricia O'Shane G06, UNSW" style={inp} className="flex-1 min-w-0 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-500/30" />
              <button type="button" onClick={() => location.trim() && setMapPreview(true)} disabled={!location.trim()}
                style={{ borderColor: PALETTE.border, color: location.trim() ? PALETTE.secondary : PALETTE.disabled, background: PALETTE.cardAlt, borderRadius: 12 }}
                className="shrink-0 px-3 py-2.5 text-xs font-semibold border cursor-pointer hover:bg-white/5 transition-colors disabled:cursor-not-allowed whitespace-nowrap">
                Preview
              </button>
            </div>
          </div>

          {/* When — date + times grouped in an accent panel */}
          <div className="p-3.5 flex flex-col gap-3"
            style={{ background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.18)', borderRadius: 16 }}>
            <div className="min-w-0"><Label icon={ICON.date}>Date</Label>
              <input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)}
                style={{ ...inp, colorScheme: 'dark', width: '100%', minWidth: 0, maxWidth: '100%', boxSizing: 'border-box', textAlign: 'center', WebkitAppearance: 'none', appearance: 'none' }} className="block w-full max-w-full px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-500/30 cursor-pointer" /></div>
            <div className="grid grid-cols-2 gap-3">
              <TimeField label="Starts" value={startTime} onChange={setStartTime} />
              <TimeField label="Ends"   value={endTime}   onChange={setEndTime} />
            </div>
            {startTime && endTime && (
              <p className="m-0 flex items-center gap-1.5 text-xs font-semibold" style={{ color: '#86EFAC' }}>
                <Ic path={ICON.clock} />{formatHM(startTime)} – {formatHM(endTime)}{crossesMidnight && ' (ends next day)'}
              </p>
            )}
          </div>

          {/* Price */}
          <div><Label icon={ICON.price}>Ticket Price (AUD)</Label>
            <div className="relative"><span style={{ color: PALETTE.muted }} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold">$</span>
              <input type="number" min="0" step="0.01" value={price} onChange={e => setPrice(e.target.value)} placeholder="0.00"
                style={{ ...inp, paddingLeft: '1.75rem' }} className="w-full px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-500/30" /></div>
            <p style={{ color: PALETTE.disabled }} className="text-[10px] mt-1">Set to 0 for a free event</p></div>

          {/* Banner note — free-text line printed under the home banner CTAs */}
          <div><Label icon={ICON.note}>Additional Note (optional)</Label>
            <input value={bannerNote} onChange={e => setBannerNote(e.target.value)} placeholder="e.g. Final Release At $75...."
              style={inp} className="w-full px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-500/30" />
            <p style={{ color: PALETTE.disabled }} className="text-[10px] mt-1">
              Shown at the bottom of the home banner, under the action buttons. Any $ amount is highlighted. Leave blank to hide.
            </p></div>

          {/* CTA Buttons */}
          <div><Label icon={ICON.link}>Action Buttons</Label>
            <CtaButtonsEditor buttons={buttons} onChange={setButtons} /></div>

          {/* Timeline */}
          <div><Label icon={ICON.timeline}>Event Timeline</Label>
            <TimelineEditor items={timeline} onChange={setTimeline} /></div>

          {/* Image */}
          <div><Label icon={ICON.image}>Event Image</Label>
            <ImageUploadZone preview={imagePreview} dragOver={dragOver} onFile={handleFile} onClear={() => { setImageFile(null); setImagePreview('') }} onDragOver={setDragOver} /></div>

          {/* Delete — scrolls with the form instead of living in the fixed footer */}
          {isEdit && event && onDelete && (
            <button type="button" onClick={() => setConfirmDelete(true)}
              style={{ border: '1px solid rgba(239,68,68,0.3)', color: '#F87171', background: 'transparent', borderRadius: 14 }}
              className="w-full py-2.5 mt-1 text-sm font-semibold cursor-pointer hover:bg-red-500/10 hover:border-red-500/50 transition-colors inline-flex items-center justify-center gap-2">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4" aria-hidden><path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><path d="M10 11v6" /><path d="M14 11v6" /></svg>
              Delete Event
            </button>
          )}
        </div>

        <div className="px-5 sm:px-6 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] flex gap-3 shrink-0" style={{ borderTop: `1px solid ${PALETTE.border}` }}>
          <button onClick={close}
            style={{ border: `1px solid ${PALETTE.border}`, color: PALETTE.secondary, borderRadius: 14, background: 'transparent' }}
            className="flex-1 py-2.5 text-sm font-semibold cursor-pointer hover:bg-white/5 transition-colors">Cancel</button>
          <button onClick={submit} disabled={!canSave}
            style={{ background: canSave ? ACCENT : PALETTE.cardAlt, color: canSave ? ACCENT_TEXT : PALETTE.disabled, borderRadius: 14, boxShadow: canSave ? '0 0 20px rgba(34,197,94,0.25)' : 'none' }}
            className="flex-1 py-2.5 text-sm font-bold border-none cursor-pointer transition-all disabled:cursor-not-allowed">
            {isEdit ? 'Save Changes' : '+ Save as Draft'}
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
      {confirmDelete && event && (
        <ConfirmModal
          title="Delete event?"
          message="This will permanently remove the event and all its tasks. This cannot be undone."
          confirmLabel="Delete"
          danger
          onConfirm={() => onDelete?.(event.id)}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </div>
  )
}
