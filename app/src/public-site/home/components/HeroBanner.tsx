import type { DbEvent } from '@/events/types/Event'
import { useCountdown }    from '@/shared/hooks/useCountdown'
import { REGISTER_TEAM_URL, TICKETS_URL } from '@/config/externalLinks'
import { ACCENT, PALETTE } from '@/config/theme'

interface Props { banner: DbEvent | null; loading: boolean }

/** Full-bleed hero section with event name, live countdown, and CTA buttons. */
export function HeroBanner({ banner, loading }: Props) {
  if (!banner) return null

  const cd = useCountdown(banner.time)

  return (
    <div className="px-4 pt-4 lg:p-0">
      <div className="overflow-hidden relative flex flex-col md:flex-row md:min-h-[260px] rounded-2xl border border-[#E5E7EB] shadow-[0_2px_8px_rgba(0,0,0,0.07),0_1px_2px_rgba(0,0,0,0.04)] lg:rounded-[20px]">
        <img src="/banner.png" alt="" className="absolute inset-0 w-full h-full object-cover object-center" />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.7) 22%, rgba(255,255,255,0.1) 42%, transparent 55%)' }} />

        <div className="relative z-10 flex flex-col p-4 sm:p-8 flex-1 gap-3 md:gap-0">
          <h1 style={{ color: PALETTE.dark, fontFamily: '"Satoshi", sans-serif', fontWeight: 900 }} className="text-3xl sm:text-[42px] tracking-tight m-0 leading-none">
            Next <span style={{ color: ACCENT }}>Event</span>
          </h1>
          <div className="hidden md:block flex-1" />
          {loading && <div style={{ border: `1px solid ${PALETTE.border}` }} className="rounded-xl h-24 animate-pulse bg-gray-100/80" />}
          {!loading && banner && (
            <div className="w-fit">
              <div style={{ color: PALETTE.dark }} className="text-[17px] font-extrabold mb-2 md:mb-3">{banner.name}</div>
              <div className="flex gap-2 w-fit">
                {(['days','hrs','mins','secs'] as const).map((k, i) => {
                  const val = [cd.days, cd.hrs, cd.mins, cd.secs][i]
                  return (
                    <div key={k} style={{ background: '#fff', border: `1px solid ${PALETTE.border}`, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }} className="rounded-xl px-2.5 py-2 text-center min-w-[48px] sm:min-w-[54px] shrink-0">
                      <div style={{ color: ACCENT, fontSize: 22, lineHeight: 1 }} className="font-extrabold tabular-nums sm:text-[24px]">{String(val).padStart(2,'0')}</div>
                      <div style={{ color: PALETTE.muted, fontSize: 9 }} className="uppercase tracking-widest mt-1 font-bold">{k}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
          {!loading && banner && (
            <div className="md:hidden flex gap-2 mt-1 w-full">
              <a href={REGISTER_TEAM_URL} target="_blank" rel="noopener noreferrer" style={{ border: `1.5px solid ${ACCENT}`, color: ACCENT, background: '#fff' }} className="flex-1 flex items-center justify-center rounded-xl px-2 py-3 text-xs font-bold no-underline active:scale-[0.98] transition-transform min-w-0 shadow-sm">Register Your Team</a>
              <a href={TICKETS_URL}       target="_blank" rel="noopener noreferrer" style={{ background: '#C8FF00', color: '#111827' }} className="flex-1 flex items-center justify-center rounded-xl px-2 py-3 font-bold text-xs no-underline hover:opacity-85 active:scale-[0.98] transition-transform min-w-0 shadow-sm">Get Tickets →</a>
            </div>
          )}
        </div>

        <div className="hidden md:flex relative z-10 w-[42%] shrink-0 flex-col justify-end items-end p-6">
          {!loading && banner && (
            <div className="flex gap-2">
              <a href={REGISTER_TEAM_URL} target="_blank" rel="noopener noreferrer" style={{ border: `1.5px solid ${ACCENT}`, color: ACCENT, background: '#fff' }} className="rounded-xl px-5 py-2.5 font-bold text-sm no-underline hover:opacity-85 whitespace-nowrap shadow-sm">Register Your Team</a>
              <a href={TICKETS_URL}       target="_blank" rel="noopener noreferrer" style={{ background: '#C8FF00', color: '#111827' }} className="rounded-xl px-5 py-2.5 font-bold text-sm no-underline hover:opacity-85 whitespace-nowrap">Get Your Tickets &rarr;</a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
