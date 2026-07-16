import type { EventButton } from '@/events/types/Event'

/** Buttons with a label — URL is optional. */
export function getEventButtons(buttons: EventButton[] | undefined): EventButton[] {
  return (buttons ?? []).filter(b => b.label?.trim())
}

/** First CTA is secondary; second is primary (green). Single button stays primary. */
export function getCtaVariant(index: number, total: number): 'primary' | 'secondary' {
  if (total <= 1) return 'primary'
  return index === 1 ? 'primary' : 'secondary'
}
