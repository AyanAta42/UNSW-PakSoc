import type { EventButton } from '@/events/types/Event'

/** Buttons with a label — URL is optional. */
export function getEventButtons(buttons: EventButton[] | undefined): EventButton[] {
  return (buttons ?? []).filter(b => b.label?.trim())
}
