import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchEvents, type DbEvent } from '@/lib/db'

const BANNER_EVENT = {
  title:    'Eid Gala 2026',
  subtitle: 'A night of culture, music & cuisine',
  date:     'Saturday, 28 June 2026',
  venue:    'Roundhouse, UNSW Sydney',
}

const INSTAGRAM_POSTS = [
  { id: 1, type: 'reel', likes: 412, caption: 'Highlights from our last event ✨' },
  { id: 2, type: 'post', likes: 289, caption: 'Eid Mubarak from PakSoc UNSW 🌙'  },
  { id: 3, type: 'post', likes: 198, caption: 'Chai & Chaat night recap ☕🍢'     },
  { id: 4, type: 'reel', likes: 534, caption: 'Cricket Carnival 2025 🏏'          },
  { id: 5, type: 'post', likes: 173, caption: 'Behind the scenes 🎬'              },
  { id: 6, type: 'post', likes: 310, caption: 'New exec team 2026 🎉'             },
]

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}

export default function Home() {
  const navigate = useNavigate()
  const [events, setEvents]   = useState<DbEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchEvents()
      .then(setEvents)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-[#F8F7F4] text-paksoc-deep font-sans">

      {/* ── NAVBAR ── */}
      <nav className="sticky top-0 z-50 bg-paksoc-deep h-[56px] flex items-center justify-between px-8 shadow-md">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-paksoc-bright flex items-center justify-center font-extrabold text-sm text-white">PS</div>
          <div>
            <div className="text-white font-bold text-[15px] leading-tight">PakSoc UNSW</div>
            <div className="text-paksoc-bright text-[10px] tracking-wide">Pakistani Society</div>
          </div>
        </div>
        <ul className="flex gap-6 list-none m-0 p-0">
          {['Home', 'Events', 'Gallery', 'About', 'Contact'].map(link => (
            <li key={link}>
              <a href="#" className={`text-white text-sm font-medium no-underline transition-opacity hover:opacity-100 ${link === 'Home' ? 'opacity-100' : 'opacity-70'}`}>{link}</a>
            </li>
          ))}
        </ul>
        <button className="bg-paksoc-gold text-paksoc-deep rounded-3xl px-5 py-1.5 font-bold text-sm cursor-pointer border-none hover:opacity-90 transition-opacity">
          Member Login
        </button>
      </nav>

      {/* ── BANNER ── */}
      <section className="bg-gradient-to-br from-paksoc-deep via-paksoc-mid to-[#025A24] py-6 px-8 flex items-center justify-between relative overflow-hidden">
        <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full bg-paksoc-bright/[.06]" />
        <div>
          <span className="bg-paksoc-gold/20 border border-paksoc-gold text-paksoc-gold rounded-xl px-2.5 py-0.5 text-[10px] font-bold tracking-widest uppercase mb-2 inline-block">
            Featured Event
          </span>
          <h1 className="text-white text-[clamp(20px,3.5vw,36px)] font-extrabold leading-tight mb-1 tracking-tight">
            {BANNER_EVENT.title}
          </h1>
          <p className="text-white/65 text-xs mb-2">{BANNER_EVENT.subtitle}</p>
          <div className="flex gap-4 text-white/55 text-[11px] flex-wrap">
            <span>📅 {BANNER_EVENT.date}</span>
            <span>📍 {BANNER_EVENT.venue}</span>
          </div>
        </div>
        <button className="shrink-0 bg-paksoc-gold text-paksoc-deep border-none rounded-3xl px-6 py-2.5 text-sm font-bold cursor-pointer hover:scale-105 transition-transform shadow-[0_4px_16px_rgba(201,168,76,0.35)]">
          🎟 Buy Tickets
        </button>
      </section>

      {/* ── UPCOMING EVENTS ── */}
      <section className="py-8 px-8 max-w-[1100px] mx-auto">
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-1 h-6 bg-paksoc-bright rounded-sm" />
          <h2 className="text-xl font-extrabold text-paksoc-deep m-0">Upcoming Events</h2>
        </div>

        {loading && (
          <div className="flex gap-4">
            {[1,2,3].map(i => <div key={i} className="flex-1 h-40 bg-white rounded-xl animate-pulse border border-[#D5E8D0]" />)}
          </div>
        )}

        {!loading && events.length === 0 && (
          <p className="text-paksoc-mid text-sm">No events yet — add some in Supabase.</p>
        )}

        <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-4">
          {events.map(ev => (
            <div key={ev.id} className="bg-white rounded-xl p-4 border border-[#D5E8D0] shadow-sm flex flex-col gap-2.5 hover:-translate-y-0.5 hover:shadow-md transition-all cursor-pointer">
              <div className="flex justify-between items-start">
                <span className="text-3xl">{ev.emoji}</span>
                <span className={`rounded-lg px-2.5 py-0.5 text-[10px] font-bold tracking-wide ${ev.tag === 'Flagship' ? 'bg-paksoc-gold text-paksoc-deep' : 'bg-[#D5E8D0] text-paksoc-mid'}`}>
                  {ev.tag}
                </span>
              </div>
              <h3 className="text-base font-bold text-paksoc-deep m-0">{ev.name}</h3>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-paksoc-mid">📅 {formatDate(ev.time)}</span>
                <span className="text-xs text-paksoc-mid">📍 {ev.location}</span>
              </div>
              <div className="mt-auto flex gap-2 pt-1">
                <button className="flex-1 bg-transparent border border-paksoc-mid text-paksoc-mid rounded-2xl py-1.5 text-xs font-semibold cursor-pointer hover:bg-paksoc-mid hover:text-white transition-all">
                  View Details →
                </button>
                <button
                  onClick={() => navigate(`/subcom/tasks/${ev.id}`)}
                  className="flex-1 bg-paksoc-deep text-white border-none rounded-2xl py-1.5 text-xs font-semibold cursor-pointer hover:bg-paksoc-mid transition-all"
                >
                  🗂 Manage Tasks
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── LOCATION ── */}
      <section className="bg-gradient-to-br from-[#D5E8D0] to-[#C5DFC0] py-8 px-8">
        <div className="max-w-[1100px] mx-auto flex items-center justify-between flex-wrap gap-5">
          <div>
            <div className="flex items-center gap-2.5 mb-2.5">
              <div className="w-1 h-6 bg-paksoc-mid rounded-sm" />
              <h2 className="text-xl font-extrabold text-paksoc-deep m-0">Find Us</h2>
            </div>
            <p className="text-paksoc-mid text-sm max-w-[380px] leading-6 m-0">
              PakSoc UNSW events are held across the UNSW Kensington campus. Check individual events for specific venue details.
            </p>
          </div>
          <div className="bg-white rounded-xl px-8 py-5 shadow-md flex flex-col items-center gap-2.5 min-w-[240px]">
            <div className="text-4xl">🗺️</div>
            <p className="text-paksoc-mid text-xs text-center m-0">UNSW Sydney, Kensington NSW 2052</p>
            <button className="bg-paksoc-mid text-white border-none rounded-2xl px-5 py-2 font-bold text-xs cursor-pointer hover:bg-paksoc-deep transition-all shadow-sm">
              📍 Get Directions
            </button>
          </div>
        </div>
      </section>

      {/* ── INSTAGRAM ── */}
      <section className="py-8 px-8 max-w-[1100px] mx-auto">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-1 h-6 bg-paksoc-bright rounded-sm" />
            <h2 className="text-xl font-extrabold text-paksoc-deep m-0">Instagram</h2>
          </div>
          <a href="#" className="text-paksoc-mid no-underline font-semibold text-xs border border-paksoc-mid rounded-2xl px-4 py-1.5 hover:bg-paksoc-mid hover:text-white transition-all">
            @paksoc_unsw ↗
          </a>
        </div>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-2.5">
          {INSTAGRAM_POSTS.map(post => (
            <div key={post.id} className="aspect-square bg-gradient-to-br from-paksoc-mid to-paksoc-deep rounded-xl relative overflow-hidden cursor-pointer hover:opacity-85 transition-opacity shadow-sm">
              <div className="absolute inset-0 bg-gradient-to-br from-paksoc-bright/25 to-transparent" />
              {post.type === 'reel' && (
                <span className="absolute top-2 right-2 bg-black/55 text-white text-[9px] font-bold px-1.5 py-0.5 rounded tracking-wide">REEL</span>
              )}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/65 to-transparent pt-5 px-2.5 pb-2">
                <p className="text-white text-[10px] m-0 leading-snug">{post.caption}</p>
                <span className="text-white/70 text-[10px]">❤️ {post.likes}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-paksoc-deep py-5 px-8 text-center text-white/50 text-xs">
        <div className="text-paksoc-bright font-bold text-sm mb-1">PakSoc UNSW</div>
        <div>Pakistani Society, University of New South Wales · Sydney, Australia</div>
        <div className="mt-1">© {new Date().getFullYear()} PakSoc UNSW. All rights reserved.</div>
      </footer>

    </div>
  )
}
