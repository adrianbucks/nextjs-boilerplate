import type { Table } from "dexie"
import type { BaseEntity, CreateInput, UpdateInput } from "./types"

/** Generates a unique id, preferring the platform UUID when available. */
function createId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }
  return `id_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
}

/**
 * A thin, fully-typed CRUD wrapper over a Dexie table.
 *
 * The repository is intentionally generic and storage-shape agnostic: it only
 * relies on the {@link BaseEntity} contract. This means a single, well-tested
 * implementation backs every table in the app, and the same class can be lifted
 * into another project unchanged. Domain-specific queries belong in a subclass
 * or in a sibling module that composes this repository — keep this generic.
 */
export class Repository<T extends BaseEntity> {
  constructor(protected readonly table: Table<T, string>) {}

  /** Returns every row, newest first. */
  getAll(): Promise<T[]> {
    return this.table.orderBy("createdAt").reverse().toArray()
  }

  /** Returns a single row by id, or `undefined` if missing. */
  get(id: string): Promise<T | undefined> {
    return this.table.get(id)
  }

  /** Total row count. */
  count(): Promise<number> {
    return this.table.count()
  }

  /** Inserts a new row, stamping id and audit timestamps. */
  async create(input: CreateInput<T>): Promise<T> {
    const now = Date.now()
    const entity = {
      ...(input as object),
      id: createId(),
      createdAt: now,
      updatedAt: now,
    } as T
    await this.table.add(entity)
    return entity
  }

  /**
   * Inserts many rows in a single transaction. Ideal for import flows where
   * hundreds or thousands of rows are committed at once.
   */
  async bulkCreate(inputs: CreateInput<T>[]): Promise<T[]> {
    const now = Date.now()
    const entities = inputs.map(
      (input) =>
        ({
          ...(input as object),
          id: createId(),
          createdAt: now,
          updatedAt: now,
        }) as T,
    )
    await this.table.bulkAdd(entities)
    return entities
  }

  /** Applies a partial patch to a row and returns the updated entity. */
  async update(id: string, patch: UpdateInput<T>): Promise<T | undefined> {
    await this.table.update(id, {
      ...(patch as object),
      updatedAt: Date.now(),
      // Dexie's `UpdateSpec` is structurally stricter than our generic patch;
      // the runtime shape is correct, so we assert through `any` at this single
      // boundary to keep the public `update` signature clean and type-safe.
    } as any)
    return this.get(id)
  }

  /** Removes a single row. */
  delete(id: string): Promise<void> {
    return this.table.delete(id)
  }

  /** Removes many rows in one transaction. */
  bulkDelete(ids: string[]): Promise<void> {
    return this.table.bulkDelete(ids)
  }

  /** Empties the entire table. */
  clear(): Promise<void> {
    return this.table.clear()
  }

  /** Direct access to the underlying Dexie table for advanced queries. */
  get query(): Table<T, string> {
    return this.table
  }
}
