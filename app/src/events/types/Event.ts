export interface TimelineItem {
  time: string
  title: string
}

export interface DbEvent {
  id: string
  name: string
  location: string
  time: string
  public: boolean
  image_url?: string
  price?: number
  timeline?: TimelineItem[]
}

export type NewEvent = Omit<DbEvent, 'id' | 'public'>
