import type { DbEvent } from '@/events/types/Event'
import { useCountdown }    from '@/shared/hooks/useCountdown'
import { getEventButtons } from '@/events/utils/getEventButtons'
import { EventCtaButton }  from '@/events/components/EventCtaButton'
import { ACCENT, ACCENT_GLOW, PALETTE } from '@/config/theme'

interface Props { banner: DbEvent | null; loading: boolean }

export function HeroBanner({ banner, loading }: Props) {
  if (!banner) return null
  const cd   = useCountdown(banner.time)
  const btns = getEventButtons(banner.buttons)

  return (
    <div className="px-4 pt-4 lg:p-0">
      <div className="overflow-hidden relative flex flex-col min-h-[228px] md:flex-row md:min-h-[280px]"
        style={{ borderRadius: 18, border: `1px solid ${PALETTE.border}`, boxShadow: PALETTE.shadowLg }}>

        <img src="/banner.png" alt="" className="absolute inset-0 w-full h-full object-cover object-center" />

        {/* Base dark overlay */}
        <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.55)' }} />
        {/* Green gradient accent — bottom-left corner */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.18) 0%, rgba(0,0,0,0) 55%)' }} />
        {/* Left-side text legibility fade */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.55) 35%, transparent 65%)' }} />

        {/* Content */}
        <div className="relative z-10 flex flex-col p-5 md:p-9 flex-1 min-h-[228px] md:min-h-0">
          <h1 style={{ fontFamily: '"Satoshi", sans-serif', fontWeight: 900, color: '#F8FAFC' }}
            className="text-2xl md:text-[44px] tracking-tight m-0 leading-none shrink-0">
            Next <span style={{ color: ACCENT }}>Event</span>
          </h1>

          <div className="flex-1 min-h-8 md:min-h-0" />

          {loading && (
            <div className="rounded-xl h-[72px] md:h-24 animate-pulse shrink-0"
              style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${PALETTE.border}` }} />
          )}

          {!loading && banner && (
            <div className="w-full md:w-fit shrink-0">
              <div style={{ color: '#F8FAFC' }} className="text-[15px] md:text-lg font-extrabold mb-3 truncate">{banner.name}</div>
              <div className="flex gap-2 w-fit">
                {(['days','hrs','mins','secs'] as const).map((k, i) => {
                  const val = [cd.days, cd.hrs, cd.mins, cd.secs][i]
                  return (
                    <div key={k} className="text-center min-w-[48px] md:min-w-[58px] shrink-0 px-2 py-1.5 md:px-3 md:py-2"
                      style={{ background: 'rgba(10,10,10,0.9)', border: `1px solid ${PALETTE.border}`, borderRadius: 12 }}>
                      <div style={{ color: ACCENT_GLOW, fontSize: 20, lineHeight: 1 }} className="font-extrabold tabular-nums md:text-[26px]">{String(val).padStart(2,'0')}</div>
                      <div style={{ color: PALETTE.secondary, fontSize: 8 }} className="uppercase tracking-widest mt-1 font-bold md:text-[9px]">{k}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Mobile CTAs */}
          {!loading && btns.length > 0 && (
            <div className="md:hidden flex gap-2 mt-3 w-full shrink-0">
              {btns.map((b, i) => (
                <EventCtaButton key={i} label={b.label} url={b.url} variant={i === 0 ? 'primary' : 'secondary'}
                  className="flex-1 px-2 py-2.5 text-xs min-w-0" />
              ))}
            </div>
          )}
        </div>

        {/* Desktop CTAs — bottom-right */}
        <div className="hidden md:flex relative z-10 w-[42%] shrink-0 flex-col justify-end items-end p-8">
          {!loading && btns.length > 0 && (
            <div className="flex gap-3">
              {btns.map((b, i) => (
                <EventCtaButton key={i} label={b.label} url={b.url} variant={i === 0 ? 'primary' : 'secondary'}
                  className="px-5 py-2.5 text-sm whitespace-nowrap" />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
