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
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.35)' }} onClick={onClose}>
      <div style={{ background: PALETTE.card, border: `1px solid ${PALETTE.border}`, boxShadow: '0 8px 32px rgba(0,0,0,0.14)' }}
        className="rounded-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <h3 style={{ color: PALETTE.dark }} className="font-extrabold text-base mb-1">Edit Profile</h3>
        <p style={{ color: PALETTE.muted }} className="text-xs mb-4">This name is shown to other team members.</p>
        <label style={{ color: PALETTE.dark }} className="text-xs font-semibold block mb-1">Display Name</label>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name"
          style={{ border: `1px solid ${PALETTE.border}`, color: PALETTE.dark }}
          className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-200 mb-4 bg-gray-50" />
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} style={{ color: PALETTE.muted, border: `1px solid ${PALETTE.border}` }} className="rounded-xl px-4 py-2 text-sm font-semibold bg-transparent cursor-pointer hover:bg-gray-50">Cancel</button>
          <button disabled={saving || !name.trim()} onClick={save} style={{ background: saving ? '#9CA3AF' : '#111827', color: '#fff' }}
            className="rounded-xl px-4 py-2 text-sm font-bold border-none cursor-pointer hover:opacity-90 disabled:opacity-50">
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
