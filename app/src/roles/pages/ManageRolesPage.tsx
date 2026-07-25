import { useState, useEffect } from 'react'
import { fetchMembers }           from '@/members/services/fetchMembers'
import { updateMemberRole }       from '@/members/services/updateMemberRole'
import { updateMemberCommittee }  from '@/members/services/updateMemberCommittee'
import { deleteMembers }          from '@/members/services/deleteMembers'
import { MemberRoleRow }          from '@/roles/components/MemberRoleRow'
import { useRealtimeTable }       from '@/core/supabase/useRealtimeTable'
import { useCurrentMember }       from '@/roles/context/CurrentMemberContext'
import { ROLE_LABEL, ROLE_COLOR, ALL_ROLES } from '@/roles/config/roleLabels'
import { EXEC_ONLY_COMMITTEES } from '@/config/categoryConfig'
import type { Member, MemberRole, Committee } from '@/members/types/Member'
import { PALETTE } from '@/config/theme'
import { AuroraPage } from '@/shared/components/AuroraPage'
import { HomeButton } from '@/shared/components/HomeButton'
import { ConfirmModal } from '@/shared/components/ConfirmModal'
import { toast, errorMessage } from '@/shared/toast/toast'

const NEEDS_COMMITTEE: MemberRole[] = ['subcom', 'executive']

export default function ManageRolesPage() {
  const { member: currentMember } = useCurrentMember()
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState<string | null>(null)
  const [search, setSearch]   = useState('')
  const [removing, setRemoving]         = useState(false)
  const [selectedIds, setSelectedIds]   = useState<Set<string>>(new Set())
  const [confirmOpen, setConfirmOpen]   = useState(false)
  const [deleting, setDeleting]         = useState(false)

  useEffect(() => { fetchMembers().then(setMembers).catch(console.error).finally(() => setLoading(false)) }, [])

  // Pin the header (navbar + search) on EVERY device. The `h-[100dvh]` shell below
  // already keeps the header out of the list's scroll region, but on notched phones
  // the global `body { padding-bottom: env(safe-area-inset-bottom) }` makes the
  // document a hair taller than the viewport — enough that the whole shell (header
  // included) could be dragged up on a scroll/overscroll. Lock document scroll while
  // this page is mounted so the inner list is the ONLY scroll surface and the header
  // can never move. Mirrors the home-route lock in index.css.
  useEffect(() => {
    const html = document.documentElement, body = document.body
    const prev = { html: html.style.overflow, body: body.style.overflow, pad: body.style.paddingBottom }
    html.style.overflow = 'hidden'
    body.style.overflow = 'hidden'
    body.style.paddingBottom = '0'
    return () => {
      html.style.overflow = prev.html
      body.style.overflow = prev.body
      body.style.paddingBottom = prev.pad
    }
  }, [])

  // Live updates: role/committee changes and new sign-ups appear without refresh
  useRealtimeTable('members', () => { fetchMembers().then(setMembers).catch(console.error) }, !loading)

  async function handleRoleChange(member: Member, role: MemberRole) {
    setSaving(member.id)
    try {
      await updateMemberRole(member.id, role)
      let committee = member.committee
      if (NEEDS_COMMITTEE.includes(role) && !committee) { committee = 'Events'; await updateMemberCommittee(member.id, 'Events') }
      else if (!NEEDS_COMMITTEE.includes(role))         { committee = undefined; await updateMemberCommittee(member.id, null) }
      // Arc Delegate / Presidential Advisor are only valid committees for
      // executives — bump anyone demoted out of Executive back to a real one.
      else if (role !== 'executive' && committee && EXEC_ONLY_COMMITTEES.includes(committee)) { committee = 'Events'; await updateMemberCommittee(member.id, 'Events') }
      setMembers(ms => ms.map(m => m.id === member.id ? { ...m, role, committee } : m))
      toast.success(`${member.name || 'Member'} is now ${ROLE_LABEL[role]}`)
    } catch (e) { console.error(e); toast.error("Couldn't update role", errorMessage(e, 'Please try again.')) }
    finally { setSaving(null) }
  }

  async function handleCommitteeChange(member: Member, committee: Committee) {
    setSaving(member.id)
    try {
      await updateMemberCommittee(member.id, committee)
      setMembers(ms => ms.map(m => m.id === member.id ? { ...m, committee } : m))
      toast.success(`${member.name || 'Member'} moved to ${committee}`)
    } catch (e) { console.error(e); toast.error("Couldn't update committee", errorMessage(e, 'Please try again.')) }
    finally { setSaving(null) }
  }

  function toggleSelected(member: Member) {
    setSelectedIds(ids => {
      const next = new Set(ids)
      if (next.has(member.id)) next.delete(member.id)
      else next.add(member.id)
      return next
    })
  }

  function cancelRemoving() {
    setRemoving(false)
    setSelectedIds(new Set())
  }

  async function handleDeleteConfirmed() {
    if (deleting) return
    const ids = Array.from(selectedIds)
    setDeleting(true)
    try {
      await deleteMembers(ids)
      setMembers(ms => ms.filter(m => !selectedIds.has(m.id)))
      toast.success(`${ids.length} member${ids.length === 1 ? '' : 's'} removed`)
      cancelRemoving()
    } catch (e) { console.error(e); toast.error("Couldn't remove members", errorMessage(e, 'Please try again.')) }
    finally { setDeleting(false); setConfirmOpen(false) }
  }

  const filtered = members.filter(m => (m.name ?? '').toLowerCase().includes(search.toLowerCase()))
  const grouped  = ALL_ROLES.slice().reverse().reduce<Record<string, Member[]>>((acc, r) => {
    const ms = filtered.filter(m => m.role === r).sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''))
    if (ms.length) acc[r] = ms
    return acc
  }, {})

  return (
    <AuroraPage contentClassName="flex h-[100dvh] flex-col overflow-hidden">
      {/* Fixed header — navbar + search stay pinned while the list scrolls */}
      <div className="shrink-0" style={{ background: PALETTE.navbarGlass, backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderBottom: `1px solid ${PALETTE.border}` }}>
        <nav className="min-h-[calc(68px_+_env(safe-area-inset-top))] pt-[env(safe-area-inset-top)] px-4 md:px-6 flex items-center gap-3">
          <HomeButton />
          <div className="w-px h-5 shrink-0" style={{ background: PALETTE.border }} />
          <span style={{ color: PALETTE.dark }} className="font-extrabold text-lg md:text-xl">Manage Roles</span>
          <div className="flex-1" />
          {removing ? (
            <>
              <span style={{ color: PALETTE.muted }} className="text-xs font-semibold whitespace-nowrap">{selectedIds.size} selected</span>
              <button onClick={cancelRemoving}
                style={{ border: `1px solid ${PALETTE.border}`, color: PALETTE.secondary, background: 'transparent', borderRadius: 10 }}
                className="text-xs font-semibold px-3 py-1.5 cursor-pointer hover:bg-white/5 transition-colors">Cancel</button>
              <button onClick={() => setConfirmOpen(true)} disabled={selectedIds.size === 0}
                style={{ background: '#EF4444', color: '#fff', borderRadius: 10 }}
                className="text-xs font-bold px-3 py-1.5 border-none cursor-pointer hover:opacity-85 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity">
                Delete{selectedIds.size > 0 ? ` (${selectedIds.size})` : ''}
              </button>
            </>
          ) : (
            <button onClick={() => setRemoving(true)}
              style={{ border: `1px solid rgba(239,68,68,0.3)`, color: '#EF4444', background: 'rgba(239,68,68,0.08)', borderRadius: 10 }}
              className="text-xs font-semibold px-3 py-1.5 cursor-pointer hover:bg-red-500/15 transition-colors whitespace-nowrap">
              Remove Member
            </button>
          )}
        </nav>
        <div className="px-4 pb-3">
          <div className="max-w-2xl mx-auto">
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name…"
              style={{ border: `1px solid ${PALETTE.border}`, color: PALETTE.dark, background: PALETTE.input, borderRadius: PALETTE.radiusInput }}
              className="w-full px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-500/30" />
          </div>
        </div>
      </div>
      {/* Scrollable member list — the ONLY scroll surface (document is locked above) */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 pt-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
        {loading && [1,2,3,4].map(i => <div key={i} className="motion-skeleton h-14 mb-3" style={{ borderRadius: PALETTE.radiusInput, border: `1px solid ${PALETTE.border}` }} />)}
        {!loading && members.length === 0 && <div style={{ color: PALETTE.muted }} className="text-sm text-center py-16">No members yet. Users appear here after they log in.</div>}
        {!loading && Object.entries(grouped).map(([role, ms]) => (
          <div key={role} className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-extrabold tracking-widest uppercase px-2.5 py-1 rounded-full"
                style={{ background: ROLE_COLOR[role as MemberRole].bg, color: ROLE_COLOR[role as MemberRole].text }}>
                {ROLE_LABEL[role as MemberRole]}
              </span>
              <span style={{ color: PALETTE.muted }} className="text-xs">{ms.length}</span>
            </div>
            <div style={{ background: PALETTE.card, border: `1px solid ${PALETTE.border}`, borderRadius: PALETTE.radiusCard, boxShadow: PALETTE.shadowSm }} className="overflow-hidden">
              {ms.map((member, i) => (
                <div key={member.id} style={{ borderTop: i > 0 ? `1px solid ${PALETTE.border}` : 'none' }}>
                  <MemberRoleRow member={member} saving={saving === member.id} onRole={handleRoleChange} onComm={handleCommitteeChange}
                    removing={removing} selected={selectedIds.has(member.id)} selectable={member.id !== currentMember?.id} onToggle={toggleSelected} />
                </div>
              ))}
            </div>
          </div>
        ))}
        </div>
      </div>
      {confirmOpen && (
        <ConfirmModal
          title={`Remove ${selectedIds.size} member${selectedIds.size === 1 ? '' : 's'}?`}
          message="This cannot be undone."
          warning="These users will be completely removed from the database!"
          confirmLabel={deleting ? 'Removing…' : 'Delete'}
          danger
          onConfirm={handleDeleteConfirmed}
          onCancel={() => setConfirmOpen(false)}
        />
      )}
    </AuroraPage>
  )
}
