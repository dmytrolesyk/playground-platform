import { describe, expect, it } from 'vitest';
import {
  type Result,
  err,
  flatMap,
  isErr,
  isOk,
  map,
  mapErr,
  match,
  ok,
  tryCatch,
  tryCatchAsync,
  unwrap,
  unwrapErr,
  unwrapOr,
} from './result.ts';

describe('Result', () => {
  describe('ok / err constructors', () => {
    it('creates an Ok result', () => {
      const result = ok(42);
      expect(result).toEqual({ ok: true, value: 42 });
    });

    it('creates an Err result', () => {
      const result = err('boom');
      expect(result).toEqual({ ok: false, error: 'boom' });
    });
  });

  describe('isOk / isErr', () => {
    it('isOk returns true for Ok, false for Err', () => {
      expect(isOk(ok(1))).toBe(true);
      expect(isOk(err('x'))).toBe(false);
    });

    it('isErr returns true for Err, false for Ok', () => {
      expect(isErr(err('x'))).toBe(true);
      expect(isErr(ok(1))).toBe(false);
    });
  });

  describe('map', () => {
    it('transforms the value of an Ok result', () => {
      expect(map(ok(2), (n) => n * 3)).toEqual(ok(6));
    });

    it('passes through an Err result unchanged', () => {
      const result: Result<number, string> = err('fail');
      expect(map(result, (n) => n * 3)).toEqual(err('fail'));
    });
  });

  describe('mapErr', () => {
    it('transforms the error of an Err result', () => {
      expect(mapErr(err('fail'), (e) => `wrapped: ${e}`)).toEqual(err('wrapped: fail'));
    });

    it('passes through an Ok result unchanged', () => {
      const result: Result<number, string> = ok(42);
      expect(mapErr(result, (e) => `wrapped: ${e}`)).toEqual(ok(42));
    });
  });

  describe('flatMap', () => {
    const safeDivide = (a: number, b: number): Result<number, string> =>
      b === 0 ? err('division by zero') : ok(a / b);

    it('chains Ok results', () => {
      expect(flatMap(ok(10), (n) => safeDivide(n, 2))).toEqual(ok(5));
    });

    it('short-circuits on Err', () => {
      const result: Result<number, string> = err('bad input');
      expect(flatMap(result, (n) => safeDivide(n, 2))).toEqual(err('bad input'));
    });

    it('returns Err from the chained function', () => {
      expect(flatMap(ok(10), (n) => safeDivide(n, 0))).toEqual(err('division by zero'));
    });
  });

  describe('match', () => {
    it('calls onOk for Ok results', () => {
      const result = match(ok(42), {
        onOk: (v) => `value: ${v}`,
        onErr: (e) => `error: ${e}`,
      });
      expect(result).toBe('value: 42');
    });

    it('calls onErr for Err results', () => {
      const result = match(err('boom') as Result<number, string>, {
        onOk: (v) => `value: ${v}`,
        onErr: (e) => `error: ${e}`,
      });
      expect(result).toBe('error: boom');
    });
  });

  describe('unwrap / unwrapOr / unwrapErr', () => {
    it('unwrap returns the value from Ok', () => {
      expect(unwrap(ok(42))).toBe(42);
    });

    it('unwrap throws for Err', () => {
      expect(() => unwrap(err('boom'))).toThrow('unwrap called on Err: boom');
    });

    it('unwrapOr returns the value from Ok', () => {
      expect(unwrapOr(ok(42), 0)).toBe(42);
    });

    it('unwrapOr returns the fallback for Err', () => {
      expect(unwrapOr(err('boom') as Result<number, string>, 0)).toBe(0);
    });

    it('unwrapErr returns the error from Err', () => {
      expect(unwrapErr(err('boom'))).toBe('boom');
    });

    it('unwrapErr throws for Ok', () => {
      expect(() => unwrapErr(ok(42))).toThrow('unwrapErr called on Ok: 42');
    });
  });

  describe('tryCatch', () => {
    it('returns Ok when function succeeds', () => {
      const result = tryCatch(
        () => JSON.parse('{"a":1}') as { a: number },
        (e) => (e instanceof Error ? e.message : String(e)),
      );
      expect(result).toEqual(ok({ a: 1 }));
    });

    it('returns Err when function throws', () => {
      const result = tryCatch(
        () => JSON.parse('{{invalid') as unknown,
        (e) => (e instanceof Error ? e.message : String(e)),
      );
      expect(isErr(result)).toBe(true);
    });
  });

  describe('tryCatchAsync', () => {
    it('returns Ok when async function succeeds', async () => {
      const result = await tryCatchAsync(
        async () => 42,
        (e) => String(e),
      );
      expect(result).toEqual(ok(42));
    });

    it('returns Err when async function rejects', async () => {
      const result = await tryCatchAsync(
        async () => {
          throw new Error('async boom');
        },
        (e) => (e instanceof Error ? e.message : String(e)),
      );
      expect(result).toEqual(err('async boom'));
    });
  });
});
