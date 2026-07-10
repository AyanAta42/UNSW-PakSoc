import { useState, useEffect } from 'react'
import type { User }            from '@supabase/supabase-js'
import { fetchPublicEvents }    from '@/events/services/fetchPublicEvents'
import { fetchMemberAvatar }    from '@/members/services/fetchMemberAvatar'
import { fetchMemberName }      from '@/members/services/fetchMemberName'
import { useAuth }              from '@/auth/hooks/useAuth'
import type { DbEvent }         from '@/events/types/Event'
import { Navbar }               from './components/Navbar'
import { HeroBanner }           from './components/HeroBanner'
import { PublicEventCard }      from './components/PublicEventCard'
import { LocationSidebar }      from './components/LocationSidebar'
import { SocialWall }           from './components/SocialWall'
import { MobileEventSheet }     from './components/MobileEventSheet'
import { EditProfileModal }     from './components/EditProfileModal'
import { Footer }               from './components/Footer'
import { ACCENT, PALETTE }      from '@/config/theme'

export default function HomePage() {
  const { user, avatarUrl: authAvatar } = useAuth()
  const [events, setEvents]             = useState<DbEvent[]>([])
  const [loading, setLoading]           = useState(true)
  const [avatarUrl, setAvatarUrl]       = useState<string | undefined>()
  const [avatarBroken, setAvatarBroken] = useState(false)
  const [selectedId, setSelectedId]     = useState<string | null>(null)
  const [mobileEvent, setMobileEvent]   = useState<DbEvent | null>(null)
  const [editOpen, setEditOpen]         = useState(false)

  const meta    = (user as User | null)?.user_metadata ?? {}
  const initial = (meta.full_name ?? meta.name ?? user?.email ?? '?')[0]?.toUpperCase()

  useEffect(() => { fetchPublicEvents().then(setEvents).catch(console.error).finally(() => setLoading(false)) }, [])

  useEffect(() => {
    setAvatarBroken(false)
    if (!user) { setAvatarUrl(undefined); return }
    if (authAvatar) { setAvatarUrl(authAvatar); return }
    fetchMemberAvatar(user.id).then(url => setAvatarUrl(url ?? undefined)).catch(() => {})
  }, [user, authAvatar])

  useEffect(() => {
    document.body.style.overflow = mobileEvent ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileEvent])

  const now      = new Date()
  const upcoming = [...events].filter(ev => new Date(ev.time) > now).sort((a,b) => +new Date(a.time) - +new Date(b.time))
  const past     = [...events].filter(ev => new Date(ev.time) <= now).sort((a,b) => +new Date(b.time) - +new Date(a.time))
  const allPublic = [...upcoming, ...past]
  const phoneEvents = [...events].sort((a,b) => +new Date(b.time) - +new Date(a.time)).slice(0, 2)
  const banner   = upcoming[0] ?? null
  const featured = allPublic.find(e => e.id === selectedId) ?? banner ?? allPublic[0] ?? null

  function openEvent(ev: DbEvent) {
    setSelectedId(ev.id)
    if (window.matchMedia('(max-width: 1023px)').matches) setMobileEvent(ev)
  }

  async function handleEditProfile() {
    if (!user) return
    const saved = await fetchMemberName(user.id)
    if (saved) meta.full_name = saved
    setEditOpen(true)
  }

  return (
    <div style={{ background: PALETTE.page, color: PALETTE.dark, fontFamily: '"Inter", system-ui, sans-serif', minHeight: '100vh' }}>
      <Navbar user={user} avatarUrl={avatarUrl} avatarBroken={avatarBroken} initial={initial ?? '?'} onAvatarError={() => setAvatarBroken(true)} onEditProfile={handleEditProfile} />

      <div className="flex gap-0 lg:gap-5 px-0 lg:px-8 py-0 lg:py-5 max-w-[1400px] mx-auto items-start w-full">
        <div className="flex flex-col gap-0 lg:gap-5 flex-[7] min-w-0 w-full">
          <HeroBanner banner={banner} loading={loading} />

          <div className="max-lg:rounded-none max-lg:bg-transparent max-lg:border-0 max-lg:shadow-none max-lg:border-b max-lg:border-[#E5E7EB] lg:rounded-2xl lg:bg-white lg:border lg:border-[#E5E7EB] lg:shadow-[0_2px_8px_rgba(0,0,0,0.07),0_1px_2px_rgba(0,0,0,0.04)] px-4 py-4 lg:px-6 lg:py-5">
            <div className="flex items-center justify-between mb-5">
              <span style={{ color: PALETTE.dark }} className="text-sm font-extrabold tracking-widest uppercase">Events</span>
              {user && <button onClick={() => window.location.href='/events'} style={{ color: ACCENT }} className="text-xs font-semibold bg-transparent border-none cursor-pointer hover:opacity-80">Manage events &rarr;</button>}
            </div>
            {loading && <div className="grid w-full grid-cols-1 md:grid-cols-3 gap-4">{[1,2,3].map(i => <div key={i} className="h-52 rounded-xl animate-pulse bg-gray-100 min-w-0" />)}</div>}
            {!loading && <>
              <div className="grid w-full grid-cols-1 md:grid-cols-3 gap-4 md:hidden">
                {phoneEvents.length === 0 ? <p style={{ color: PALETTE.muted }} className="text-sm m-0 col-span-full">No events yet — check back soon.</p> : phoneEvents.map(ev => <PublicEventCard key={ev.id} event={ev} selected={selectedId === ev.id || (!selectedId && ev.id === featured?.id)} now={now} onClick={() => openEvent(ev)} />)}
              </div>
              <div className="grid w-full grid-cols-1 md:grid-cols-3 gap-4 hidden md:grid">
                {allPublic.length === 0 ? <p style={{ color: PALETTE.muted }} className="text-sm m-0 col-span-full">No events yet — announce some from Events Manager.</p> : allPublic.slice(0, 3).map(ev => <PublicEventCard key={ev.id} event={ev} selected={selectedId === ev.id || (!selectedId && ev.id === featured?.id)} now={now} onClick={() => openEvent(ev)} />)}
              </div>
            </>}
          </div>

          <div className="max-lg:rounded-none max-lg:bg-transparent max-lg:border-0 max-lg:shadow-none lg:rounded-2xl lg:bg-white lg:border lg:border-[#E5E7EB] lg:shadow-[0_2px_8px_rgba(0,0,0,0.07),0_1px_2px_rgba(0,0,0,0.04)] px-4 py-4 lg:px-6 lg:py-5 max-lg:border-b-0">
            <div className="flex items-center justify-between mb-5"><span style={{ color: PALETTE.dark }} className="text-sm font-extrabold tracking-widest uppercase">Social Wall</span><a href="#" style={{ color: ACCENT }} className="text-xs font-semibold no-underline hover:opacity-80">View on Instagram &rarr;</a></div>
            <SocialWall />
          </div>
        </div>

        <LocationSidebar mapEvent={featured ?? banner} featured={featured} now={now} />
      </div>

      {mobileEvent && <MobileEventSheet event={mobileEvent} now={now} onClose={() => setMobileEvent(null)} />}
      {editOpen && user && <EditProfileModal user={user} initial={initial ?? '?'} onClose={() => setEditOpen(false)} />}
      <Footer />
    </div>
  )
}
