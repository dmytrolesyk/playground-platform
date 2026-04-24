/** Check that a value is a non-null object (not an array). */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Check that a value is an array where every element satisfies a predicate. */
export function isArrayOf<T>(
  value: unknown,
  predicate: (item: unknown) => item is T,
): value is T[] {
  return Array.isArray(value) && value.every(predicate);
}
