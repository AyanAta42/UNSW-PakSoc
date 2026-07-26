import { useState, useEffect } from 'react'
import type { User } from '@supabase/supabase-js'
import { updateMemberName } from '@/members/services/updateMemberName'
import { fetchMemberName }  from '@/members/services/fetchMemberName'
import { PALETTE } from '@/config/theme'
import { toast, errorMessage } from '@/shared/toast/toast'
import { useScrollLock } from '@/shared/hooks/useScrollLock'
import { isStandalone } from '@/shared/pwa/installPrompt'

interface Props {
  user:    User
  onClose: () => void
}

/** Floating modal that lets the user update their display name. */
export function EditProfileModal({ user, onClose }: Props) {
  const meta = user.user_metadata ?? {}
  const [name,    setName]    = useState('')
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)

  // Only mounts on the home route — same reasoning as MobileEventSheet: skip
  // the lock in the installed standalone app, where the document is already
  // permanently locked by CSS and re-locking it here is what caused the sheet
  // open/close to flash a laggy black layer on iOS.
  useScrollLock(!isStandalone())

  // Pre-fill with the name actually on record (`members.name`) — not the
  // Google account snapshot, which never changes after sign-up and would
  // silently overwrite whatever the user last saved here.
  useEffect(() => {
    let alive = true
    fetchMemberName(user.id)
      .then(current => { if (alive) setName(current ?? meta.full_name ?? meta.name ?? '') })
      .catch(() => { if (alive) setName(meta.full_name ?? meta.name ?? '') })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [user.id])

  async function save() {
    if (!name.trim()) return
    setSaving(true)
    try { await updateMemberName(user.id, name.trim()); toast.success('Profile updated'); onClose() }
    catch (e) { console.error(e); toast.error("Couldn't update profile", errorMessage(e, 'Please try again.')) }
    finally { setSaving(false) }
  }

  return (
    <div className="motion-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4" onClick={onClose}>
      <div style={{ background: PALETTE.modal, border: `1px solid ${PALETTE.border}`, borderRadius: PALETTE.radiusModal, boxShadow: PALETTE.shadowLg }}
        className="motion-modal p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <h3 style={{ color: PALETTE.dark }} className="font-extrabold text-base mb-1">Edit Profile</h3>
        <p style={{ color: PALETTE.muted }} className="text-xs mb-4">This name is shown to other team members.</p>
        <label style={{ color: PALETTE.secondary }} className="text-xs font-semibold block mb-1">Display Name</label>
        <input value={name} onChange={e => setName(e.target.value)} placeholder={loading ? 'Loading…' : 'Your name'} disabled={loading}
          style={{ border: `1px solid ${PALETTE.border}`, color: PALETTE.dark, background: PALETTE.input, borderRadius: PALETTE.radiusInput }}
          className="w-full px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-500/30 mb-4 disabled:opacity-60" />
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} style={{ color: PALETTE.secondary, border: `1px solid ${PALETTE.border}`, borderRadius: PALETTE.radiusBtn }} className="px-4 py-2 text-sm font-semibold bg-transparent cursor-pointer hover:bg-white/5 transition-colors">Cancel</button>
          <button disabled={saving || loading || !name.trim()} onClick={save}
            style={{ background: '#22C55E', color: '#fff', borderRadius: PALETTE.radiusBtn, boxShadow: '0 0 20px rgba(34,197,94,0.25)' }}
            className="px-4 py-2 text-sm font-bold border-none cursor-pointer hover:opacity-90 disabled:opacity-50 transition-opacity">
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
