import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchMembers }           from '@/members/services/fetchMembers'
import { updateMemberRole }       from '@/members/services/updateMemberRole'
import { updateMemberCommittee }  from '@/members/services/updateMemberCommittee'
import { MemberRoleRow }          from '@/roles/components/MemberRoleRow'
import { ROLE_LABEL, ROLE_COLOR, ALL_ROLES } from '@/roles/config/roleLabels'
import type { Member, MemberRole, Committee } from '@/members/types/Member'

const C = { page: '#F9FAFB', card: '#FFFFFF', border: '#E5E7EB', muted: '#6B7280', dark: '#111827' }
const NEEDS_COMMITTEE: MemberRole[] = ['subcom', 'executive']

export default function ManageRolesPage() {
  const navigate = useNavigate()
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState<string | null>(null)
  const [search, setSearch]   = useState('')

  useEffect(() => { fetchMembers().then(setMembers).catch(console.error).finally(() => setLoading(false)) }, [])

  async function handleRoleChange(member: Member, role: MemberRole) {
    setSaving(member.id)
    try {
      await updateMemberRole(member.id, role)
      let committee = member.committee
      if (NEEDS_COMMITTEE.includes(role) && !committee) { committee = 'Events'; await updateMemberCommittee(member.id, 'Events') }
      else if (!NEEDS_COMMITTEE.includes(role))         { committee = undefined; await updateMemberCommittee(member.id, null) }
      setMembers(ms => ms.map(m => m.id === member.id ? { ...m, role, committee } : m))
    } catch (e) { console.error(e) } finally { setSaving(null) }
  }

  async function handleCommitteeChange(member: Member, committee: Committee) {
    setSaving(member.id)
    try {
      await updateMemberCommittee(member.id, committee)
      setMembers(ms => ms.map(m => m.id === member.id ? { ...m, committee } : m))
    } catch (e) { console.error(e) } finally { setSaving(null) }
  }

  const filtered = members.filter(m => (m.name ?? '').toLowerCase().includes(search.toLowerCase()))
  const grouped  = ALL_ROLES.slice().reverse().reduce<Record<string, Member[]>>((acc, r) => {
    const ms = filtered.filter(m => m.role === r); if (ms.length) acc[r] = ms; return acc
  }, {})

  return (
    <div style={{ background: C.page, minHeight: '100vh', fontFamily: 'system-ui,sans-serif' }}>
      <nav style={{ background: 'rgba(255,255,255,0.95)', borderBottom: `1px solid ${C.border}` }} className="sticky top-0 z-50 h-14 px-6 flex items-center gap-3">
        <button onClick={() => navigate('/')} style={{ color: C.muted }} className="bg-transparent border-none cursor-pointer text-sm hover:opacity-70 p-0 mr-2">← Back</button>
        <img src="/logo.png" alt="PakSoc" className="w-7 h-7 rounded-full object-cover" />
        <span style={{ color: C.dark }} className="font-extrabold text-sm">Manage Roles</span>
      </nav>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name…"
          style={{ border: `1px solid ${C.border}`, color: C.dark, background: C.card }}
          className="w-full rounded-xl px-4 py-2.5 text-sm mb-6 outline-none focus:ring-2 focus:ring-green-200" />
        {loading && [1,2,3,4].map(i => <div key={i} className="h-14 rounded-xl animate-pulse bg-gray-100 mb-3" />)}
        {!loading && members.length === 0 && <div style={{ color: C.muted }} className="text-sm text-center py-16">No members yet. Users appear here after they log in.</div>}
        {!loading && Object.entries(grouped).map(([role, ms]) => (
          <div key={role} className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-extrabold tracking-widest uppercase px-2.5 py-1 rounded-full"
                style={{ background: ROLE_COLOR[role as MemberRole].bg, color: ROLE_COLOR[role as MemberRole].text }}>
                {ROLE_LABEL[role as MemberRole]}
              </span>
              <span style={{ color: C.muted }} className="text-xs">{ms.length}</span>
            </div>
            <div style={{ background: C.card, border: `1px solid ${C.border}` }} className="rounded-2xl overflow-hidden">
              {ms.map((member, i) => (
                <div key={member.id} style={{ borderTop: i > 0 ? `1px solid ${C.border}` : 'none' }}>
                  <MemberRoleRow member={member} saving={saving === member.id} onRole={handleRoleChange} onComm={handleCommitteeChange} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
