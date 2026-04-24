// Lightweight Result type for I/O boundaries.
// Use where code crosses an unreliable boundary: network, storage, JSON parsing,
// external process, filesystem. NOT for state updates, rendering, or collection transforms.

export type Result<T, E> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };

export function ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

export function err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}

export function isOk<T, E>(
  result: Result<T, E>,
): result is { readonly ok: true; readonly value: T } {
  return result.ok;
}

export function isErr<T, E>(
  result: Result<T, E>,
): result is { readonly ok: false; readonly error: E } {
  return !result.ok;
}

export function map<T, U, E>(result: Result<T, E>, fn: (value: T) => U): Result<U, E> {
  return result.ok ? ok(fn(result.value)) : result;
}

export function mapErr<T, E, F>(result: Result<T, E>, fn: (error: E) => F): Result<T, F> {
  return result.ok ? result : err(fn(result.error));
}

export function flatMap<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => Result<U, E>,
): Result<U, E> {
  return result.ok ? fn(result.value) : result;
}

export function match<T, E, U>(
  result: Result<T, E>,
  handlers: { onOk: (value: T) => U; onErr: (error: E) => U },
): U {
  return result.ok ? handlers.onOk(result.value) : handlers.onErr(result.error);
}

export function unwrap<T, E>(result: Result<T, E>): T {
  if (result.ok) return result.value;
  throw new Error(`unwrap called on Err: ${String(result.error)}`);
}

export function unwrapOr<T, E>(result: Result<T, E>, fallback: T): T {
  return result.ok ? result.value : fallback;
}

export function unwrapErr<T, E>(result: Result<T, E>): E {
  if (!result.ok) return result.error;
  throw new Error(`unwrapErr called on Ok: ${String(result.value)}`);
}

export function tryCatch<T, E>(fn: () => T, onError: (error: unknown) => E): Result<T, E> {
  try {
    return ok(fn());
  } catch (error: unknown) {
    return err(onError(error));
  }
}

export async function tryCatchAsync<T, E>(
  fn: () => Promise<T>,
  onError: (error: unknown) => E,
): Promise<Result<T, E>> {
  try {
    return ok(await fn());
  } catch (error: unknown) {
    return err(onError(error));
  }
}
