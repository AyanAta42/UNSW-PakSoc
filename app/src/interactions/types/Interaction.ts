export type InteractionAction =
  | 'event.created'
  | 'event.updated'
  | 'event.deleted'
  | 'event.published'
  | 'event.unpublished'
  | 'task.created'
  | 'task.updated'
  | 'task.deleted'
  | 'task.member_assigned'
  | 'task.member_unassigned'

export type InteractionEntity = 'event' | 'task'

export interface Interaction {
  id:          string
  actor_id:    string | null
  actor_name:  string
  action:      InteractionAction
  entity_type: InteractionEntity
  entity_id:   string | null
  event_id:    string | null
  summary:     string
  created_at:  string
}
