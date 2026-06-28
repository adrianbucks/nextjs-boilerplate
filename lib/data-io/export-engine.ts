import Papa from "papaparse"
import * as XLSX from "xlsx"
import { downloadBlob } from "./download"
import { getField, visibleFields } from "./resource"
import type {
  CellValue,
  ExportOptions,
  FieldDefinition,
  FileFormat,
  ResourceDefinition,
} from "./types"

const MIME: Record<FileFormat, string> = {
  csv: "text/csv;charset=utf-8;",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
}

function resolveFields<T>(
  resource: ResourceDefinition<T>,
  keys?: (keyof T)[],
): FieldDefinition<T>[] {
  if (!keys) return visibleFields(resource)
  return keys
    .map((key) => getField(resource, key))
    .filter((field): field is FieldDefinition<T> => Boolean(field))
}

/** Serializes a single cell to an Excel/CSV-friendly primitive. */
function toCell(value: CellValue): string | number | boolean | Date {
  if (value === null || value === undefined) return ""
  return value
}

/**
 * Builds a 2D matrix from records using each field's `format` function. This is
 * the shared representation both the CSV and Excel writers consume, which keeps
 * column ordering and formatting identical across formats.
 */
export function buildExportMatrix<T>(
  records: T[],
  resource: ResourceDefinition<T>,
  options: ExportOptions<T> = {},
): (string | number | boolean | Date)[][] {
  const fields = resolveFields(resource, options.fields)
  const dataRows = records.map((record) =>
    fields.map((field) => {
      const value = record[field.key]
      const cell = field.format ? field.format(value, record) : (value as CellValue)
      return toCell(cell)
    }),
  )

  if (options.includeHeaders === false) return dataRows
  const headerRow = fields.map((field) => field.label)
  return [headerRow, ...dataRows]
}

/** Serializes records to a Blob in the requested format (no download). */
export function exportToBlob<T>(
  records: T[],
  resource: ResourceDefinition<T>,
  options: ExportOptions<T> = {},
): Blob {
  const format = options.format ?? "xlsx"
  const matrix = buildExportMatrix(records, resource, options)

  if (format === "csv") {
    const csv = Papa.unparse(matrix)
    return new Blob([csv], { type: MIME.csv })
  }

  const worksheet = XLSX.utils.aoa_to_sheet(matrix)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    options.sheetName ?? resource.label,
  )
  const buffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" })
  return new Blob([buffer], { type: MIME.xlsx })
}

/**
 * Serializes records and triggers a browser download. The primary export entry
 * point used by the UI.
 */
export function exportRecords<T>(
  records: T[],
  resource: ResourceDefinition<T>,
  options: ExportOptions<T> = {},
): void {
  const format = options.format ?? "xlsx"
  const blob = exportToBlob(records, resource, options)
  const fileName = `${options.fileName ?? resource.name}.${format}`
  downloadBlob(blob, fileName)
}

/**
 * Generates and downloads a blank import template: a header row of field
 * labels plus one example row populated from each field's `example`. Gives
 * users a correctly-shaped file to fill in.
 */
export function downloadTemplate<T>(
  resource: ResourceDefinition<T>,
  format: FileFormat = "xlsx",
): void {
  const fields = visibleFields(resource)
  const headerRow = fields.map((field) => field.label)
  const exampleRow = fields.map((field) => field.example ?? "")
  const matrix = [headerRow, exampleRow]

  let blob: Blob
  if (format === "csv") {
    blob = new Blob([Papa.unparse(matrix)], { type: MIME.csv })
  } else {
    const worksheet = XLSX.utils.aoa_to_sheet(matrix)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, resource.label)
    const buffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" })
    blob = new Blob([buffer], { type: MIME.xlsx })
  }

  downloadBlob(blob, `${resource.name}-template.${format}`)
}
