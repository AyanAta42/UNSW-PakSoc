import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchMembers, updateMemberRole, updateMemberCommittee } from '@/lib/db/members'
import type { Member, MemberRole, Committee } from '@/pages/subcom/data/types'

const ROLES: MemberRole[] = ['public', 'subcom', 'executive', 'vice_president', 'president']
const COMMITTEES: Committee[] = ['Events', 'HR', 'Marketing', 'Sports']
const NEEDS_COMMITTEE: MemberRole[] = ['subcom', 'executive']

const ROLE_LABEL: Record<MemberRole, string> = {
  public:        'Public',
  subcom:        'Subcom',
  executive:     'Executive',
  vice_president:'Vice President',
  president:     'President',
}

const ROLE_COLOR: Record<MemberRole, { bg: string; text: string }> = {
  public:         { bg: '#F3F4F6', text: '#6B7280' },
  subcom:         { bg: '#EFF6FF', text: '#3B82F6' },
  executive:      { bg: '#FEF3C7', text: '#D97706' },
  vice_president: { bg: '#F0FDF4', text: '#16A34A' },
  president:      { bg: '#FDF2F8', text: '#9333EA' },
}

const A  = '#22C55E'
const C  = {
  page:   '#F9FAFB',
  card:   '#FFFFFF',
  border: '#E5E7EB',
  muted:  '#6B7280',
  dark:   '#111827',
  shadow: '0 1px 4px rgba(0,0,0,0.07)',
}

export default function ManageRoles() {
  const navigate = useNavigate()
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState<string | null>(null)
  const [search, setSearch]   = useState('')

  useEffect(() => {
    fetchMembers().then(setMembers).catch(console.error).finally(() => setLoading(false))
  }, [])

  async function handleRoleChange(member: Member, role: MemberRole) {
    setSaving(member.id)
    try {
      await updateMemberRole(member.id, role)
      // auto-assign default committee when promoted to subcom/exec
      let committee = member.committee
      if (NEEDS_COMMITTEE.includes(role) && !committee) {
        committee = 'Events'
        await updateMemberCommittee(member.id, 'Events')
      } else if (!NEEDS_COMMITTEE.includes(role)) {
        committee = undefined
        await updateMemberCommittee(member.id, null)
      }
      setMembers(ms => ms.map(m => m.id === member.id ? { ...m, role, committee } : m))
    } catch (e) { console.error(e) }
    finally { setSaving(null) }
  }

  async function handleCommitteeChange(member: Member, committee: Committee) {
    setSaving(member.id)
    try {
      await updateMemberCommittee(member.id, committee)
      setMembers(ms => ms.map(m => m.id === member.id ? { ...m, committee } : m))
    } catch (e) { console.error(e) }
    finally { setSaving(null) }
  }

  const filtered = members.filter(m =>
    (m.name ?? '').toLowerCase().includes(search.toLowerCase())
  )

  const grouped = ROLES.slice().reverse().reduce<Record<string, Member[]>>((acc, r) => {
    const ms = filtered.filter(m => m.role === r)
    if (ms.length) acc[r] = ms
    return acc
  }, {})

  return (
    <div style={{ background: C.page, minHeight: '100vh', fontFamily: 'system-ui,sans-serif' }}>

      {/* Navbar */}
      <nav style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(14px)', borderBottom: `1px solid ${C.border}` }}
        className="sticky top-0 z-50 h-14 px-6 flex items-center gap-3">
        <button onClick={() => navigate('/')} style={{ color: C.muted }}
          className="bg-transparent border-none cursor-pointer text-sm hover:opacity-70 p-0 mr-2">
          ← Back
        </button>
        <img src="/logo.png" alt="PakSoc" className="w-7 h-7 rounded-full object-cover" />
        <span style={{ color: C.dark }} className="font-extrabold text-sm">Manage Roles</span>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* Search */}
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name…"
          style={{ border: `1px solid ${C.border}`, color: C.dark, background: C.card, boxShadow: C.shadow }}
          className="w-full rounded-xl px-4 py-2.5 text-sm mb-6 outline-none focus:ring-2 focus:ring-green-200"
        />

        {loading && (
          <div className="flex flex-col gap-3">
            {[1,2,3,4].map(i => <div key={i} className="h-14 rounded-xl animate-pulse bg-gray-100" />)}
          </div>
        )}

        {!loading && members.length === 0 && (
          <div style={{ color: C.muted }} className="text-sm text-center py-16">
            No members yet. Users appear here after they log in.
          </div>
        )}

        {!loading && Object.entries(grouped).map(([role, ms]) => (
          <div key={role} className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-extrabold tracking-widest uppercase px-2.5 py-1 rounded-full"
                style={{ background: ROLE_COLOR[role as MemberRole].bg, color: ROLE_COLOR[role as MemberRole].text }}>
                {ROLE_LABEL[role as MemberRole]}
              </span>
              <span style={{ color: C.muted }} className="text-xs">{ms.length}</span>
            </div>

            <div style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: C.shadow }}
              className="rounded-2xl overflow-hidden">
              {ms.map((member, i) => (
                <div key={member.id}
                  style={{ borderTop: i > 0 ? `1px solid ${C.border}` : 'none' }}
                  className="flex items-center gap-3 px-4 py-3">

                  {/* Avatar */}
                  {member.avatar_url
                    ? <img src={member.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                    : <div style={{ background: '#111827', color: '#fff' }}
                        className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0">
                        {(member.name || member.email)[0]?.toUpperCase()}
                      </div>
                  }

                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <div style={{ color: C.dark }} className="text-sm font-semibold truncate">{member.name || '—'}</div>
                  </div>

                  {/* Committee dropdown (subcom / exec only) */}
                  {NEEDS_COMMITTEE.includes(member.role) && (
                    <select
                      value={member.committee ?? 'Events'}
                      disabled={saving === member.id}
                      onChange={e => handleCommitteeChange(member, e.target.value as Committee)}
                      style={{ border: `1px solid ${C.border}`, color: C.muted, background: '#F9FAFB' }}
                      className="rounded-lg px-2 py-1 text-xs font-semibold outline-none cursor-pointer disabled:opacity-50">
                      {COMMITTEES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  )}

                  {/* Role dropdown */}
                  <select
                    value={member.role}
                    disabled={saving === member.id}
                    onChange={e => handleRoleChange(member, e.target.value as MemberRole)}
                    style={{ border: `1px solid ${C.border}`, color: ROLE_COLOR[member.role].text, background: ROLE_COLOR[member.role].bg }}
                    className="rounded-lg px-2 py-1 text-xs font-semibold outline-none cursor-pointer disabled:opacity-50">
                    {ROLES.map(r => (
                      <option key={r} value={r}>{ROLE_LABEL[r]}</option>
                    ))}
                  </select>

                  {saving === member.id && (
                    <span style={{ color: A }} className="text-xs animate-pulse ml-1">saving…</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
