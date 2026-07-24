import { useCallback, useEffect, useRef, useState } from 'react'
import { ACCENT, PALETTE } from '@/config/theme'
import { usePermissions } from '@/roles/hooks/usePermissions'
import { useRefreshOnVisible } from '@/core/supabase/useRefreshOnVisible'
import { fetchSocialPosts, syncSocialPosts, getCachedSocialPosts, IG_USERNAME, type SocialPost } from '../services/socialPosts'
import { isImageReady, markImageReady, warmImages } from '@/shared/utils/imageCache'
import { toast, errorMessage } from '@/shared/toast/toast'
import { useScrollLock } from '@/shared/hooks/useScrollLock'

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

function CardOverlay({ caption }: { caption: string }) {
  return (
    <div className="absolute bottom-0 left-0 right-0 px-2.5 pb-2.5 pt-8"
      style={{ background: 'linear-gradient(to top,rgba(0,0,0,0.85),transparent)' }}>
      <p className="m-0 leading-snug overflow-hidden"
        style={{ fontSize: 10, color: PALETTE.dark, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
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
  // Seed from the session cache: if this thumbnail already loaded once, start it
  // fully visible so remounts (route changes) don't replay the fade from black.
  const [imgLoaded, setImgLoaded] = useState(() => isImageReady(post.thumbnail_url))
  const markLoaded = () => { markImageReady(post.thumbnail_url); setImgLoaded(true) }
  return (
    <a href={post.permalink} target="_blank" rel="noopener noreferrer"
      style={{ border: `1px solid ${PALETTE.border}`, borderRadius: 14, minWidth: 150, aspectRatio: '3/4', background: '#0A0A0A' }}
      className="motion-social-card relative overflow-hidden cursor-pointer shrink-0 no-underline">
      {!imgLoaded && <div className="motion-skeleton" aria-hidden style={{ position: 'absolute', inset: 0 }} />}
      <img src={post.thumbnail_url} alt={post.caption || 'Instagram post'} loading="lazy"
        ref={el => { if (el?.complete && el.naturalWidth > 0) markLoaded() }}
        onLoad={markLoaded}
        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
        style={{ opacity: imgLoaded ? 1 : 0 }} />
      {post.media_type === 'VIDEO' && <ReelBadge />}
      <CardOverlay caption={post.caption} />
    </a>
  )
}

export function SocialWall() {
  const { isAtLeast } = usePermissions()
  // Seed from the session cache so a return visit paints the wall on the first
  // frame instead of showing skeletons while it refetches.
  const [posts, setPosts] = useState<SocialPost[]>(() => getCachedSocialPosts() ?? [])
  const [loading, setLoading] = useState(() => !getCachedSocialPosts())
  const [refreshing, setRefreshing] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scrollerRef = useRef<HTMLDivElement>(null)

  useScrollLock(confirmOpen)
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

  // Warm every thumbnail whenever the list changes, so images stay decoded and
  // paint instantly on the next remount.
  useEffect(() => { warmImages(posts.map(p => p.thumbnail_url)) }, [posts])

  // Served from Supabase only — Instagram is never hit on page load. Skip the
  // fetch entirely when the session cache already has the wall.
  useEffect(() => {
    let alive = true
    fetchSocialPosts()
      .then(rows => { if (alive) setPosts(rows) })
      .catch(() => {})
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [])

  // No socket on this public surface — refresh on load and whenever the visitor
  // returns to the tab. Reels only change when an exec hits "Fetch latest".
  useRefreshOnVisible(() => {
    fetchSocialPosts().then(setPosts).catch(() => {})
  })

  async function handleFetchLatest() {
    setConfirmOpen(false)
    setRefreshing(true)
    setError(null)
    try {
      const { added } = await syncSocialPosts()
      setPosts(await fetchSocialPosts())
      toast.success(
        added === 0
          ? 'Already up to date'
          : added === 1
          ? '1 new reel added'
          : `${added} new reels added`,
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fetch failed')
      toast.error("Couldn't fetch reels", errorMessage(e, 'Please try again.'))
    } finally {
      setRefreshing(false)
    }
  }

  return (
    <>
      <div className="flex items-center justify-between flex-nowrap gap-3 -mt-3 mb-4">
        <div style={{ color: PALETTE.muted }} className="text-xs truncate min-w-0">Latest from @{IG_USERNAME}</div>
        {/* TEMPORARY: exec/president-only manual sync — pulls IG posts into Supabase */}
        {isAtLeast('executive') && (
          <button onClick={() => setConfirmOpen(true)} disabled={refreshing}
            style={{ color: ACCENT, border: `1px solid ${PALETTE.border}`, background: 'transparent', borderRadius: 8 }}
            className="shrink-0 whitespace-nowrap text-[10px] font-semibold px-2 py-1 cursor-pointer hover:opacity-80 disabled:opacity-50">
            {refreshing ? 'Fetching…' : '↻ Fetch latest'}
          </button>
        )}
      </div>

      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.6)' }} onClick={() => setConfirmOpen(false)}>
          <div onClick={e => e.stopPropagation()} role="dialog" aria-modal="true"
            style={{ background: PALETTE.modal, border: `1px solid ${PALETTE.border}`, borderRadius: 16, maxWidth: 360 }}
            className="w-full p-5">
            <h3 className="m-0 mb-2 text-base font-semibold" style={{ color: PALETTE.dark }}>Fetch latest posts</h3>
            <p className="m-0 mb-5 text-xs leading-relaxed" style={{ color: PALETTE.muted }}>
              Use this after a new reel has been posted on Instagram. It stores most recent posts into our database so it can be displayed to all users.
            </p>
            <div className="flex flex-row flex-nowrap justify-end gap-2">
              <button onClick={() => setConfirmOpen(false)}
                style={{ color: PALETTE.dark, border: `1px solid ${PALETTE.border}`, background: 'transparent', borderRadius: 8 }}
                className="shrink-0 whitespace-nowrap text-xs font-semibold px-3 py-1.5 cursor-pointer hover:opacity-80">
                Cancel
              </button>
              <button onClick={handleFetchLatest}
                style={{ color: PALETTE.dark, background: ACCENT, borderRadius: 8 }}
                className="shrink-0 whitespace-nowrap text-xs font-semibold px-3 py-1.5 cursor-pointer hover:opacity-90">
                Fetch latest
              </button>
            </div>
          </div>
        </div>
      )}
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
              <CardOverlay caption={p.caption} />
            </div>
          ))}
      </div>
      </div>
    </>
  )
}
