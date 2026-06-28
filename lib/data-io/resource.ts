import type { FieldDefinition, ResourceDefinition } from "./types"

/**
 * Authoring helper that preserves per-key typing for a single field.
 *
 * Because {@link ResourceDefinition.fields} is a heterogeneous array, defining
 * fields inline would widen `key` to `keyof T` and lose the link between
 * `parse`/`format`/`validators` and the concrete `T[K]`. Wrapping each field in
 * `defineField` keeps that link intact:
 *
 * ```ts
 * defineField<Contact, "email">({ key: "email", label: "Email", ... })
 * ```
 */
export function defineField<T, K extends keyof T>(
  field: FieldDefinition<T, K>,
): FieldDefinition<T> {
  // The argument is checked against the precise `FieldDefinition<T, K>` so
  // `parse`/`format`/`validators` are fully type-safe at the call site. We then
  // widen the return to the heterogeneous `FieldDefinition<T>` used in the
  // resource's `fields` array — a single, contained cast that sidesteps the
  // parameter-variance friction of storing mixed-key field definitions.
  return field as unknown as FieldDefinition<T>
}

/**
 * Identity helper that brands an object as a {@link ResourceDefinition} and
 * gives you inference + editor autocomplete. Keeping definitions in their own
 * module (see `lib/resources/*`) makes them trivially portable.
 */
export function defineResource<T>(
  definition: ResourceDefinition<T>,
): ResourceDefinition<T> {
  return definition
}

/** Returns the field definitions that should appear in templates/exports. */
export function visibleFields<T>(
  resource: ResourceDefinition<T>,
): FieldDefinition<T>[] {
  return resource.fields.filter((field) => !field.hidden)
}

/** Looks up a field definition by key. */
export function getField<T>(
  resource: ResourceDefinition<T>,
  key: keyof T,
): FieldDefinition<T> | undefined {
  return resource.fields.find((field) => field.key === key)
}
