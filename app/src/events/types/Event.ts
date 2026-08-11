export interface TimelineItem { time: string; title: string }

export interface EventButton { label: string; url: string }

export const DEFAULT_BUTTONS: EventButton[] = [
  { label: 'Register Your Team', url: '' },
  { label: 'Get Your Tickets',   url: '' },
]

export interface DbEvent {
  id:                string
  name:              string
  location:          string
  time:              string
  end_time?:         string
  public:            boolean
  image_url?:        string
  price?:            number
  /** Free-text line under the hero CTAs, e.g. "Final Release At $75". Any
   *  "$<amount>" inside it gets highlighted by the banner.
   *  Nullable (not just optional) so clearing the field writes a real NULL —
   *  an `undefined` would be dropped from the PATCH body and leave the old value. */
  banner_note?: string | null
  timeline?:         TimelineItem[]
  buttons?:          EventButton[]
  custom_categories?: string[]
}

export type NewEvent = Omit<DbEvent, 'id' | 'public'>
