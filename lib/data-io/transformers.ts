import type { CellValue } from "./types"

/**
 * Reusable parse/format helpers for converting between raw spreadsheet cells
 * and typed domain values. Use the `parse*` helpers in a field's `parse` and
 * the `format*` helpers in its `format`.
 */

const blank = (raw: CellValue): boolean =>
  raw === null || raw === undefined || (typeof raw === "string" && raw.trim() === "")

/** Trims a string cell; empty becomes `undefined`. */
export function parseString(raw: CellValue): string | undefined {
  if (blank(raw)) return undefined
  return String(raw).trim()
}

/** Parses a numeric cell, returning `undefined` when blank or non-numeric. */
export function parseNumber(raw: CellValue): number | undefined {
  if (blank(raw)) return undefined
  const num = typeof raw === "number" ? raw : Number(String(raw).replace(/,/g, ""))
  return Number.isFinite(num) ? num : undefined
}

/**
 * Parses common boolean spellings: true/false, yes/no, y/n, 1/0, on/off.
 * Returns `undefined` for blanks or unrecognized values.
 */
export function parseBoolean(raw: CellValue): boolean | undefined {
  if (blank(raw)) return undefined
  if (typeof raw === "boolean") return raw
  const normalized = String(raw).trim().toLowerCase()
  if (["true", "yes", "y", "1", "on"].includes(normalized)) return true
  if (["false", "no", "n", "0", "off"].includes(normalized)) return false
  return undefined
}

/**
 * Parses a date cell. Handles JS Dates, Excel serial date numbers, and common
 * string formats. Returns `undefined` when unparseable.
 */
export function parseDate(raw: CellValue): Date | undefined {
  if (blank(raw)) return undefined
  if (raw instanceof Date) return Number.isNaN(raw.getTime()) ? undefined : raw
  if (typeof raw === "number") {
    // Excel serial date → JS Date (epoch 1899-12-30, accounting for the leap bug).
    const ms = Math.round((raw - 25569) * 86400 * 1000)
    const date = new Date(ms)
    return Number.isNaN(date.getTime()) ? undefined : date
  }
  const date = new Date(String(raw))
  return Number.isNaN(date.getTime()) ? undefined : date
}

/** Lowercases and trims a string cell (handy for emails/usernames). */
export function parseLowerString(raw: CellValue): string | undefined {
  return parseString(raw)?.toLowerCase()
}

/** Formats a Date as an ISO date string (YYYY-MM-DD) for export. */
export function formatDate(value: Date | undefined | null): string {
  if (!value) return ""
  return value.toISOString().slice(0, 10)
}

/** Formats a Date as a full ISO timestamp for export. */
export function formatDateTime(value: Date | undefined | null): string {
  if (!value) return ""
  return value.toISOString()
}

/** Formats an epoch-millisecond timestamp as an ISO date string. */
export function formatTimestamp(value: number | undefined | null): string {
  if (value === null || value === undefined) return ""
  return new Date(value).toISOString().slice(0, 10)
}

/** Formats a boolean as "Yes"/"No" for human-friendly export. */
export function formatYesNo(value: boolean | undefined | null): string {
  if (value === null || value === undefined) return ""
  return value ? "Yes" : "No"
}
