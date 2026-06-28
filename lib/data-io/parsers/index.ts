import type { FileFormat, ParsedSheet } from "../types"
import { parseCsv } from "./csv"
import { parseExcel, type ParseExcelOptions } from "./excel"

export { parseCsv } from "./csv"
export { parseExcel, type ParseExcelOptions } from "./excel"
export { matrixToSheet, normalizeHeaders } from "./shared"

/** File extensions accepted by the import pipeline, suitable for an <input accept>. */
export const ACCEPTED_IMPORT_EXTENSIONS = [
  ".csv",
  ".tsv",
  ".txt",
  ".xlsx",
  ".xls",
  ".ods",
] as const

/** Ready-made `accept` attribute value for a file input. */
export const ACCEPTED_IMPORT_ACCEPT = ACCEPTED_IMPORT_EXTENSIONS.join(",")

/** Infers the high-level format from a file name's extension. */
export function detectFormat(fileName: string): FileFormat | null {
  const ext = fileName.toLowerCase().split(".").pop() ?? ""
  if (["csv", "tsv", "txt"].includes(ext)) return "csv"
  if (["xlsx", "xls", "ods"].includes(ext)) return "xlsx"
  return null
}

/**
 * Format-agnostic entry point: detects whether a file is CSV or Excel and
 * dispatches to the right parser, returning a normalized {@link ParsedSheet}.
 */
export async function readSpreadsheet(
  file: File,
  options: ParseExcelOptions = {},
): Promise<ParsedSheet> {
  const format = detectFormat(file.name)
  if (format === "csv") return parseCsv(file)
  if (format === "xlsx") return parseExcel(file, options)
  throw new Error(
    `Unsupported file type: "${file.name}". Expected one of ${ACCEPTED_IMPORT_EXTENSIONS.join(", ")}.`,
  )
}
