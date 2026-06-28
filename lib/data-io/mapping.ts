import type { ColumnMapping, ResourceDefinition } from "./types"

/** Collapses a label/header to a comparable token: lowercase, alphanumeric only. */
function normalizeToken(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "")
}

/**
 * Attempts to automatically map incoming spreadsheet headers to resource
 * fields. For each field it considers the field label, the field key, and any
 * declared aliases, matching them against headers on a normalized token basis
 * (so "E-Mail Address" matches an `email` field with alias "email address").
 *
 * Each header is consumed at most once, and unmatched fields map to `null` so
 * the UI can prompt the user to resolve them.
 */
export function autoMapColumns<T>(
  headers: string[],
  resource: ResourceDefinition<T>,
): ColumnMapping {
  const mapping: ColumnMapping = {}
  const used = new Set<string>()
  const normalizedHeaders = headers.map((header) => ({
    original: header,
    token: normalizeToken(header),
  }))

  for (const field of resource.fields) {
    const candidates = new Set(
      [field.label, String(field.key), ...(field.aliases ?? [])].map(
        normalizeToken,
      ),
    )

    const match = normalizedHeaders.find(
      (header) => !used.has(header.original) && candidates.has(header.token),
    )

    if (match) used.add(match.original)
    mapping[String(field.key)] = match?.original ?? null
  }

  return mapping
}

/** Returns the keys of required fields that have no mapped source column. */
export function getUnmappedRequired<T>(
  resource: ResourceDefinition<T>,
  mapping: ColumnMapping,
): string[] {
  return resource.fields
    .filter((field) => field.required && !mapping[String(field.key)])
    .map((field) => String(field.key))
}

/** True when every required field is mapped to a source column. */
export function isMappingComplete<T>(
  resource: ResourceDefinition<T>,
  mapping: ColumnMapping,
): boolean {
  return getUnmappedRequired(resource, mapping).length === 0
}
