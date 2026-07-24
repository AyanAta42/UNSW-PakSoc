import { ACCENT, ACCENT_GLOW, PALETTE } from '@/config/theme'

/**
 * Compact, always-visible statement of what the app is. Kept deliberately small
 * (one short paragraph, not a full section) but present in the *rendered* DOM so
 * that a homepage reviewer — including Google's OAuth verification, which may
 * render JavaScript and therefore never sees the static #root fallback in
 * index.html — can read the app's purpose. See [[google-oauth-homepage-autoverify]].
 */
export function PurposeStrip() {
  return (
    <section
      aria-label="About PakSoc UNSW"
      className="mx-3 md:mx-4 lg:mx-0 p-4 md:p-5 rounded-[18px] border"
      style={{ background: PALETTE.card, borderColor: PALETTE.border, boxShadow: PALETTE.shadowSm }}
    >
      <div className="flex items-center gap-2.5 mb-2">
        <span aria-hidden className="h-px w-6" style={{ background: `linear-gradient(90deg, ${ACCENT}, transparent)` }} />
        <span
          style={{ fontFamily: '"Satoshi", sans-serif', color: ACCENT_GLOW, letterSpacing: '0.28em' }}
          className="uppercase text-[10px] font-bold"
        >
          About
        </span>
      </div>
      <p style={{ color: PALETTE.secondary }} className="m-0 text-sm md:text-[15px] leading-relaxed">
        <strong style={{ color: PALETTE.dark, fontWeight: 700 }}>PakSoc UNSW</strong> is the official app of the
        Pakistani Society at the University of New South Wales. Discover upcoming society events and where they're
        happening, follow us across Instagram, TikTok and Facebook, and sign in with Google to personalise your
        membership — committee members can also manage events, roles and tasks.
      </p>
    </section>
  )
}
