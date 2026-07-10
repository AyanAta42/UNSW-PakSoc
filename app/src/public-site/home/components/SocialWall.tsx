import { PALETTE } from '@/config/theme'

const IG = [
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

/** Horizontal scroll wall of Instagram-style post cards. */
export function SocialWall() {
  return (
    <>
      <div style={{ color: PALETTE.muted }} className="text-xs -mt-3 mb-4">Latest from @unswpaksoc</div>
      <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {IG.map((p, i) => (
          <div key={p.id}
            style={{ background: GRADS[i], border: `1px solid ${PALETTE.border}`, minWidth: 140, aspectRatio: '4/5' }}
            className="rounded-xl relative overflow-hidden cursor-pointer hover:opacity-90 transition-opacity shrink-0">
            {p.type === 'reel' && <span className="absolute top-2 right-2 bg-black/60 text-white font-bold px-1.5 py-0.5 rounded" style={{ fontSize: 9 }}>REEL</span>}
            <div className="absolute bottom-0 left-0 right-0 px-2.5 pb-2 pt-5" style={{ background: 'linear-gradient(to top,rgba(0,0,0,0.75),transparent)' }}>
              <p className="text-white m-0 leading-snug" style={{ fontSize: 10 }}>{p.caption}</p>
              <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 9 }}>{p.likes} likes</span>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
