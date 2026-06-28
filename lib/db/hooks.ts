"use client"

import { useLiveQuery } from "dexie-react-hooks"
import type { Repository } from "./repository"
import type { BaseEntity } from "./types"

/**
 * Live, reactive read of every row in a repository. The component re-renders
 * automatically whenever the underlying IndexedDB table changes — including
 * mutations from other tabs.
 *
 * Returns `undefined` while the first query is in flight, which callers can use
 * to render a loading state.
 */
export function useLiveAll<T extends BaseEntity>(
  repository: Repository<T>,
): T[] | undefined {
  return useLiveQuery(() => repository.getAll(), [repository])
}

/** Live row count for a repository. */
export function useLiveCount<T extends BaseEntity>(
  repository: Repository<T>,
): number | undefined {
  return useLiveQuery(() => repository.count(), [repository])
}

/** Live read of a single entity by id. */
export function useLiveOne<T extends BaseEntity>(
  repository: Repository<T>,
  id: string | null | undefined,
): T | undefined {
  return useLiveQuery(
    () => (id ? repository.get(id) : undefined),
    [repository, id],
  )
}
