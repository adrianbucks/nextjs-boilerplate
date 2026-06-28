import type { BaseEntity } from "@/lib/db/types"
import { defineField, defineResource } from "@/lib/data-io/resource"
import {
  parseLowerString,
  parseNumber,
  parseString,
} from "@/lib/data-io/transformers"
import { email, maxLength, oneOf, required } from "@/lib/data-io/validators"

/** Lifecycle stages a contact can be in. */
export const CONTACT_STATUSES = ["lead", "active", "churned"] as const
export type ContactStatus = (typeof CONTACT_STATUSES)[number]

/**
 * The demo entity. It extends {@link BaseEntity} so it slots straight into the
 * generic repository, and its persisted in IndexedDB via `lib/db/client.ts`.
 */
export interface Contact extends BaseEntity {
  name: string
  email: string
  company?: string
  phone?: string
  status: ContactStatus
  score?: number
}

/**
 * Declarative description of the Contact entity for the import/export engine.
 *
 * This single object drives column auto-mapping, validation, template
 * generation, and export formatting. To adapt the boilerplate to a different
 * domain, copy this file, swap the fields, and point a repository at a matching
 * Dexie table — no engine changes required.
 */
export const contactResource = defineResource<Contact>({
  name: "contacts",
  label: "Contacts",
  fields: [
    defineField<Contact, "name">({
      key: "name",
      label: "Name",
      aliases: ["full name", "contact name"],
      required: true,
      example: "Ada Lovelace",
      parse: (raw) => parseString(raw) ?? "",
      validators: [required("Name is required"), maxLength(120)],
    }),
    defineField<Contact, "email">({
      key: "email",
      label: "Email",
      aliases: ["e-mail", "email address", "mail"],
      required: true,
      example: "ada@example.com",
      parse: (raw) => parseLowerString(raw) ?? "",
      validators: [required("Email is required"), email()],
    }),
    defineField<Contact, "company">({
      key: "company",
      label: "Company",
      aliases: ["organization", "org", "business"],
      example: "Analytical Engines Ltd.",
      parse: (raw) => parseString(raw),
      validators: [maxLength(160)],
    }),
    defineField<Contact, "phone">({
      key: "phone",
      label: "Phone",
      aliases: ["phone number", "telephone", "mobile"],
      example: "+1 555 0100",
      parse: (raw) => parseString(raw),
    }),
    defineField<Contact, "status">({
      key: "status",
      label: "Status",
      aliases: ["stage", "lifecycle"],
      required: true,
      example: "lead",
      parse: (raw) =>
        (parseLowerString(raw) ?? "lead") as ContactStatus,
      validators: [oneOf(CONTACT_STATUSES)],
    }),
    defineField<Contact, "score">({
      key: "score",
      label: "Score",
      aliases: ["lead score", "rating"],
      example: "82",
      parse: (raw) => parseNumber(raw),
      validators: [
        (value) =>
          value !== undefined && (value < 0 || value > 100)
            ? "Score must be between 0 and 100"
            : null,
      ],
    }),
  ],
})
