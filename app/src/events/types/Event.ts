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
  timeline?:         TimelineItem[]
  buttons?:          EventButton[]
  custom_categories?: string[]
}

export type NewEvent = Omit<DbEvent, 'id' | 'public'>
