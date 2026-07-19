import { useCallback, useEffect, useRef, useState } from 'react'
import { ACCENT, PALETTE } from '@/config/theme'
import { usePermissions } from '@/roles/hooks/usePermissions'
import { useRealtimeTable } from '@/core/supabase/useRealtimeTable'
import { fetchSocialPosts, refreshSocialPosts, IG_USERNAME, WALL_SIZE, type SocialPost } from '../services/socialPosts'

const PLACEHOLDERS = [
  { id: 1, type: 'reel', likes: 412, caption: 'Highlights from our last event' },
  { id: 2, type: 'post', likes: 289, caption: 'Eid Mubarak from PakSoc UNSW'   },
  { id: 3, type: 'post', likes: 198, caption: 'Chai and Chaat night recap'      },
  { id: 4, type: 'reel', likes: 534, caption: 'Cricket Carnival 2025'           },
  { id: 5, type: 'post', likes: 173, caption: 'Behind the scenes'               },
  { id: 6, type: 'post', likes: 310, caption: 'New exec team 2026'              },
]

const GRADS = [
  'linear-gradient(135deg,#0D2A20,#061510)', 'linear-gradient(135deg,#0D1A2A,#060D14)',
  'linear-gradient(135deg,#1A1028,#0A0614)', 'linear-gradient(135deg,#2A1A0D,#140D06)',
  'linear-gradient(135deg,#0A1E30,#050C18)', 'linear-gradient(135deg,#1E0D1A,#0D060E)',
]

function CardOverlay({ caption, likes }: { caption: string; likes: number }) {
  // Line 1 spans full width; a zero-width float spacer pushes the likes label
  // down so it floats right on line 2 and the caption wraps around it.
  return (
    <div className="absolute bottom-0 left-0 right-0 px-2.5 pb-2.5 pt-8"
      style={{ background: 'linear-gradient(to top,rgba(0,0,0,0.85),transparent)' }}>
      <p className="m-0 leading-snug overflow-hidden" style={{ fontSize: 10, color: PALETTE.dark, maxHeight: '2.75em' }}>
        <span aria-hidden className="float-right" style={{ width: 0, height: '1.375em' }} />
        <span className="float-right clear-right ml-1.5" style={{ color: PALETTE.muted, fontSize: 9, lineHeight: '13.75px' }}>{likes} likes</span>
        {caption}
      </p>
    </div>
  )
}

function ReelBadge() {
  return (
    <span className="absolute top-2 right-2 font-bold px-1.5 py-0.5 rounded text-white"
      style={{ fontSize: 9, background: 'rgba(0,0,0,0.65)' }}>REEL</span>
  )
}

function ScrollArrow({ dir, onClick }: { dir: 'left' | 'right'; onClick: () => void }) {
  return (
    <button onClick={onClick} aria-label={dir === 'left' ? 'Scroll left' : 'Scroll right'}
      className="absolute top-1/2 -translate-y-1/2 z-10 hidden md:flex items-center justify-center cursor-pointer hover:opacity-80"
      style={{
        [dir]: -6, width: 34, height: 34, borderRadius: '50%',
        background: 'rgba(0,0,0,0.7)', border: `1px solid ${PALETTE.border}`,
        color: PALETTE.dark, fontSize: 16, lineHeight: 1,
      }}>
      {dir === 'left' ? '‹' : '›'}
    </button>
  )
}

function CardSkeleton() {
  return (
    <div className="motion-skeleton shrink-0" aria-hidden
      style={{ border: `1px solid ${PALETTE.border}`, borderRadius: 14, minWidth: 150, aspectRatio: '3/4' }} />
  )
}

function WallCard({ post }: { post: SocialPost }) {
  const [imgLoaded, setImgLoaded] = useState(false)
  return (
    <a href={post.permalink} target="_blank" rel="noopener noreferrer"
      style={{ border: `1px solid ${PALETTE.border}`, borderRadius: 14, minWidth: 150, aspectRatio: '3/4', background: '#0A0A0A' }}
      className="motion-social-card relative overflow-hidden cursor-pointer shrink-0 no-underline">
      {!imgLoaded && <div className="motion-skeleton" aria-hidden style={{ position: 'absolute', inset: 0 }} />}
      <img src={post.thumbnail_url} alt={post.caption || 'Instagram post'} loading="lazy"
        ref={el => { if (el?.complete && el.naturalWidth > 0) setImgLoaded(true) }}
        onLoad={() => setImgLoaded(true)}
        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
        style={{ opacity: imgLoaded ? 1 : 0 }} />
      {post.media_type === 'VIDEO' && <ReelBadge />}
      <CardOverlay caption={post.caption} likes={post.like_count} />
    </a>
  )
}

export function SocialWall() {
  const { isAtLeast } = usePermissions()
  const [posts, setPosts] = useState<SocialPost[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const scrollerRef = useRef<HTMLDivElement>(null)
  const [canLeft, setCanLeft] = useState(false)
  const [canRight, setCanRight] = useState(false)

  const updateArrows = useCallback(() => {
    const el = scrollerRef.current
    if (!el) return
    setCanLeft(el.scrollLeft > 4)
    setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4)
  }, [])

  // Re-check when content changes (posts load) or the window resizes
  useEffect(() => {
    updateArrows()
    window.addEventListener('resize', updateArrows)
    return () => window.removeEventListener('resize', updateArrows)
  }, [updateArrows, posts, loading])

  function scrollByDir(dir: 'left' | 'right') {
    const el = scrollerRef.current
    if (!el) return
    el.scrollBy({ left: (dir === 'left' ? -1 : 1) * el.clientWidth * 0.8, behavior: 'smooth' })
  }

  // Served from Supabase only — Instagram is never hit on page load
  useEffect(() => {
    let alive = true
    fetchSocialPosts()
      .then(rows => { if (alive) setPosts(rows) })
      .catch(() => {})
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [])

  // Live updates: when an exec refetches a reel, every open client sees it
  useRealtimeTable('social_posts', () => {
    fetchSocialPosts().then(setPosts).catch(() => {})
  })

  async function handleRefetch(count: number) {
    setRefreshing(count)
    setError(null)
    try {
      await refreshSocialPosts(count)
      setPosts(await fetchSocialPosts())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Refetch failed')
    } finally {
      setRefreshing(null)
    }
  }

  return (
    <>
      <div className="flex items-center gap-3 -mt-3 mb-4">
        <div style={{ color: PALETTE.muted }} className="text-xs">Latest from @{IG_USERNAME}</div>
        {/* TEMPORARY: exec/president-only manual refetch — pulls IG posts into Supabase */}
        {isAtLeast('executive') && (
          <>
            <button onClick={() => handleRefetch(1)} disabled={refreshing !== null}
              style={{ color: ACCENT, border: `1px solid ${PALETTE.border}`, background: 'transparent', borderRadius: 8 }}
              className="text-[10px] font-semibold px-2 py-1 cursor-pointer hover:opacity-80 disabled:opacity-50">
              {refreshing === 1 ? 'Fetching…' : '↻ Latest post'}
            </button>
            <button onClick={() => handleRefetch(WALL_SIZE)} disabled={refreshing !== null}
              style={{ color: ACCENT, border: `1px solid ${PALETTE.border}`, background: 'transparent', borderRadius: 8 }}
              className="text-[10px] font-semibold px-2 py-1 cursor-pointer hover:opacity-80 disabled:opacity-50">
              {refreshing === WALL_SIZE ? 'Fetching…' : `↻ Last ${WALL_SIZE} posts`}
            </button>
          </>
        )}
      </div>
      {error && <p className="text-xs -mt-2 mb-3" style={{ color: '#EF4444' }}>{error}</p>}

      {/* pt/px + negative margins give hover-scaled cards headroom inside the scrollport */}
      <div className="relative">
      {canLeft && <ScrollArrow dir="left" onClick={() => scrollByDir('left')} />}
      {canRight && <ScrollArrow dir="right" onClick={() => scrollByDir('right')} />}
      <div ref={scrollerRef} onScroll={updateArrows}
        className="allow-pan-x flex gap-3 overflow-x-auto scrollbar-none pt-2 -mt-2 pb-2 -mb-1 px-2 -mx-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {loading
          ? Array.from({ length: 6 }, (_, i) => <CardSkeleton key={i} />)
          : posts.length > 0
          ? posts.map(p => <WallCard key={p.id} post={p} />)
          : PLACEHOLDERS.map((p, i) => (
            <div key={p.id}
              style={{ background: GRADS[i], border: `1px solid ${PALETTE.border}`, borderRadius: 14, minWidth: 150, aspectRatio: '3/4' }}
              className="motion-social-card relative overflow-hidden cursor-pointer shrink-0">
              {p.type === 'reel' && <ReelBadge />}
              <CardOverlay caption={p.caption} likes={p.likes} />
            </div>
          ))}
      </div>
      </div>
    </>
  )
}
