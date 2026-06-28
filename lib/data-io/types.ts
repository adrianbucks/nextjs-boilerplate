import type { ZodType } from "zod"

/**
 * ============================================================================
 *  data-io — a pluggable CSV / Excel import & export engine
 * ============================================================================
 *
 * The engine is built around a single declarative artifact: a
 * {@link ResourceDefinition}. You describe your entity's fields once — their
 * labels, header aliases, how to parse an imported cell, how to format a cell
 * for export, and how to validate the value — and the engine handles parsing,
 * column auto-mapping, validation, and serialization for both CSV and Excel.
 *
 * Nothing here is domain specific, so a resource definition can be moved
 * between projects without touching the engine.
 */

/** A primitive value as produced by a spreadsheet parser. */
export type CellValue = string | number | boolean | Date | null | undefined

/** A single parsed row, keyed by its source column header. */
export type RawRow = Record<string, CellValue>

/** Supported file formats for both import and export. */
export type FileFormat = "csv" | "xlsx"

/** The normalized output of any parser, regardless of source format. */
export interface ParsedSheet {
  /** Ordered, de-duplicated column headers found in the first row. */
  headers: string[]
  /** Data rows (header row excluded), each keyed by header. */
  rows: RawRow[]
  /** Name of the sheet the rows came from (Excel) or the file (CSV). */
  sheetName: string
  /** All sheet names available in the workbook (Excel only). */
  sheetNames: string[]
}

/** Context handed to field parsers and validators for a single cell. */
export interface FieldContext<T> {
  /** The field key currently being processed. */
  field: keyof T
  /** The partially-built typed row (fields parsed so far). */
  row: Partial<T>
  /** The original untouched raw row. */
  rawRow: RawRow
  /** Zero-based index of the row within the data rows. */
  rowIndex: number
}

/**
 * A field-level validator. Return a human-readable message to flag a problem,
 * or `null`/`undefined` when the value is valid. Validators are pure and
 * composable — see `lib/data-io/validators.ts` for a ready-made library.
 */
// `T` defaults to `any` (not `unknown`) so the generic validators in
// `validators.ts` remain assignable to a field's strongly-typed
// `FieldValidator<T[K], T>[]` without forcing callers to parameterize them.
export type FieldValidator<V = unknown, T = any> = (
  value: V,
  context: FieldContext<T>,
) => string | null | undefined | void

/** A single problem detected while importing a row. */
export interface RowIssue {
  /** Field key the issue relates to, if any (omit for row-level issues). */
  field?: string
  /** Human-readable description. */
  message: string
}

/**
 * Declarative description of one field on a resource.
 *
 * `K` is pinned to a specific key so `parse`/`format`/`validators` are all
 * correctly typed against `T[K]`.
 */
export interface FieldDefinition<T, K extends keyof T = keyof T> {
  /** The property on the entity this field maps to. */
  key: K
  /** Human-friendly label, used as the export header and mapping UI label. */
  label: string
  /**
   * Alternate header spellings used to auto-map incoming columns
   * (e.g. ["e-mail", "email address"]). Matching is case/punctuation
   * insensitive, so you only need meaningfully different spellings.
   */
  aliases?: string[]
  /** When true, a missing/empty value rejects the row. */
  required?: boolean
  /** Short description shown in the column-mapping UI. */
  description?: string
  /** Example value used when generating an import template. */
  example?: string
  /**
   * Convert a raw imported cell into the typed domain value. Throwing here is
   * caught and surfaced as a validation issue. Defaults to a pass-through that
   * trims strings and treats empty strings as `undefined`.
   */
  parse?: (raw: CellValue, context: FieldContext<T>) => T[K]
  /**
   * Convert the typed domain value into a cell for export. Defaults to a
   * pass-through. Use this to flatten dates, enums, booleans, etc.
   */
  format?: (value: T[K], row: T) => CellValue
  /** Ordered field-level validators, run after `parse`. */
  validators?: FieldValidator<T[K], T>[]
  /** Optional Zod schema for this field, run after `validators`. */
  schema?: ZodType
  /** Hide from generated templates and default export column set. */
  hidden?: boolean
}

/**
 * The full, declarative description of an importable/exportable entity.
 */
export interface ResourceDefinition<T> {
  /** Stable machine name (used for file names, e.g. "contacts"). */
  name: string
  /** Human label, e.g. "Contacts". */
  label: string
  /** Ordered field definitions. */
  fields: FieldDefinition<T>[]
  /**
   * Optional cross-field validation run after every field on the row has been
   * parsed and individually validated.
   */
  validateRow?: (
    row: Partial<T>,
    context: { rowIndex: number; rawRow: RawRow },
  ) => RowIssue[] | void
  /** Optional whole-row Zod schema, run after `validateRow`. */
  schema?: ZodType
}

/**
 * Maps each resource field key to the source header it should read from
 * (or `null` when the field is unmapped). Produced by auto-mapping and
 * adjustable by the user in the mapping UI.
 */
export type ColumnMapping = Record<string, string | null>

/** A successfully imported, fully-typed row. */
export interface ImportedRow<T> {
  rowIndex: number
  data: T
  rawRow: RawRow
}

/** A row that failed parsing or validation, with all collected issues. */
export interface RejectedRow {
  rowIndex: number
  rawRow: RawRow
  issues: RowIssue[]
}

/** The complete outcome of an import run. */
export interface ImportResult<T> {
  valid: ImportedRow<T>[]
  invalid: RejectedRow[]
  meta: {
    total: number
    validCount: number
    invalidCount: number
    headers: string[]
    mapping: ColumnMapping
    /** Field keys that are required but have no mapped source column. */
    unmappedRequired: string[]
  }
}

/** Options for serializing records to a file. */
export interface ExportOptions<T> {
  /** Output format. Defaults to "xlsx". */
  format?: FileFormat
  /** File name without extension. Defaults to the resource name. */
  fileName?: string
  /** Subset/ordering of field keys to export. Defaults to all visible fields. */
  fields?: (keyof T)[]
  /** Excel sheet name. Defaults to the resource label. */
  sheetName?: string
  /** Include the header row. Defaults to true. */
  includeHeaders?: boolean
}
