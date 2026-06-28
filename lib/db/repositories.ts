import type { Contact } from "@/lib/resources/contact"
import { db } from "./client"
import { Repository } from "./repository"

/**
 * Central registry of typed repositories.
 *
 * Components and hooks import these singletons rather than touching Dexie
 * tables directly, which keeps persistence concerns in one place and makes the
 * data access surface easy to mock or swap.
 */
export const contactsRepository = new Repository<Contact>(db.contacts)
