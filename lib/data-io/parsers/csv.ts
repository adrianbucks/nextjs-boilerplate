import Papa from "papaparse"
import type { CellValue, ParsedSheet } from "../types"
import { matrixToSheet } from "./shared"

/**
 * Parses a CSV file (or raw CSV string) into a normalized {@link ParsedSheet}
 * using PapaParse. Parsing happens entirely in the browser/worker, so it works
 * offline. Type coercion is intentionally left to field `parse` functions —
 * here every cell stays a string for predictable downstream handling.
 */
export async function parseCsv(
  source: File | string,
  sheetName = "CSV",
): Promise<ParsedSheet> {
  const text = typeof source === "string" ? source : await source.text()
  const name = typeof source === "string" ? sheetName : source.name

  return new Promise<ParsedSheet>((resolve, reject) => {
    Papa.parse<CellValue[]>(text, {
      skipEmptyLines: "greedy",
      complete: (result) => {
        resolve(matrixToSheet(result.data as CellValue[][], name))
      },
      error: (error: unknown) =>
        reject(error instanceof Error ? error : new Error(String(error))),
    })
  })
}
