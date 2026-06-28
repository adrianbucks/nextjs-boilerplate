/**
 * Shared persistence primitives for the local-first data layer.
 *
 * Every record stored in IndexedDB extends {@link BaseEntity}, which guarantees
 * a stable string id and audit timestamps. Keeping these fields uniform lets the
 * generic {@link Repository} and the import/export engine treat any table the
 * same way, which is what makes this layer drop-in reusable across projects.
 */
export interface BaseEntity {
  /** Stable primary key (UUID v4). */
  id: string
  /** Creation time as epoch milliseconds. */
  createdAt: number
  /** Last mutation time as epoch milliseconds. */
  updatedAt: number
}

/** The shape callers provide when creating an entity (server-managed fields omitted). */
export type CreateInput<T extends BaseEntity> = Omit<T, keyof BaseEntity>

/** The shape callers provide when updating an entity (all domain fields optional). */
export type UpdateInput<T extends BaseEntity> = Partial<CreateInput<T>>
