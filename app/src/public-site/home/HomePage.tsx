import { useState, useEffect, useMemo, lazy, Suspense } from 'react'
import { fetchPublicEvents } from '@/events/services/fetchPublicEvents'
import { useAuth } from '@/auth/hooks/useAuth'
import type { DbEvent } from '@/events/types/Event'
import { Navbar } from './components/Navbar'
import { HeroBanner } from './components/HeroBanner'
import { PublicEventCard } from './components/PublicEventCard'
import { useNavigate } from 'react-router-dom'
import { ACCENT, PALETTE } from '@/config/theme'
import { useReveal } from '@/shared/hooks/useReveal'

const AmbientBackground = lazy(() =>
  import('@/shared/components/AmbientBackground').then(m => ({ default: m.AmbientBackground })),
)
const LocationSidebar = lazy(() =>
  import('./components/LocationSidebar').then(m => ({ default: m.LocationSidebar })),
)
const SocialWall = lazy(() =>
  import('./components/SocialWall').then(m => ({ default: m.SocialWall })),
)
const Footer = lazy(() =>
  import('./components/Footer').then(m => ({ default: m.Footer })),
)
const MobileEventSheet = lazy(() =>
  import('./components/MobileEventSheet').then(m => ({ default: m.MobileEventSheet })),
)
const EditProfileModal = lazy(() =>
  import('./components/EditProfileModal').then(m => ({ default: m.EditProfileModal })),
)

/** Prefetch interaction chunks right after first paint so sheets still open instantly. */
function prefetchHomeOverlays() {
  void import('./components/MobileEventSheet')
  void import('./components/EditProfileModal')
  void import('./components/LocationSidebar')
}

export default function HomePage() {
  const navigate = useNavigate()
  const { user, avatarUrl: authAvatar } = useAuth()
  const [events, setEvents] = useState<DbEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>()
  const [avatarBroken, setAvatarBroken] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [mobileEvent, setMobileEvent] = useState<DbEvent | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const sidebarReveal = useReveal<HTMLDivElement>({ delay: 120 })
  const eventsReveal = useReveal<HTMLDivElement>({ delay: 220 })
  const socialReveal = useReveal<HTMLDivElement>({ delay: 340 })

  const meta = user?.user_metadata ?? {}
  const initial = (meta.full_name ?? meta.name ?? user?.email ?? '?')[0]?.toUpperCase()

  useEffect(() => {
    fetchPublicEvents().then(setEvents).catch(console.error).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const t = window.setTimeout(prefetchHomeOverlays, 100)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    setAvatarBroken(false)
    if (!user) { setAvatarUrl(undefined); return }
    if (authAvatar) { setAvatarUrl(authAvatar); return }
    let alive = true
    void import('@/members/services/fetchMemberAvatar')
      .then(m => m.fetchMemberAvatar(user.id))
      .then(url => { if (alive) setAvatarUrl(url ?? undefined) })
      .catch(() => {})
    return () => { alive = false }
  }, [user, authAvatar])

  const overlayOpen = !!mobileEvent || editOpen
  useEffect(() => {
    document.body.style.overflow = overlayOpen ? 'hidden' : ''
    document.documentElement.classList.toggle('modal-open', overlayOpen)
    return () => {
      document.body.style.overflow = ''
      document.documentElement.classList.remove('modal-open')
    }
  }, [overlayOpen])

  const { phoneEvents, allPublic, banner, featured, now } = useMemo(() => {
    const now = new Date()
    const upcoming = [...events].filter(ev => new Date(ev.time) > now).sort((a, b) => +new Date(a.time) - +new Date(b.time))
    const past = [...events].filter(ev => new Date(ev.time) <= now).sort((a, b) => +new Date(b.time) - +new Date(a.time))
    const allPublic = [...upcoming, ...past]
    const phoneEvents = upcoming.length >= 2
      ? upcoming
      : [...upcoming, ...past.slice(0, 2 - upcoming.length)]
    const banner = upcoming[0] ?? null
    const featured = allPublic.find(e => e.id === selectedId) ?? banner ?? allPublic[0] ?? null
    return { phoneEvents, allPublic, banner, featured, now }
  }, [events, selectedId])

  function openEvent(ev: DbEvent) {
    setSelectedId(ev.id)
    if (window.matchMedia('(max-width: 1023px)').matches) setMobileEvent(ev)
  }

  function handleEditProfile() {
    if (!user) return
    setEditOpen(true)
  }

  return (
    <div style={{
      background: PALETTE.page,
      color: PALETTE.dark,
      fontFamily: '"Inter", system-ui, sans-serif',
      minHeight: '100vh',
      position: 'relative',
    }}>
      <Suspense fallback={null}>
        <AmbientBackground />
      </Suspense>

      <Navbar
        user={user}
        avatarUrl={avatarUrl}
        avatarBroken={avatarBroken}
        initial={initial ?? '?'}
        onAvatarError={() => setAvatarBroken(true)}
        onEditProfile={handleEditProfile}
      />

      <div className="relative z-10 flex gap-0 lg:gap-5 px-0 lg:px-8 py-0 lg:py-5 max-w-[1400px] mx-auto items-start w-full">
        <div className="flex flex-col gap-0 lg:gap-5 flex-[7] min-w-0 w-full">
          {banner && <HeroBanner banner={banner} loading={loading} />}

          <div ref={eventsReveal.ref} data-visible={eventsReveal.visible} style={eventsReveal.style}
            className="motion-reveal bg-transparent rounded-none px-4 py-4 lg:px-6 lg:py-5">
            <div className="flex items-center justify-between mb-5">
              <span className="motion-heading text-[10px] font-bold tracking-widest uppercase">Events</span>
              <button onClick={() => navigate('/all-events')} style={{ color: ACCENT }} className="text-xs font-semibold bg-transparent border-none cursor-pointer hover:opacity-80">View All Events →</button>
            </div>
            {loading && <div className="grid w-full grid-cols-1 md:grid-cols-3 gap-4">{[1, 2, 3].map(i => <div key={i} className="motion-skeleton h-52 rounded-xl min-w-0" />)}</div>}
            {!loading && <>
              <div className="motion-stagger grid w-full grid-cols-1 md:grid-cols-3 gap-4 md:hidden">
                {phoneEvents.length === 0
                  ? <p style={{ color: PALETTE.muted }} className="text-sm m-0 col-span-full">No events yet — check back soon.</p>
                  : phoneEvents.map(ev => (
                    <PublicEventCard key={ev.id} event={ev} selected={selectedId === ev.id || (!selectedId && ev.id === featured?.id)} now={now} onClick={() => openEvent(ev)} />
                  ))}
              </div>
              <div className="motion-stagger grid w-full grid-cols-1 md:grid-cols-3 gap-4 hidden md:grid">
                {allPublic.length === 0
                  ? <p style={{ color: PALETTE.muted }} className="text-sm m-0 col-span-full">No events yet — announce some from Events Manager.</p>
                  : allPublic.slice(0, 3).map(ev => (
                    <PublicEventCard key={ev.id} event={ev} selected={selectedId === ev.id || (!selectedId && ev.id === featured?.id)} now={now} onClick={() => openEvent(ev)} />
                  ))}
              </div>
            </>}
          </div>

          <div ref={socialReveal.ref} data-visible={socialReveal.visible} style={socialReveal.style}
            className="motion-reveal bg-transparent rounded-none px-4 py-4 lg:px-6 lg:py-5">
            <div className="flex items-center justify-between mb-5">
              <span className="motion-heading text-[10px] font-bold tracking-widest uppercase">Social Wall</span>
              <a href="#" style={{ color: ACCENT }} className="text-xs font-semibold no-underline hover:opacity-80">View on Instagram →</a>
            </div>
            <Suspense fallback={<div className="motion-skeleton h-40 rounded-xl" />}>
              <SocialWall />
            </Suspense>
          </div>
        </div>

        <div ref={sidebarReveal.ref} data-visible={sidebarReveal.visible} style={sidebarReveal.style} className="motion-reveal hidden lg:block flex-[3] min-w-0">
          <Suspense fallback={<div className="motion-skeleton h-80 rounded-xl" />}>
            <LocationSidebar mapEvent={featured ?? banner} featured={featured} now={now} />
          </Suspense>
        </div>
      </div>

      {mobileEvent && (
        <Suspense fallback={null}>
          <MobileEventSheet event={mobileEvent} now={now} onClose={() => setMobileEvent(null)} />
        </Suspense>
      )}
      {editOpen && user && (
        <Suspense fallback={null}>
          <EditProfileModal user={user} initial={initial ?? '?'} onClose={() => setEditOpen(false)} />
        </Suspense>
      )}
      <div className="relative z-10">
        <Suspense fallback={null}><Footer /></Suspense>
      </div>
    </div>
  )
}
