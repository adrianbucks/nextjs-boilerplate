import type { FieldValidator } from "./types"

/**
 * A composable library of field validators. Each factory returns a
 * {@link FieldValidator}, so they can be listed in any order on a field's
 * `validators` array. They short-circuit on empty values (except `required`),
 * leaving "is this required" as the single source of truth for presence.
 */

const isEmpty = (value: unknown): boolean =>
  value === null ||
  value === undefined ||
  (typeof value === "string" && value.trim() === "")

/** Fails when the value is missing or blank. */
export function required(message = "This field is required"): FieldValidator {
  return (value) => (isEmpty(value) ? message : null)
}

/** Validates an email-shaped string. */
export function email(message = "Must be a valid email address"): FieldValidator {
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return (value) => {
    if (isEmpty(value)) return null
    return pattern.test(String(value)) ? null : message
  }
}

/** Enforces a minimum string length. */
export function minLength(min: number, message?: string): FieldValidator {
  return (value) => {
    if (isEmpty(value)) return null
    return String(value).length >= min
      ? null
      : (message ?? `Must be at least ${min} characters`)
  }
}

/** Enforces a maximum string length. */
export function maxLength(max: number, message?: string): FieldValidator {
  return (value) => {
    if (isEmpty(value)) return null
    return String(value).length <= max
      ? null
      : (message ?? `Must be at most ${max} characters`)
  }
}

/** Requires the value to be a finite number (after coercion). */
export function isNumber(message = "Must be a number"): FieldValidator {
  return (value) => {
    if (isEmpty(value)) return null
    return Number.isFinite(Number(value)) ? null : message
  }
}

/** Requires a number within an inclusive range. */
export function numberInRange(
  min: number,
  max: number,
  message?: string,
): FieldValidator {
  return (value) => {
    if (isEmpty(value)) return null
    const num = Number(value)
    if (!Number.isFinite(num)) return "Must be a number"
    return num >= min && num <= max
      ? null
      : (message ?? `Must be between ${min} and ${max}`)
  }
}

/** Restricts the value to a fixed set of allowed options. */
export function oneOf<V extends string | number>(
  allowed: readonly V[],
  message?: string,
): FieldValidator {
  return (value) => {
    if (isEmpty(value)) return null
    return allowed.includes(value as V)
      ? null
      : (message ?? `Must be one of: ${allowed.join(", ")}`)
  }
}

/** Validates the value against a regular expression. */
export function matches(pattern: RegExp, message = "Invalid format"): FieldValidator {
  return (value) => {
    if (isEmpty(value)) return null
    return pattern.test(String(value)) ? null : message
  }
}

/** Requires the (parsed) value to be a valid Date. */
export function isDate(message = "Must be a valid date"): FieldValidator {
  return (value) => {
    if (isEmpty(value)) return null
    const date = value instanceof Date ? value : new Date(String(value))
    return Number.isNaN(date.getTime()) ? message : null
  }
}
