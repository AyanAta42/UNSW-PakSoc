import type { DbEvent } from '@/events/types/Event'
import { useCountdown }  from '@/shared/hooks/useCountdown'
import { getEventButtons } from '@/events/utils/getEventButtons'
import { EventCtaButton }  from '@/events/components/EventCtaButton'
import { ACCENT, PALETTE } from '@/config/theme'

interface Props { banner: DbEvent | null; loading: boolean }

export function HeroBanner({ banner, loading }: Props) {
  if (!banner) return null

  const cd   = useCountdown(banner.time)
  const btns = getEventButtons(banner.buttons)

  return (
    <div className="px-4 pt-4 lg:p-0">
      <div className="overflow-hidden relative flex flex-col min-h-[228px] md:flex-row md:min-h-[260px] rounded-2xl border border-[#E5E7EB] shadow-[0_2px_8px_rgba(0,0,0,0.07),0_1px_2px_rgba(0,0,0,0.04)] lg:rounded-[20px]">
        <img src="/banner.png" alt="" className="absolute inset-0 w-full h-full object-cover object-center" />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.7) 22%, rgba(255,255,255,0.1) 42%, transparent 55%)' }} />

        <div className="relative z-10 flex flex-col p-4 md:p-8 flex-1 min-h-[228px] md:min-h-0">
          <h1 style={{ color: PALETTE.dark, fontFamily: '"Satoshi", sans-serif', fontWeight: 900 }} className="text-2xl md:text-[42px] tracking-tight m-0 leading-none shrink-0">
            Next <span style={{ color: ACCENT }}>Event</span>
          </h1>
          <div className="flex-1 min-h-8 md:min-h-0" />
          {loading && <div style={{ border: `1px solid ${PALETTE.border}` }} className="rounded-xl h-[72px] md:h-24 animate-pulse bg-gray-100/80 shrink-0" />}
          {!loading && banner && (
            <div className="w-full md:w-fit shrink-0">
              <div style={{ color: PALETTE.dark }} className="text-[15px] md:text-[17px] font-extrabold mb-2 md:mb-3 truncate">{banner.name}</div>
              <div className="flex gap-2 w-fit">
                {(['days','hrs','mins','secs'] as const).map((k, i) => {
                  const val = [cd.days, cd.hrs, cd.mins, cd.secs][i]
                  return (
                    <div key={k} style={{ background: '#fff', border: `1px solid ${PALETTE.border}`, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }} className="rounded-lg md:rounded-xl px-2 py-1.5 md:px-2.5 md:py-2 text-center min-w-[46px] md:min-w-[54px] shrink-0">
                      <div style={{ color: ACCENT, fontSize: 20, lineHeight: 1 }} className="font-extrabold tabular-nums md:text-[24px]">{String(val).padStart(2,'0')}</div>
                      <div style={{ color: PALETTE.muted, fontSize: 8 }} className="uppercase tracking-widest mt-0.5 md:mt-1 font-bold md:text-[9px]">{k}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
          {!loading && btns.length > 0 && (
            <div className="md:hidden flex gap-2 mt-2 w-full shrink-0">
              {btns.map((b, i) => (
                <EventCtaButton key={i} label={b.label} url={b.url} variant={i === 0 ? 'outline' : 'filled'}
                  className="flex-1 px-2 py-2.5 text-xs min-w-0 shadow-sm" />
              ))}
            </div>
          )}
        </div>

        <div className="hidden md:flex relative z-10 w-[42%] shrink-0 flex-col justify-end items-end p-6">
          {!loading && btns.length > 0 && (
            <div className="flex gap-2">
              {btns.map((b, i) => (
                <EventCtaButton key={i} label={b.label} url={b.url} variant={i === 0 ? 'outline' : 'filled'}
                  className="px-5 py-2.5 text-sm whitespace-nowrap shadow-sm" />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
