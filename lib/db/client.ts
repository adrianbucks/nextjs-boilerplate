import Dexie, { type Table } from "dexie"
import type { Contact } from "@/lib/resources/contact"

/**
 * The application's IndexedDB database.
 *
 * Add new tables by:
 *   1. declaring a typed `Table` field below,
 *   2. registering its indexes in a `this.version(n).stores({...})` block,
 *   3. exposing a {@link Repository} for it (see `lib/db/repositories.ts`).
 *
 * Dexie handles schema migrations automatically as long as each new schema is
 * registered under an incrementing version number — never mutate an existing
 * `stores()` call once it has shipped; add a new `version()` block instead.
 */
export class AppDatabase extends Dexie {
  contacts!: Table<Contact, string>

  constructor() {
    super("databridge")

    // Version 1 — initial schema.
    // The first token is the primary key; the rest are secondary indexes used
    // for sorting and filtering. Only index fields you actually query on.
    this.version(1).stores({
      contacts: "id, name, email, company, status, createdAt, updatedAt",
    })
  }
}

/**
 * Singleton database instance.
 *
 * Guarded against hot-module-reload in development so we don't open multiple
 * connections to the same IndexedDB database.
 */
const globalForDb = globalThis as unknown as { __appDb?: AppDatabase }

export const db: AppDatabase = globalForDb.__appDb ?? new AppDatabase()

if (process.env.NODE_ENV !== "production") {
  globalForDb.__appDb = db
}
