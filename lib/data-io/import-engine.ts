import { getUnmappedRequired } from "./mapping"
import type {
  CellValue,
  ColumnMapping,
  FieldContext,
  ImportResult,
  ImportedRow,
  ParsedSheet,
  RejectedRow,
  ResourceDefinition,
  RowIssue,
} from "./types"

const isEmpty = (value: unknown): boolean =>
  value === null ||
  value === undefined ||
  (typeof value === "string" && value.trim() === "")

/** Default cell coercion when a field declares no custom `parse`. */
function defaultParse(raw: CellValue): CellValue {
  if (typeof raw === "string") {
    const trimmed = raw.trim()
    return trimmed === "" ? undefined : trimmed
  }
  return raw ?? undefined
}

function zodMessage(error: unknown): string {
  const issues = (error as { issues?: { message?: string }[] })?.issues
  return issues?.[0]?.message ?? "Invalid value"
}

/**
 * The heart of the import pipeline. Given a parsed sheet, a resource
 * definition, and a column mapping, it produces a fully partitioned
 * {@link ImportResult}: typed valid rows plus rejected rows annotated with
 * every issue found.
 *
 * For each cell the pipeline runs, in order:
 *   1. `field.parse` (or a sensible default) — raw cell → typed value
 *   2. `required` presence check
 *   3. `field.validators` — composable field validators
 *   4. `field.schema` — optional Zod field schema (may refine the value)
 * Then, per row:
 *   5. `resource.validateRow` — cross-field checks
 *   6. `resource.schema` — optional whole-row Zod schema
 *
 * The function is pure and synchronous, making it trivial to unit test or run
 * inside a Web Worker for very large files.
 */
export function importRows<T>(
  sheet: ParsedSheet,
  resource: ResourceDefinition<T>,
  mapping: ColumnMapping,
): ImportResult<T> {
  const valid: ImportedRow<T>[] = []
  const invalid: RejectedRow[] = []

  sheet.rows.forEach((rawRow, rowIndex) => {
    const issues: RowIssue[] = []
    const row: Partial<T> = {}

    for (const field of resource.fields) {
      const key = field.key
      const keyStr = String(key)
      const header = mapping[keyStr]
      const raw = header ? rawRow[header] : undefined
      const context: FieldContext<T> = { field: key, row, rawRow, rowIndex }

      // 1. Parse
      let value: T[typeof key]
      try {
        value = field.parse
          ? field.parse(raw, context)
          : (defaultParse(raw) as T[typeof key])
      } catch (error) {
        issues.push({
          field: keyStr,
          message: error instanceof Error ? error.message : "Failed to parse value",
        })
        continue
      }

      // 2. Required
      if (field.required && isEmpty(value)) {
        issues.push({ field: keyStr, message: `${field.label} is required` })
      }

      // 3. Field validators
      for (const validate of field.validators ?? []) {
        const message = validate(value, context)
        if (message) issues.push({ field: keyStr, message })
      }

      // 4. Optional Zod field schema (skip empty optionals)
      if (field.schema && !(isEmpty(value) && !field.required)) {
        const result = field.schema.safeParse(value)
        if (!result.success) {
          issues.push({ field: keyStr, message: zodMessage(result.error) })
        } else {
          value = result.data as T[typeof key]
        }
      }

      row[key] = value
    }

    // 5. Cross-field, row-level validation
    if (resource.validateRow) {
      const rowIssues = resource.validateRow(row, { rowIndex, rawRow })
      if (rowIssues) issues.push(...rowIssues)
    }

    // 6. Optional whole-row Zod schema
    if (resource.schema && issues.length === 0) {
      const result = resource.schema.safeParse(row)
      if (!result.success) {
        issues.push({ message: zodMessage(result.error) })
      }
    }

    if (issues.length > 0) {
      invalid.push({ rowIndex, rawRow, issues })
    } else {
      valid.push({ rowIndex, data: row as T, rawRow })
    }
  })

  return {
    valid,
    invalid,
    meta: {
      total: sheet.rows.length,
      validCount: valid.length,
      invalidCount: invalid.length,
      headers: sheet.headers,
      mapping,
      unmappedRequired: getUnmappedRequired(resource, mapping),
    },
  }
}
