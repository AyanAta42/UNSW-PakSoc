import { useState, useEffect } from 'react'
import { fetchMembers }           from '@/members/services/fetchMembers'
import { updateMemberRole }       from '@/members/services/updateMemberRole'
import { updateMemberCommittee }  from '@/members/services/updateMemberCommittee'
import { MemberRoleRow }          from '@/roles/components/MemberRoleRow'
import { useRealtimeTable }       from '@/core/supabase/useRealtimeTable'
import { ROLE_LABEL, ROLE_COLOR, ALL_ROLES } from '@/roles/config/roleLabels'
import type { Member, MemberRole, Committee } from '@/members/types/Member'
import { PALETTE } from '@/config/theme'
import { AuroraPage } from '@/shared/components/AuroraPage'
import { HomeButton } from '@/shared/components/HomeButton'
import { toast, errorMessage } from '@/shared/toast/toast'

const NEEDS_COMMITTEE: MemberRole[] = ['subcom', 'executive']

export default function ManageRolesPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState<string | null>(null)
  const [search, setSearch]   = useState('')

  useEffect(() => { fetchMembers().then(setMembers).catch(console.error).finally(() => setLoading(false)) }, [])

  // Live updates: role/committee changes and new sign-ups appear without refresh
  useRealtimeTable('members', () => { fetchMembers().then(setMembers).catch(console.error) }, !loading)

  async function handleRoleChange(member: Member, role: MemberRole) {
    setSaving(member.id)
    try {
      await updateMemberRole(member.id, role)
      let committee = member.committee
      if (NEEDS_COMMITTEE.includes(role) && !committee) { committee = 'Events'; await updateMemberCommittee(member.id, 'Events') }
      else if (!NEEDS_COMMITTEE.includes(role))         { committee = undefined; await updateMemberCommittee(member.id, null) }
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

  const filtered = members.filter(m => (m.name ?? '').toLowerCase().includes(search.toLowerCase()))
  const grouped  = ALL_ROLES.slice().reverse().reduce<Record<string, Member[]>>((acc, r) => {
    const ms = filtered.filter(m => m.role === r); if (ms.length) acc[r] = ms; return acc
  }, {})

  return (
    <AuroraPage contentClassName="flex h-[100dvh] flex-col overflow-hidden">
      {/* Fixed header — navbar + search stay pinned while the list scrolls */}
      <div className="shrink-0" style={{ background: PALETTE.navbarGlass, backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderBottom: `1px solid ${PALETTE.border}` }}>
        <nav className="min-h-[68px] pt-[env(safe-area-inset-top)] px-4 md:px-6 flex items-center gap-3">
          <HomeButton />
          <div className="w-px h-5 shrink-0" style={{ background: PALETTE.border }} />
          <span style={{ color: PALETTE.dark }} className="font-extrabold text-lg md:text-xl">Manage Roles</span>
        </nav>
        <div className="px-4 pb-3">
          <div className="max-w-2xl mx-auto">
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name…"
              style={{ border: `1px solid ${PALETTE.border}`, color: PALETTE.dark, background: PALETTE.input, borderRadius: PALETTE.radiusInput }}
              className="w-full px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-500/30" />
          </div>
        </div>
      </div>
      {/* Scrollable member list */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-6">
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
                  <MemberRoleRow member={member} saving={saving === member.id} onRole={handleRoleChange} onComm={handleCommitteeChange} />
                </div>
              ))}
            </div>
          </div>
        ))}
        </div>
      </div>
    </AuroraPage>
  )
}
