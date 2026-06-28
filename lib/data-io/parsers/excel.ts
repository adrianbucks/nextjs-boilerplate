import * as XLSX from "xlsx"
import type { CellValue, ParsedSheet } from "../types"
import { matrixToSheet } from "./shared"

export interface ParseExcelOptions {
  /** Name of the sheet to read. Defaults to the first sheet in the workbook. */
  sheet?: string
}

/**
 * Parses an Excel workbook (.xlsx/.xls/.ods) into a normalized
 * {@link ParsedSheet} using SheetJS. Dates are returned as JS `Date` objects
 * (`cellDates`), and the full list of sheet names is preserved so the UI can
 * offer a sheet picker for multi-tab workbooks.
 */
export async function parseExcel(
  file: File,
  options: ParseExcelOptions = {},
): Promise<ParsedSheet> {
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: "array", cellDates: true })

  const sheetNames = workbook.SheetNames
  const targetName =
    options.sheet && sheetNames.includes(options.sheet)
      ? options.sheet
      : sheetNames[0]

  if (!targetName) {
    return { headers: [], rows: [], sheetName: "", sheetNames: [] }
  }

  const worksheet = workbook.Sheets[targetName]
  const matrix = XLSX.utils.sheet_to_json<CellValue[]>(worksheet, {
    header: 1,
    raw: true,
    blankrows: false,
    defval: null,
  })

  const sheet = matrixToSheet(matrix as CellValue[][], targetName)
  sheet.sheetNames = sheetNames
  return sheet
}
