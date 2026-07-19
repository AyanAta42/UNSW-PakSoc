import { useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { updateMemberName } from '@/members/services/updateMemberName'
import { PALETTE } from '@/config/theme'

interface Props {
  user:    User
  initial: string
  onClose: () => void
}

/** Floating modal that lets the user update their display name. */
export function EditProfileModal({ user, initial: _initial, onClose }: Props) {
  const meta = user.user_metadata ?? {}
  const [name, setName]     = useState(meta.full_name ?? meta.name ?? '')
  const [saving, setSaving] = useState(false)

  async function save() {
    if (!name.trim()) return
    setSaving(true)
    try { await updateMemberName(user.id, name.trim()); onClose() }
    catch (e) { console.error(e) }
    finally { setSaving(false) }
  }

  return (
    <div className="motion-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4" onClick={onClose}>
      <div style={{ background: PALETTE.modal, border: `1px solid ${PALETTE.border}`, borderRadius: PALETTE.radiusModal, boxShadow: PALETTE.shadowLg }}
        className="motion-modal p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <h3 style={{ color: PALETTE.dark }} className="font-extrabold text-base mb-1">Edit Profile</h3>
        <p style={{ color: PALETTE.muted }} className="text-xs mb-4">This name is shown to other team members.</p>
        <label style={{ color: PALETTE.secondary }} className="text-xs font-semibold block mb-1">Display Name</label>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name"
          style={{ border: `1px solid ${PALETTE.border}`, color: PALETTE.dark, background: PALETTE.input, borderRadius: PALETTE.radiusInput }}
          className="w-full px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-500/30 mb-4" />
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} style={{ color: PALETTE.secondary, border: `1px solid ${PALETTE.border}`, borderRadius: PALETTE.radiusBtn }} className="px-4 py-2 text-sm font-semibold bg-transparent cursor-pointer hover:bg-white/5 transition-colors">Cancel</button>
          <button disabled={saving || !name.trim()} onClick={save}
            style={{ background: '#22C55E', color: '#fff', borderRadius: PALETTE.radiusBtn, boxShadow: '0 0 20px rgba(34,197,94,0.25)' }}
            className="px-4 py-2 text-sm font-bold border-none cursor-pointer hover:opacity-90 disabled:opacity-50 transition-opacity">
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
