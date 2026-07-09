import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchPublicEvents, type DbEvent } from '@/lib/db'
import { useAuth } from '@/hooks/useAuth'
import { signOut } from '@/lib/auth'
import { updateMemberName, fetchMemberName, fetchMemberAvatar } from '@/lib/db/members'
import { CachedMapEmbed, mapEmbedSrc } from '@/components/CachedMapEmbed'

function useCountdown(iso: string | undefined) {
  const [cd, setCd] = useState({ days: 0, hrs: 0, mins: 0, secs: 0 })
  useEffect(() => {
    if (!iso) return
    const tick = () => {
      const diff = new Date(iso).getTime() - Date.now()
      if (diff <= 0) { setCd({ days: 0, hrs: 0, mins: 0, secs: 0 }); return }
      setCd({ days: Math.floor(diff/86_400_000), hrs: Math.floor((diff%86_400_000)/3_600_000), mins: Math.floor((diff%3_600_000)/60_000), secs: Math.floor((diff%60_000)/1_000) })
    }
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id)
  }, [iso])
  return cd
}

const IG = [
  { id: 1, type: 'reel', likes: 412, caption: 'Highlights from our last event' },
  { id: 2, type: 'post', likes: 289, caption: 'Eid Mubarak from PakSoc UNSW'   },
  { id: 3, type: 'post', likes: 198, caption: 'Chai and Chaat night recap'      },
  { id: 4, type: 'reel', likes: 534, caption: 'Cricket Carnival 2025'           },
  { id: 5, type: 'post', likes: 173, caption: 'Behind the scenes'               },
  { id: 6, type: 'post', likes: 310, caption: 'New exec team 2026'              },
]

function formatTimelineTime(value: string) {
  if (!value) return ''
  const [h, m] = value.split(':').map(Number)
  if (Number.isNaN(h) || Number.isNaN(m)) return value
  const d = new Date()
  d.setHours(h, m, 0, 0)
  return d.toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit' })
}

function cardImg(ev: { name: string; image_url?: string }) {
  if (ev.image_url) return ev.image_url
  // fallback keyword map for legacy events without uploaded images
  const FALLBACK: Record<string, string> = {
    raunaq: '/raunaq.png', khel: '/khel.png', iftar: '/iftar.png', cricket: '/cricket.png',
  }
  const key = Object.keys(FALLBACK).find(k => ev.name.toLowerCase().includes(k))
  return key ? FALLBACK[key] : null
}

const IG_GRADS = [
  'linear-gradient(135deg,#0D2A20,#061510)',
  'linear-gradient(135deg,#0D1A2A,#060D14)',
  'linear-gradient(135deg,#1A1028,#0A0614)',
  'linear-gradient(135deg,#2A1A0D,#140D06)',
  'linear-gradient(135deg,#0A1E30,#050C18)',
  'linear-gradient(135deg,#1E0D1A,#0D060E)',
]

function dateParts(iso: string) {
  const d = new Date(iso)
  return {
    month: d.toLocaleDateString('en-AU',{month:'short'}).toUpperCase(),
    day:   d.getDate(),
    time:  d.toLocaleTimeString('en-AU',{hour:'2-digit',minute:'2-digit'}),
  }
}

const A  = '#22C55E'            // lime-yellow accent
const C  = {
  page:   '#F3F4F6',
  card:   '#FFFFFF',
  border: '#E5E7EB',
  muted:  '#6B7280',
  dark:   '#111827',
  shadow: '0 2px 8px rgba(0,0,0,0.07), 0 1px 2px rgba(0,0,0,0.04)',
}
const REGISTER_TEAM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSf-oBs55neMNS7-w-79MLrYtVTQ41lILchY_LTfdH67Ho5ltA/viewform'
const TICKETS_URL       = 'https://campus.hellorubric.com/?eid=67422'

function Card({ children, className = '', style = {}, flatOnMobile = false }: { children: React.ReactNode; className?: string; style?: React.CSSProperties; flatOnMobile?: boolean }) {
  const shell = flatOnMobile
    ? 'max-lg:rounded-none max-lg:bg-transparent max-lg:border-0 max-lg:shadow-none max-lg:border-b max-lg:border-[#E5E7EB] lg:rounded-2xl lg:bg-white lg:border lg:border-[#E5E7EB] lg:shadow-[0_2px_8px_rgba(0,0,0,0.07),0_1px_2px_rgba(0,0,0,0.04)]'
    : 'rounded-2xl bg-white border border-[#E5E7EB] shadow-[0_2px_8px_rgba(0,0,0,0.07),0_1px_2px_rgba(0,0,0,0.04)]'
  return (
    <div style={style} className={`${shell} ${className}`}>
      {children}
    </div>
  )
}


function EventDetailContent({ event, now }: { event: DbEvent; now: Date }) {
  const { month, day, time } = dateParts(event.time)
  const isEnded = new Date(event.time) <= now
  const schedule = event.timeline ?? []

  return (
    <>
      <div className="flex items-start justify-between gap-2">
        <div style={{ color: C.dark, fontFamily: '"Satoshi", sans-serif', fontWeight: 900 }} className="text-base leading-snug">
          {event.name}
        </div>
        <div className="rounded-lg px-2.5 py-1 text-center shrink-0" style={{ background: '#fff', border: `1px solid ${isEnded ? C.border : A}` }}>
          <div className="font-extrabold tracking-widest" style={{ fontSize: 9, color: isEnded ? '#9CA3AF' : A }}>{month}</div>
          <div className="text-sm font-extrabold leading-none" style={{ color: isEnded ? '#9CA3AF' : A }}>{day}</div>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2 text-xs" style={{ color: C.muted }}>
          <span style={{ color: A }}>◷</span> {time}
        </div>
        <div className="flex items-center gap-2 text-xs" style={{ color: C.muted }}>
          <span style={{ color: A }}>◎</span> {event.location}
        </div>
        {event.price != null && (
          <div className="flex items-center gap-2 text-xs" style={{ color: C.muted }}>
            <span style={{ color: A }}>$</span>
            {event.price > 0 ? `$${Number(event.price).toFixed(2)}` : 'Free entry'}
          </div>
        )}
      </div>

      {isEnded
        ? <span className="text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide w-fit"
            style={{ background: '#F3F4F6', color: '#9CA3AF' }}>Ended</span>
        : <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wide w-fit"
            style={{ background: 'rgba(34,197,94,0.12)', color: A }}>Upcoming</span>
      }

      {schedule.length > 0 && (
        <div className="pt-1">
          <div style={{ color: C.dark }} className="text-[11px] font-bold uppercase tracking-widest mb-3">Timeline</div>
          <div className="flex flex-col">
            {schedule.map((item, i) => (
              <div key={`${item.time}-${item.title}-${i}`} className="flex gap-3">
                <div className="flex flex-col items-center shrink-0" style={{ width: 14 }}>
                  <div className="w-2.5 h-2.5 rounded-full mt-1 shrink-0" style={{ background: A }} />
                  {i < schedule.length - 1 && (
                    <div className="w-px flex-1 my-1" style={{ background: C.border, minHeight: 18 }} />
                  )}
                </div>
                <div className="pb-4 min-w-0">
                  <div style={{ color: A }} className="text-xs font-semibold">{formatTimelineTime(item.time)}</div>
                  <div style={{ color: C.dark }} className="text-sm leading-snug">{item.title}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )
}

function SectionHeader({ title, right }: { title: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-5">
      <span style={{ color: C.dark }} className="text-sm font-extrabold tracking-widest uppercase">{title}</span>
      {right}
    </div>
  )
}

export default function Home() {
  const navigate = useNavigate()
  const { user, avatarUrl: authAvatar } = useAuth()
  const [events, setEvents]   = useState<DbEvent[]>([])
  const [loading, setLoading] = useState(true)

  const meta        = user?.user_metadata ?? {}
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>()
  const [avatarBroken, setAvatarBroken] = useState(false)
  const initial     = (meta.full_name ?? meta.name ?? user?.email ?? '?')[0]?.toUpperCase()
  const [menuOpen, setMenuOpen]       = useState(false)
  const [editOpen, setEditOpen]       = useState(false)
  const [editName, setEditName]       = useState('')
  const [editSaving, setEditSaving]   = useState(false)
  const [selectedId, setSelectedId]   = useState<string | null>(null)
  const [mobileEventOpen, setMobileEventOpen] = useState<DbEvent | null>(null)

  useEffect(() => { fetchPublicEvents().then(setEvents).catch(console.error).finally(() => setLoading(false)) }, [])

  useEffect(() => {
    if (!mobileEventOpen) return
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [mobileEventOpen])

  useEffect(() => {
    setAvatarBroken(false)
    if (!user) { setAvatarUrl(undefined); return }
    if (authAvatar) { setAvatarUrl(authAvatar); return }
    fetchMemberAvatar(user.id).then(url => setAvatarUrl(url ?? undefined)).catch(() => {})
  }, [user, authAvatar])

  const now      = new Date()
  const upcoming = [...events].filter(ev => new Date(ev.time) > now).sort((a,b) => +new Date(a.time) - +new Date(b.time))
  const past     = [...events].filter(ev => new Date(ev.time) <= now).sort((a,b) => +new Date(b.time) - +new Date(a.time))
  const allPublic = [...upcoming, ...past]
  const phoneEvents = [...events].sort((a, b) => +new Date(b.time) - +new Date(a.time)).slice(0, 2)
  const banner   = upcoming[0] ?? null
  const cd       = useCountdown(banner?.time)

  const featured = allPublic.find(e => e.id === selectedId) ?? banner ?? allPublic[0] ?? null
  const mapEvent = featured ?? banner
  const desktopMapSrc = mapEvent ? mapEmbedSrc(mapEvent.location) : null

  const openEventOnMobile = (ev: DbEvent) => {
    setSelectedId(ev.id)
    if (window.matchMedia('(max-width: 1023px)').matches) setMobileEventOpen(ev)
  }

  const eventGridCls = 'grid w-full grid-cols-1 md:grid-cols-3 gap-4'

  function renderEventCard(ev: DbEvent) {
    const { month, day, time } = dateParts(ev.time)
    const img   = cardImg(ev)
    const ended = new Date(ev.time) <= now
    return (
      <div key={ev.id}
        onClick={() => openEventOnMobile(ev)}
        style={{
          border: selectedId === ev.id || (!selectedId && ev.id === featured?.id)
            ? `2px solid ${A}`
            : ended ? `1px solid ${C.border}` : `1.5px solid ${A}`,
          boxShadow: ended ? C.shadow : `0 4px 18px rgba(34,197,94,0.13)`,
        }}
        className="rounded-xl overflow-hidden cursor-pointer hover:-translate-y-0.5 active:scale-[0.98] transition-all flex flex-col bg-white min-w-0 w-full">
        <div className="relative" style={{ height: 120 }}>
          {img
            ? <img src={img} alt={ev.name} className="w-full h-full object-cover" />
            : <div className="w-full h-full" style={{ background: ended ? 'linear-gradient(135deg,#F3F4F6,#E5E7EB)' : 'linear-gradient(135deg,#DCFCE7,#BBF7D0)' }} />
          }
          {!ended && (
            <div className="absolute top-2 right-2 rounded-full px-2 py-0.5 text-[9px] font-extrabold tracking-widest uppercase"
              style={{ background: A, color: '#fff' }}>
              Upcoming
            </div>
          )}
          <div className="absolute top-2 left-2 rounded-lg px-2.5 py-1 text-center shadow-sm"
            style={{ background: '#fff', border: `1px solid ${ended ? '#E5E7EB' : A}` }}>
            <div className="font-extrabold tracking-widest" style={{ fontSize: 9, color: ended ? '#9CA3AF' : A }}>{month}</div>
            <div className="text-base font-extrabold leading-none" style={{ color: ended ? '#9CA3AF' : A }}>{day}</div>
          </div>
        </div>
        <div className="px-3 pt-2.5 pb-3 flex flex-col flex-1">
          <div className="flex items-start justify-between gap-1 mb-1.5">
            <div style={{ color: C.dark, fontFamily: '"Inter", sans-serif', fontWeight: 600 }} className="text-sm leading-snug flex items-center gap-1.5 flex-wrap">
              {ev.name}
              {ended && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide"
                  style={{ background: '#F3F4F6', color: '#9CA3AF' }}>Ended</span>
              )}
            </div>
            <span style={{ color: C.muted }} className="text-[11px] shrink-0 mt-0.5">
              {ev.price && ev.price > 0 ? `$${Number(ev.price).toFixed(2)}` : 'Free'}
            </span>
          </div>
          <div className="text-[11px] mb-0.5 flex items-center gap-1.5" style={{ color: ended ? '#9CA3AF' : C.muted }}>
            <span style={{ color: ended ? '#9CA3AF' : A }}>◷</span>{time}
          </div>
          <div className="text-[11px] mb-2.5 truncate flex items-center gap-1.5" style={{ color: ended ? '#9CA3AF' : C.muted }}>
            <span style={{ color: ended ? '#9CA3AF' : A }}>◎</span>{ev.location}
          </div>
          {!ended && (
            <a
              href={TICKETS_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              style={{ color: A }}
              className="text-xs font-semibold no-underline hover:opacity-70 transition-opacity mt-auto self-start"
            >
              Get Tickets →
            </a>
          )}
          <p className="lg:hidden text-[10px] m-0 mt-2 font-semibold" style={{ color: '#9CA3AF' }}>
            Tap for schedule →
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: C.page, color: C.dark, fontFamily: '"Inter", system-ui, sans-serif', minHeight: '100vh' }}>

      {/* ── NAVBAR ── */}
      <nav style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(14px)', borderBottom: `1px solid ${C.border}` }}
        className="sticky top-0 z-50 h-14 px-4 md:px-8 flex items-center justify-between gap-3">

        {/* Logo */}
        <div className="flex items-center gap-2 shrink min-w-0">
          <img src="/logo.png" alt="PakSoc UNSW" className="w-9 h-9 rounded-full object-cover shrink-0" />
          <div className="min-w-0">
            <div style={{ color: C.dark }} className="font-bold text-sm leading-tight truncate">PakSoc UNSW</div>
            <div style={{ color: A, fontSize: 9 }} className="tracking-widest uppercase truncate">Pakistani Society</div>
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2 shrink-0 ml-auto">
          {user && (
            <>
              <button onClick={() => navigate('/events')} style={{ background: A, color: '#fff' }}
                className="rounded-full px-3.5 py-1.5 font-bold text-xs border-none cursor-pointer hover:opacity-85 transition-opacity whitespace-nowrap shadow-sm">
                Manage Events
              </button>
              <button onClick={() => navigate('/roles')} style={{ color: C.dark, border: `1px solid ${C.border}`, background: '#fff' }}
                className="rounded-full px-3.5 py-1.5 font-bold text-xs cursor-pointer hover:bg-gray-50 transition-colors whitespace-nowrap hidden sm:block shadow-sm">
                Manage Roles
              </button>
            </>
          )}
          {user ? (
            <div className="relative">
              <button onClick={() => setMenuOpen(o => !o)} className="p-0 border-none bg-transparent cursor-pointer rounded-full">
                {avatarUrl && !avatarBroken
                  ? <img src={avatarUrl} alt="" referrerPolicy="no-referrer"
                      onError={() => setAvatarBroken(true)}
                      className="w-8 h-8 rounded-full object-cover ring-2 ring-[#22C55E] ring-offset-1 hover:opacity-90 transition-opacity" />
                  : <div style={{ background: '#111827', color: '#fff' }} className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs hover:opacity-90 transition-opacity">{initial}</div>
                }
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                  <div style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}
                    className="absolute right-0 mt-2 w-36 rounded-xl z-50 overflow-hidden">
                    <button onClick={async () => {
                        setMenuOpen(false)
                        const saved = user ? await fetchMemberName(user.id) : null
                        setEditName(saved ?? meta.full_name ?? meta.name ?? '')
                        setEditOpen(true)
                      }}
                      style={{ color: C.dark }}
                      className="w-full text-left px-4 py-2.5 text-sm font-semibold bg-transparent border-none cursor-pointer hover:bg-gray-50 transition-colors">
                      Edit Profile
                    </button>
                    <div style={{ background: C.border }} className="h-px mx-3" />
                    <button onClick={() => { setMenuOpen(false); signOut().then(() => navigate('/login')) }}
                      style={{ color: '#DC2626' }}
                      className="w-full text-left px-4 py-2.5 text-sm font-semibold bg-transparent border-none cursor-pointer hover:bg-red-50 transition-colors">
                      Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <button onClick={() => navigate('/login')} style={{ background: '#111827', color: '#fff' }}
              className="rounded-full px-3.5 py-1.5 font-bold text-xs border-none cursor-pointer hover:opacity-90 whitespace-nowrap">
              Login
            </button>
          )}
        </div>
      </nav>

      <div className="flex gap-0 lg:gap-5 px-0 lg:px-8 py-0 lg:py-5 max-w-[1400px] mx-auto items-start w-full">

      {/* ══ LEFT COLUMN (70%) ══ */}
      <div className="flex flex-col gap-0 lg:gap-5 flex-[7] min-w-0 w-full">

        {/* ── HERO ── */}
        <div className="px-4 pt-4 lg:p-0">
          <div className="overflow-hidden relative flex flex-col md:flex-row md:min-h-[260px] rounded-2xl border border-[#E5E7EB] shadow-[0_2px_8px_rgba(0,0,0,0.07),0_1px_2px_rgba(0,0,0,0.04)] lg:rounded-[20px]">

          {/* Full-bleed background image */}
          <img src="/banner.png" alt="" className="absolute inset-0 w-full h-full object-cover object-center" />
          {/* Left fade so text stays readable */}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.7) 22%, rgba(255,255,255,0.1) 42%, transparent 55%)' }} />

          {/* LEFT — greeting + countdown */}
          <div className="relative z-10 flex flex-col p-4 sm:p-8 flex-1 gap-3 md:gap-0">

            {/* Top: heading */}
            <h1 style={{ color: C.dark, fontFamily: '"Satoshi", sans-serif', fontWeight: 900 }} className="text-3xl sm:text-[42px] tracking-tight m-0 leading-none">
              Next <span style={{ color: A }}>Event</span>
            </h1>

            {/* Spacer pushes countdown to bottom (desktop) */}
            <div className="hidden md:block flex-1" />

            {/* Bottom: event name + timer */}
            {loading && <div style={{ border: `1px solid ${C.border}` }} className="rounded-xl h-24 animate-pulse bg-gray-100/80" />}
            {!loading && !banner && (
              <p style={{ color: C.muted }} className="text-sm m-0">No upcoming events — check back soon.</p>
            )}
            {!loading && banner && (
              <div className="w-fit">
                <div style={{ color: C.dark }} className="text-[17px] font-extrabold mb-2 md:mb-3">{banner.name}</div>
                <div className="flex gap-2 w-fit">
                  {(['days','hrs','mins','secs'] as const).map((k, i) => {
                    const val = [cd.days, cd.hrs, cd.mins, cd.secs][i]
                    return (
                      <div key={k} style={{ background: '#fff', border: `1px solid ${C.border}`, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
                        className="rounded-xl px-2.5 py-2 text-center min-w-[48px] sm:min-w-[54px] shrink-0">
                        <div style={{ color: A, fontSize: 22, lineHeight: 1 }} className="font-extrabold tabular-nums sm:text-[24px]">{String(val).padStart(2,'0')}</div>
                        <div style={{ color: C.muted, fontSize: 9 }} className="uppercase tracking-widest mt-1 font-bold">{k}</div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Mobile — register + tickets */}
            {!loading && banner && (
              <div className="md:hidden flex gap-2 mt-1 w-full">
                <a
                  href={REGISTER_TEAM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ border: `1.5px solid ${A}`, color: A, background: '#fff' }}
                  className="flex-1 flex items-center justify-center rounded-xl px-2 py-3 text-xs font-bold no-underline active:scale-[0.98] transition-transform min-w-0 shadow-sm"
                >
                  Register Your Team
                </a>
                <a
                  href={TICKETS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ background: '#C8FF00', color: '#111827' }}
                  className="flex-1 flex items-center justify-center rounded-xl px-2 py-3 font-bold text-xs no-underline hover:opacity-85 active:scale-[0.98] transition-transform min-w-0 shadow-sm"
                >
                  Get Tickets →
                </a>
              </div>
            )}
          </div>

          {/* RIGHT — register + tickets (desktop) */}
          <div className="hidden md:flex relative z-10 w-[42%] shrink-0 flex-col justify-end items-end p-6">
            {!loading && (
              <div className="flex gap-2">
                <a
                  href={REGISTER_TEAM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ border: `1.5px solid ${A}`, color: A, background: '#fff' }}
                  className="rounded-xl px-5 py-2.5 font-bold text-sm no-underline hover:opacity-85 whitespace-nowrap shadow-sm"
                >
                  Register Your Team
                </a>
                <a
                  href={TICKETS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ background: '#C8FF00', color: '#111827' }}
                  className="rounded-xl px-5 py-2.5 font-bold text-sm no-underline hover:opacity-85 whitespace-nowrap"
                >
                  Get Your Tickets &rarr;
                </a>
              </div>
            )}
          </div>
          </div>
        </div>

        {/* ── EVENTS ── */}
        <Card flatOnMobile className="px-4 py-4 lg:px-6 lg:py-5">
          <SectionHeader title="Events"
            right={user ? (
              <button onClick={() => navigate('/events')} style={{ color: A }} className="text-xs font-semibold bg-transparent border-none cursor-pointer hover:opacity-80">
                Manage events &rarr;
              </button>
            ) : undefined}
          />
          {loading && (
            <div className="grid w-full grid-cols-1 md:grid-cols-3 gap-4">
              {[1,2,3].map(i => <div key={i} className="h-52 rounded-xl animate-pulse bg-gray-100 min-w-0" />)}
            </div>
          )}
          {!loading && (
            <>
              <div className={`${eventGridCls} md:hidden`}>
                {phoneEvents.length === 0
                  ? <p style={{ color: C.muted }} className="text-sm m-0 col-span-full">No events yet — check back soon.</p>
                  : phoneEvents.map(renderEventCard)}
              </div>
              <div className={`${eventGridCls} hidden md:grid`}>
                {allPublic.length === 0
                  ? <p style={{ color: C.muted }} className="text-sm m-0 col-span-full">No events yet — announce some from Events Manager.</p>
                  : allPublic.slice(0, 3).map(renderEventCard)}
              </div>
            </>
          )}
        </Card>

        {/* ── SOCIAL WALL ── */}
        <Card flatOnMobile className="px-4 py-4 lg:px-6 lg:py-5 max-lg:border-b-0">
          <SectionHeader title="Social Wall"
            right={<a href="#" style={{ color: A }} className="text-xs font-semibold no-underline hover:opacity-80">View on Instagram &rarr;</a>}
          />
          <div style={{ color: C.muted }} className="text-xs -mt-3 mb-4">Latest from @unswpaksoc</div>
          <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {IG.map((p, i) => (
              <div key={p.id}
                style={{ background: IG_GRADS[i], border: `1px solid ${C.border}`, minWidth: 140, aspectRatio: '4/5' }}
                className="rounded-xl relative overflow-hidden cursor-pointer hover:opacity-90 transition-opacity shrink-0">
                {p.type === 'reel' && (
                  <span className="absolute top-2 right-2 bg-black/60 text-white font-bold px-1.5 py-0.5 rounded" style={{ fontSize: 9 }}>REEL</span>
                )}
                <div className="absolute bottom-0 left-0 right-0 px-2.5 pb-2 pt-5" style={{ background: 'linear-gradient(to top,rgba(0,0,0,0.75),transparent)' }}>
                  <p className="text-white m-0 leading-snug" style={{ fontSize: 10 }}>{p.caption}</p>
                  <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 9 }}>{p.likes} likes</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

      </div>{/* end left column */}

      {/* ══ RIGHT SIDEBAR (30%) ══ */}
      <div className="hidden lg:flex flex-col gap-4 flex-[3] sticky top-[72px]">

        <Card className="overflow-hidden flex flex-col">
          <div className="px-5 pt-5"><SectionHeader title="Event Location" /></div>

          {/* Interactive Google Maps embed */}
          <div className="mx-5 rounded-xl overflow-hidden border" style={{ height: 220, borderColor: C.border }}>
            {desktopMapSrc ? (
              <CachedMapEmbed cacheId="home-map-desktop" src={desktopMapSrc} title="Event location map" className="w-full h-full" />
            ) : (
              <div className="w-full h-full flex items-center justify-center" style={{ background: '#F3F4F6' }}>
                <span style={{ color: C.muted }} className="text-sm">No events to show</span>
              </div>
            )}
          </div>

          {/* Info */}
          {mapEvent ? (
            <div className="px-5 py-3">
              <div style={{ color: C.dark }} className="font-extrabold text-base mb-0.5">{mapEvent.name}</div>
              <div style={{ color: C.muted }} className="text-xs mb-0.5 flex items-center gap-1.5">
                <span style={{ color: A }}>◎</span>{mapEvent.location}
              </div>
              <div style={{ color: '#9CA3AF' }} className="text-xs">Kensington Campus, UNSW</div>
            </div>
          ) : (
            <div className="px-5 py-3">
              <p style={{ color: C.muted }} className="text-sm m-0">No events scheduled.</p>
            </div>
          )}
        </Card>

        {/* Featured event panel */}
        {featured && (
          <Card className="overflow-hidden flex flex-col">
            <div className="px-5 pt-5 pb-4 flex flex-col gap-3">
              <EventDetailContent event={featured} now={now} />
            </div>
          </Card>
        )}

      </div>{/* end right sidebar */}

      </div>{/* end two-column wrapper */}

      {/* ── MOBILE EVENT SHEET ── */}
      {mobileEventOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div
            className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
            onClick={() => setMobileEventOpen(null)}
          />
          <div
            style={{ background: C.card, boxShadow: '0 -8px 40px rgba(0,0,0,0.18)' }}
            className="absolute bottom-0 left-0 right-0 rounded-t-[28px] max-h-[88vh] flex flex-col animate-[slideUp_0.28s_ease-out]"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 rounded-full" style={{ background: C.border }} />
            </div>

            <div className="flex items-center justify-between px-5 pb-3 shrink-0">
              <span style={{ color: C.muted }} className="text-[11px] font-bold uppercase tracking-widest">Event Schedule</span>
              <button
                onClick={() => setMobileEventOpen(null)}
                style={{ color: C.muted, border: `1px solid ${C.border}` }}
                className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-lg leading-none cursor-pointer"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="overflow-y-auto px-5 pb-6 flex flex-col gap-4">
              <EventDetailContent event={mobileEventOpen} now={now} />

              {(mobileEventOpen.timeline ?? []).length === 0 && (
                <p style={{ color: C.muted }} className="text-sm m-0 py-2 text-center">
                  No schedule posted yet for this event.
                </p>
              )}

              <div>
                <div style={{ color: C.dark }} className="text-[11px] font-bold uppercase tracking-widest mb-2">Location</div>
                <div className="rounded-xl overflow-hidden border" style={{ height: 180, borderColor: C.border }}>
                  <CachedMapEmbed
                    cacheId="home-map-sheet"
                    src={mapEmbedSrc(mobileEventOpen.location)}
                    title="Event location map"
                    className="w-full h-full"
                  />
                </div>
                <div style={{ color: C.muted }} className="text-xs mt-2 flex items-center gap-1.5">
                  <span style={{ color: A }}>◎</span>{mobileEventOpen.location}
                </div>
                <div style={{ color: '#9CA3AF' }} className="text-[11px] mt-1">Kensington Campus, UNSW</div>
              </div>

              {new Date(mobileEventOpen.time) > now && (
                <a
                  href={TICKETS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ background: '#C8FF00', color: '#111827' }}
                  className="w-full flex items-center justify-center rounded-xl py-3.5 font-bold text-sm no-underline active:scale-[0.98] transition-transform"
                >
                  Get Your Tickets →
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── EDIT PROFILE MODAL ── */}
      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.35)' }}
          onClick={() => setEditOpen(false)}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: '0 8px 32px rgba(0,0,0,0.14)' }}
            className="rounded-2xl p-6 w-full max-w-sm"
            onClick={e => e.stopPropagation()}>

            <h3 style={{ color: C.dark }} className="font-extrabold text-base mb-1">Edit Profile</h3>
            <p style={{ color: C.muted }} className="text-xs mb-4">This name is shown to other team members.</p>

            <label style={{ color: C.dark }} className="text-xs font-semibold block mb-1">Display Name</label>
            <input
              value={editName}
              onChange={e => setEditName(e.target.value)}
              placeholder="Your name"
              style={{ border: `1px solid ${C.border}`, color: C.dark }}
              className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-200 mb-4 bg-gray-50"
            />

            <div className="flex gap-2 justify-end">
              <button onClick={() => setEditOpen(false)}
                style={{ color: C.muted, border: `1px solid ${C.border}` }}
                className="rounded-xl px-4 py-2 text-sm font-semibold bg-transparent cursor-pointer hover:bg-gray-50">
                Cancel
              </button>
              <button
                disabled={editSaving || !editName.trim()}
                onClick={async () => {
                  if (!user || !editName.trim()) return
                  setEditSaving(true)
                  try {
                    await updateMemberName(user.id, editName.trim())
                    setEditOpen(false)
                  } catch (e) { console.error(e) }
                  finally { setEditSaving(false) }
                }}
                style={{ background: editSaving ? '#9CA3AF' : '#111827', color: '#fff' }}
                className="rounded-xl px-4 py-2 text-sm font-bold border-none cursor-pointer hover:opacity-90 disabled:opacity-50">
                {editSaving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: `1px solid ${C.border}` }} className="py-4 px-4 lg:px-8 flex flex-col items-center gap-2 text-center">

        {/* Social icons */}
        <div className="flex items-center gap-5">
          <a href="https://instagram.com/unswpaksoc" target="_blank" rel="noopener noreferrer" style={{ color: C.muted }} className="hover:opacity-60 transition-opacity">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>
          </a>
          <a href="https://tiktok.com/@unswpaksoc" target="_blank" rel="noopener noreferrer" style={{ color: C.muted }} className="hover:opacity-60 transition-opacity">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.75a4.85 4.85 0 0 1-1.01-.06z"/></svg>
          </a>
          <a href="https://facebook.com/unswpaksoc" target="_blank" rel="noopener noreferrer" style={{ color: C.muted }} className="hover:opacity-60 transition-opacity">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
          </a>
        </div>

        {/* Become a member link */}
        <a href="https://www.arc.unsw.edu.au/clubs/paksoc" target="_blank" rel="noopener noreferrer"
          style={{ color: A }} className="text-sm font-semibold no-underline hover:opacity-70 transition-opacity">
          Become a Member →
        </a>

        <div style={{ color: '#9CA3AF' }} className="text-xs">&copy; {new Date().getFullYear()} PakSoc UNSW · Pakistani Society, University of New South Wales</div>

      </footer>

    </div>
  )
}

