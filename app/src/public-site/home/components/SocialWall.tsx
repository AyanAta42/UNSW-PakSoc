import { useEffect, useState } from 'react'
import { ACCENT, PALETTE } from '@/config/theme'
import { usePermissions } from '@/roles/hooks/usePermissions'
import { useRealtimeTable } from '@/core/supabase/useRealtimeTable'
import { fetchSocialPosts, refreshLatestSocialPost, IG_USERNAME, type SocialPost } from '../services/socialPosts'

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
  return (
    <div className="absolute bottom-0 left-0 right-0 px-2.5 pb-2.5 pt-6"
      style={{ background: 'linear-gradient(to top,rgba(0,0,0,0.85),transparent)' }}>
      <p className="m-0 leading-snug" style={{ fontSize: 10, color: PALETTE.dark }}>{caption}</p>
      <span style={{ color: PALETTE.muted, fontSize: 9 }}>{likes} likes</span>
    </div>
  )
}

function ReelBadge() {
  return (
    <span className="absolute top-2 right-2 font-bold px-1.5 py-0.5 rounded text-white"
      style={{ fontSize: 9, background: 'rgba(0,0,0,0.65)' }}>REEL</span>
  )
}

export function SocialWall() {
  const { isAtLeast } = usePermissions()
  const [posts, setPosts] = useState<SocialPost[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Served from Supabase only — Instagram is never hit on page load
  useEffect(() => {
    let alive = true
    fetchSocialPosts()
      .then(rows => { if (alive) setPosts(rows) })
      .catch(() => {})
    return () => { alive = false }
  }, [])

  // Live updates: when an exec refetches a reel, every open client sees it
  useRealtimeTable('social_posts', () => {
    fetchSocialPosts().then(setPosts).catch(() => {})
  })

  async function handleRefetch() {
    setRefreshing(true)
    setError(null)
    try {
      await refreshLatestSocialPost()
      setPosts(await fetchSocialPosts())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Refetch failed')
    } finally {
      setRefreshing(false)
    }
  }

  return (
    <>
      <div className="flex items-center gap-3 -mt-3 mb-4">
        <div style={{ color: PALETTE.muted }} className="text-xs">Latest from @{IG_USERNAME}</div>
        {/* TEMPORARY: exec/president-only manual refetch — pulls latest IG post into Supabase */}
        {isAtLeast('executive') && (
          <button onClick={handleRefetch} disabled={refreshing}
            style={{ color: ACCENT, border: `1px solid ${PALETTE.border}`, background: 'transparent', borderRadius: 8 }}
            className="text-[10px] font-semibold px-2 py-1 cursor-pointer hover:opacity-80 disabled:opacity-50">
            {refreshing ? 'Fetching…' : '↻ Refetch latest post'}
          </button>
        )}
      </div>
      {error && <p className="text-xs -mt-2 mb-3" style={{ color: '#EF4444' }}>{error}</p>}

      <div className="allow-pan-x flex gap-3 overflow-x-auto pb-1 scrollbar-none" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {posts.length > 0
          ? posts.map(p => (
            <a key={p.id} href={p.permalink} target="_blank" rel="noopener noreferrer"
              style={{ border: `1px solid ${PALETTE.border}`, borderRadius: 14, minWidth: 140, aspectRatio: '4/5', background: '#0A0A0A' }}
              className="motion-social-card relative overflow-hidden cursor-pointer shrink-0 no-underline">
              <img src={p.thumbnail_url} alt={p.caption || 'Instagram post'} loading="lazy"
                className="absolute inset-0 w-full h-full object-cover" />
              {p.media_type === 'VIDEO' && <ReelBadge />}
              <CardOverlay caption={p.caption} likes={p.like_count} />
            </a>
          ))
          : PLACEHOLDERS.map((p, i) => (
            <div key={p.id}
              style={{ background: GRADS[i], border: `1px solid ${PALETTE.border}`, borderRadius: 14, minWidth: 140, aspectRatio: '4/5' }}
              className="motion-social-card relative overflow-hidden cursor-pointer shrink-0">
              {p.type === 'reel' && <ReelBadge />}
              <CardOverlay caption={p.caption} likes={p.likes} />
            </div>
          ))}
      </div>
    </>
  )
}
