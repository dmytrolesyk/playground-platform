import { describe, expect, it } from 'vitest';
import {
  getArray,
  getDateString,
  getNumber,
  getString,
  getStringArray,
  isRecord,
} from './frontmatter.ts';

describe('frontmatter extractors', () => {
  describe('getString', () => {
    it('returns a string value', () => {
      expect(getString({ name: 'hello' }, 'name')).toBe('hello');
    });

    it('returns undefined for non-string value', () => {
      expect(getString({ name: 42 }, 'name')).toBeUndefined();
    });

    it('returns undefined for missing key', () => {
      expect(getString({}, 'name')).toBeUndefined();
    });

    it('returns ISO date string for Date values', () => {
      expect(getString({ d: new Date('2026-04-24') }, 'd')).toBe('2026-04-24');
    });
  });

  describe('getStringArray', () => {
    it('returns string array', () => {
      expect(getStringArray({ tags: ['a', 'b'] }, 'tags')).toEqual(['a', 'b']);
    });

    it('filters out non-string items', () => {
      expect(getStringArray({ tags: ['a', 42, 'b'] }, 'tags')).toEqual(['a', 'b']);
    });

    it('returns empty array for missing key', () => {
      expect(getStringArray({}, 'tags')).toEqual([]);
    });

    it('returns empty array for non-array value', () => {
      expect(getStringArray({ tags: 'not-array' }, 'tags')).toEqual([]);
    });
  });

  describe('getNumber', () => {
    it('returns a number value', () => {
      expect(getNumber({ count: 5 }, 'count')).toBe(5);
    });

    it('returns undefined for non-number value', () => {
      expect(getNumber({ count: '5' }, 'count')).toBeUndefined();
    });

    it('returns undefined for missing key', () => {
      expect(getNumber({}, 'count')).toBeUndefined();
    });
  });

  describe('getArray', () => {
    it('returns array value', () => {
      expect(getArray({ items: [1, 2] }, 'items')).toEqual([1, 2]);
    });

    it('returns empty array for missing key', () => {
      expect(getArray({}, 'items')).toEqual([]);
    });

    it('returns empty array for non-array value', () => {
      expect(getArray({ items: 'x' }, 'items')).toEqual([]);
    });
  });

  describe('getDateString', () => {
    it('returns string date as-is', () => {
      expect(getDateString({ d: '2026-04-24' }, 'd')).toBe('2026-04-24');
    });

    it('converts Date to ISO date string', () => {
      expect(getDateString({ d: new Date('2026-04-24T00:00:00Z') }, 'd')).toBe('2026-04-24');
    });

    it('returns undefined for missing key', () => {
      expect(getDateString({}, 'd')).toBeUndefined();
    });

    it('returns undefined for non-date value', () => {
      expect(getDateString({ d: 42 }, 'd')).toBeUndefined();
    });
  });

  describe('isRecord', () => {
    it('returns true for plain objects', () => {
      expect(isRecord({ a: 1 })).toBe(true);
    });

    it('returns false for null', () => {
      expect(isRecord(null)).toBe(false);
    });

    it('returns false for arrays', () => {
      expect(isRecord([1, 2])).toBe(false);
    });

    it('returns false for primitives', () => {
      expect(isRecord('hello')).toBe(false);
      expect(isRecord(42)).toBe(false);
    });
  });
});
