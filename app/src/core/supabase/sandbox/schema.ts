/**
 * The bits of the Postgres schema the sandbox has to know about to fake writes
 * convincingly: primary keys, the defaults Postgres would fill in, ON CONFLICT
 * targets for upserts, embeddable relations (for PostgREST `select=a(b,c)`) and
 * ON DELETE CASCADE children.
 *
 * Keep this in sync with supabase/migrations when tables change.
 */

export type Row = Record<string, unknown>

export interface Relation {
  /** Table the embedded rows come from. */
  table: string
  /** One-to-many: column on the *child* table pointing back at this row's pk. */
  fk?: string
  /** Many-to-one: column on *this* table pointing at the related row's pk. */
  via?: string
}

export interface TableMeta {
  pk: string
  /** Generate a uuid when the insert body omits the pk. */
  genPk: boolean
  /** Column sets that act as ON CONFLICT targets (also used to de-dupe reads). */
  unique: string[][]
  /** Column defaults Postgres would apply on INSERT. */
  defaults: () => Row
  /** Embeddable relations keyed by the name used inside `select=`. */
  relations: Record<string, Relation>
  /** `[childTable, fkColumn]` pairs removed by ON DELETE CASCADE. */
  cascades: [string, string][]
  /** Cache real rows of this table so local rows can resolve embeds to it. */
  remember: boolean
}

const now = () => new Date().toISOString()

function meta(partial: Partial<TableMeta>): TableMeta {
  return {
    pk: 'id',
    genPk: true,
    unique: [],
    defaults: () => ({}),
    relations: {},
    cascades: [],
    remember: false,
    ...partial,
  }
}

const TABLES: Record<string, TableMeta> = {
  members: meta({
    unique: [['user_id'], ['email']],
    defaults: () => ({ created_at: now(), committee: null, avatar_url: null, is_developer: false }),
    // Locally-created task assignments and interactions embed member rows, and
    // those live in the real database — keep the ones we've seen so the embed
    // can still be resolved for a row that only exists locally.
    remember: true,
  }),

  events: meta({
    defaults: () => ({ created_at: now(), public: false, tag: 'Social', emoji: '📅' }),
    cascades: [['tasks', 'event_id']],
  }),

  tasks: meta({
    defaults: () => ({ created_at: now(), notes: '', category: 'Task' }),
    relations: {
      subtasks: { table: 'subtasks', fk: 'task_id' },
      task_assignments: { table: 'task_assignments', fk: 'task_id' },
    },
    cascades: [['subtasks', 'task_id'], ['task_assignments', 'task_id']],
  }),

  subtasks: meta({
    defaults: () => ({ created_at: now(), done: false }),
  }),

  task_assignments: meta({
    unique: [['task_id', 'member_id']],
    defaults: () => ({ created_at: now() }),
    relations: { members: { table: 'members', via: 'member_id' } },
  }),

  interactions: meta({
    defaults: () => ({ created_at: now(), actor_name: 'Unknown' }),
    relations: { members: { table: 'members', via: 'actor_id' } },
  }),

  social_posts: meta({
    // id is the Instagram media id — always supplied by the caller.
    genPk: false,
    unique: [['id']],
    defaults: () => ({ fetched_at: now(), like_count: 0, caption: '' }),
  }),
}

const FALLBACK = meta({})

/** Metadata for a table; unknown tables get sane `id`-keyed defaults. */
export function getMeta(table: string): TableMeta {
  return TABLES[table] ?? FALLBACK
}

/** Primary key value of a row, as the string the overlay keys off. */
export function pkOf(table: string, row: Row): string {
  return String(row[getMeta(table).pk] ?? '')
}
