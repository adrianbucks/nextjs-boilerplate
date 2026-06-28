import type { CellValue, ParsedSheet, RawRow } from "../types"

/**
 * Normalizes a raw header row into clean, unique, non-empty column names.
 * Blank headers become `Column N`; duplicates get a numeric suffix so every
 * key in a {@link RawRow} is addressable.
 */
export function normalizeHeaders(rawHeaders: CellValue[]): string[] {
  const seen = new Map<string, number>()
  return rawHeaders.map((header, index) => {
    let name = header === null || header === undefined ? "" : String(header).trim()
    if (!name) name = `Column ${index + 1}`
    const count = seen.get(name) ?? 0
    seen.set(name, count + 1)
    return count === 0 ? name : `${name} (${count + 1})`
  })
}

const isBlankCell = (cell: CellValue): boolean =>
  cell === null || cell === undefined || (typeof cell === "string" && cell.trim() === "")

/**
 * Converts a 2D matrix (first row = headers) into the engine's normalized
 * {@link ParsedSheet}. Fully blank rows are dropped.
 */
export function matrixToSheet(
  matrix: CellValue[][],
  sheetName: string,
): ParsedSheet {
  const [headerRow = [], ...dataRows] = matrix
  const headers = normalizeHeaders(headerRow)

  const rows: RawRow[] = dataRows
    .filter((row) => row.some((cell) => !isBlankCell(cell)))
    .map((row) => {
      const record: RawRow = {}
      headers.forEach((header, index) => {
        record[header] = row[index] ?? null
      })
      return record
    })

  return { headers, rows, sheetName, sheetNames: [sheetName] }
}
