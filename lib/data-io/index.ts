/**
 * data-io — a self-contained, framework-agnostic CSV/Excel import & export
 * engine. Drop this folder into any project, author a `ResourceDefinition`,
 * and you get parsing, header auto-mapping, pluggable validation, and
 * formatted export for free.
 *
 * Typical usage:
 * ```ts
 * const sheet = await readSpreadsheet(file)
 * const mapping = autoMapColumns(sheet.headers, contactResource)
 * const result = importRows(sheet, contactResource, mapping)
 * // ...persist result.valid, surface result.invalid
 * exportRecords(records, contactResource, { format: "xlsx" })
 * ```
 */

// Types
export type * from "./types"

// Resource authoring
export { defineField, defineResource, getField, visibleFields } from "./resource"

// Parsing
export {
  ACCEPTED_IMPORT_ACCEPT,
  ACCEPTED_IMPORT_EXTENSIONS,
  detectFormat,
  matrixToSheet,
  normalizeHeaders,
  parseCsv,
  parseExcel,
  readSpreadsheet,
  type ParseExcelOptions,
} from "./parsers"

// Mapping
export { autoMapColumns, getUnmappedRequired, isMappingComplete } from "./mapping"

// Import
export { importRows } from "./import-engine"

// Export
export {
  buildExportMatrix,
  downloadTemplate,
  exportRecords,
  exportToBlob,
} from "./export-engine"

// Utilities
export { downloadBlob } from "./download"

// Building blocks
export * as validators from "./validators"
export * as transformers from "./transformers"
