import { useRef, type DragEvent } from 'react'
import { PALETTE } from '@/config/theme'

interface Props {
  preview:   string
  dragOver:  boolean
  onFile:    (f: File) => void
  onClear:   () => void
  onDragOver:(v: boolean) => void
}

export function ImageUploadZone({ preview, dragOver, onFile, onClear, onDragOver }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)

  function onDrop(e: DragEvent) {
    e.preventDefault(); onDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) onFile(file)
  }

  if (preview) return (
    <div className="relative rounded-xl overflow-hidden" style={{ height: 140 }}>
      <img src={preview} alt="preview" className="w-full h-full object-cover" />
      <button onClick={onClear} className="absolute top-2 right-2 bg-black/60 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs border-none cursor-pointer hover:bg-black/80">×</button>
      <button onClick={() => fileRef.current?.click()} style={{ background: 'rgba(0,0,0,0.55)', color: '#fff' }}
        className="absolute bottom-2 right-2 text-xs px-2.5 py-1 rounded-lg border-none cursor-pointer hover:opacity-80">Change</button>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f) }} />
    </div>
  )

  return (
    <>
      <div onDragOver={e => { e.preventDefault(); onDragOver(true) }} onDragLeave={() => onDragOver(false)} onDrop={onDrop}
        onClick={() => fileRef.current?.click()}
        style={{ border: `2px dashed ${dragOver ? '#22C55E' : PALETTE.border}`, background: dragOver ? 'rgba(34,197,94,0.06)' : PALETTE.cardAlt }}
        className="rounded-xl h-28 flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-colors">
        <svg width="24" height="24" fill="none" stroke={PALETTE.muted} strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
        </svg>
        <span style={{ color: PALETTE.muted }} className="text-xs font-medium">Drag & drop or click to upload</span>
        <span style={{ color: PALETTE.disabled }} className="text-[10px]">PNG, JPG, WEBP</span>
      </div>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f) }} />
    </>
  )
}
