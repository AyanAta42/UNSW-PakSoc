import { useState, useEffect, useMemo, lazy, Suspense } from 'react'
import { usePublicEvents } from '@/events/context/PublicEventsContext'
import { useAuth } from '@/auth/hooks/useAuth'
import type { DbEvent } from '@/events/types/Event'
import { Navbar } from './components/Navbar'
import { HeroBanner } from './components/HeroBanner'
import { PublicEventCard } from './components/PublicEventCard'
import { EventCardSkeleton } from './components/EventCardSkeleton'
import { Footer } from './components/Footer'
import { MobileEventSheet } from './components/MobileEventSheet'
import { EventDetailModal } from '@/events/components/EventDetailModal'
import { useNavigate } from 'react-router-dom'
import { ACCENT, PALETTE } from '@/config/theme'

const AmbientBackground = lazy(() =>
  import('@/shared/components/AmbientBackground').then(m => ({ default: m.AmbientBackground })),
)
const LocationSidebar = lazy(() =>
  import('./components/LocationSidebar').then(m => ({ default: m.LocationSidebar })),
)
const SocialWall = lazy(() =>
  import('./components/SocialWall').then(m => ({ default: m.SocialWall })),
)
const EditProfileModal = lazy(() =>
  import('./components/EditProfileModal').then(m => ({ default: m.EditProfileModal })),
)

function loadFonts() {
  if (document.getElementById('paksoc-fonts')) return
  const mark = document.createElement('meta')
  mark.id = 'paksoc-fonts'
  document.head.appendChild(mark)

  for (const [rel, href, cross] of [
    ['preconnect', 'https://fonts.googleapis.com', false],
    ['preconnect', 'https://fonts.gstatic.com', true],
    ['preconnect', 'https://api.fontshare.com', true],
  ] as const) {
    const link = document.createElement('link')
    link.rel = rel
    link.href = href
    if (cross) link.crossOrigin = 'anonymous'
    document.head.appendChild(link)
  }

  for (const href of [
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap',
    'https://api.fontshare.com/v2/css?f[]=satoshi@900&display=swap',
  ]) {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = href
    link.media = 'print'
    link.onload = () => { link.media = 'all' }
    document.head.appendChild(link)
  }
}

function isPhone(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(max-width: 1023px)').matches
}

export default function HomePage() {
  const navigate = useNavigate()
  const { user, avatarUrl: authAvatar } = useAuth()
  const { events, loading, ready: eventsReady } = usePublicEvents()
  const [ambientReady, setAmbientReady] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>()
  const [avatarBroken, setAvatarBroken] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [sheetEvent, setSheetEvent] = useState<DbEvent | null>(null)
  const [modalEvent, setModalEvent] = useState<DbEvent | null>(null)
  const [editOpen, setEditOpen] = useState(false)

  const meta = user?.user_metadata ?? {}
  const initial = (meta.full_name ?? meta.name ?? user?.email ?? '?')[0]?.toUpperCase()

  useEffect(() => {
    if (!eventsReady) return
    loadFonts()
    const t = window.setTimeout(() => setAmbientReady(true), 300)
    // Reveal React only after home has events + a painted frame — shell stays live until then
    const reveal = () => window.__PAKSOC_REVEAL_APP__?.()
    const id = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(reveal)
    })
    // Safety: never leave shell forever if rAF stalls
    const fallback = window.setTimeout(reveal, 800)
    return () => {
      clearTimeout(t)
      clearTimeout(fallback)
      cancelAnimationFrame(id)
    }
  }, [eventsReady])

  useEffect(() => {
    setAvatarBroken(false)
    if (!user) { setAvatarUrl(undefined); return }
    if (authAvatar) { setAvatarUrl(authAvatar); return }
    if (!eventsReady) return
    let alive = true
    void import('@/members/services/fetchMemberAvatar')
      .then(m => m.fetchMemberAvatar(user.id))
      .then(url => { if (alive) setAvatarUrl(url ?? undefined) })
      .catch(() => {})
    return () => { alive = false }
  }, [user, authAvatar, eventsReady])

  const overlayOpen = !!sheetEvent || !!modalEvent || editOpen
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

  /** Always open a popup instantly — sheet on phone, modal on desktop. */
  function openEvent(ev: DbEvent) {
    setSelectedId(ev.id)
    if (isPhone()) {
      setModalEvent(null)
      setSheetEvent(ev)
    } else {
      setSheetEvent(null)
      setModalEvent(ev)
    }
  }

  function handleEditProfile() {
    if (!user) return
    setEditOpen(true)
  }

  const showSkeletons = loading && events.length === 0

  return (
    <div style={{
      background: PALETTE.page,
      color: PALETTE.dark,
      fontFamily: 'system-ui, sans-serif',
      minHeight: '100vh',
      position: 'relative',
    }}>
      {ambientReady && (
        <Suspense fallback={null}>
          <AmbientBackground />
        </Suspense>
      )}

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
          <HeroBanner banner={banner} loading={loading && !banner} />

          <div className="bg-transparent rounded-none px-4 py-4 lg:px-6 lg:py-5">
            <div className="flex items-center justify-between mb-5">
              <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: PALETTE.muted }}>Events</span>
              <button onClick={() => navigate('/all-events')} style={{ color: ACCENT }} className="text-xs font-semibold bg-transparent border-none cursor-pointer hover:opacity-80">View All Events →</button>
            </div>

            {showSkeletons && (
              <>
                <div className="grid w-full grid-cols-1 md:grid-cols-3 gap-4 md:hidden">
                  {[1, 2].map(i => <EventCardSkeleton key={i} />)}
                </div>
                <div className="grid w-full grid-cols-1 md:grid-cols-3 gap-4 hidden md:grid">
                  {[1, 2, 3].map(i => <EventCardSkeleton key={i} />)}
                </div>
              </>
            )}

            {!showSkeletons && (
              <>
                <div className="grid w-full grid-cols-1 md:grid-cols-3 gap-4 md:hidden">
                  {phoneEvents.length === 0
                    ? <p style={{ color: PALETTE.muted }} className="text-sm m-0 col-span-full">No events yet — check back soon.</p>
                    : phoneEvents.map((ev, i) => (
                      <PublicEventCard key={ev.id} event={ev} selected={selectedId === ev.id || (!selectedId && ev.id === featured?.id)} now={now} priority={i < 2} onClick={() => openEvent(ev)} />
                    ))}
                </div>
                <div className="grid w-full grid-cols-1 md:grid-cols-3 gap-4 hidden md:grid">
                  {allPublic.length === 0
                    ? <p style={{ color: PALETTE.muted }} className="text-sm m-0 col-span-full">No events yet — announce some from Events Manager.</p>
                    : allPublic.slice(0, 3).map((ev, i) => (
                      <PublicEventCard key={ev.id} event={ev} selected={selectedId === ev.id || (!selectedId && ev.id === featured?.id)} now={now} priority={i < 2} onClick={() => openEvent(ev)} />
                    ))}
                </div>
              </>
            )}
          </div>

          {/* Social wall deferred — never blocks timer / event popups */}
          <div className="bg-transparent rounded-none px-4 py-4 lg:px-6 lg:py-5">
            <div className="flex items-center justify-between mb-5">
              <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: PALETTE.muted }}>Social Wall</span>
              <a href="#" style={{ color: ACCENT }} className="text-xs font-semibold no-underline hover:opacity-80">View on Instagram →</a>
            </div>
            <Suspense fallback={<div className="motion-skeleton h-40 rounded-xl" />}>
              <SocialWall />
            </Suspense>
          </div>
        </div>

        <div className="hidden lg:block flex-[3] min-w-0">
          <Suspense fallback={<div className="motion-skeleton h-80 rounded-xl" />}>
            <LocationSidebar mapEvent={featured ?? banner} featured={featured} now={now} />
          </Suspense>
        </div>
      </div>

      {sheetEvent && (
        <MobileEventSheet event={sheetEvent} now={now} onClose={() => setSheetEvent(null)} />
      )}
      {modalEvent && (
        <EventDetailModal event={modalEvent} now={now} onClose={() => setModalEvent(null)} />
      )}
      {editOpen && user && (
        <Suspense fallback={null}>
          <EditProfileModal user={user} initial={initial ?? '?'} onClose={() => setEditOpen(false)} />
        </Suspense>
      )}

      <div className="relative z-10">
        <Footer />
      </div>
    </div>
  )
}
