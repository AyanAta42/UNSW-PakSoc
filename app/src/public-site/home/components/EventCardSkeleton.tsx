import { PALETTE } from '@/config/theme'

/** Instant event-card chrome — same shape as PublicEventCard, visible before data. */
export function EventCardSkeleton() {
  return (
    <div
      style={{
        background: PALETTE.card,
        border: `1px solid ${PALETTE.border}`,
        borderRadius: 18,
        boxShadow: PALETTE.shadowSm,
      }}
      className="overflow-hidden flex flex-col min-w-0 w-full"
      aria-hidden
    >
      <div className="relative overflow-hidden motion-skeleton" style={{ height: 120 }} />
      <div className="px-4 pt-3 pb-4 flex flex-col gap-2">
        <div className="motion-skeleton h-4 w-[72%] rounded" />
        <div className="motion-skeleton h-3 w-[48%] rounded" />
        <div className="motion-skeleton h-3 w-[60%] rounded" />
      </div>
    </div>
  )
}
