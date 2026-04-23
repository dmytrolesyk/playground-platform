import {
  getModuleProgress,
  getProgress,
  getStage,
  markArticleChecked,
  markArticleMastered,
  markArticlePracticed,
  markArticleRead,
  resetProgress,
} from '@playground/knowledge-engine/progress';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const STORAGE_KEY = 'kb-learning-progress';

function createMemoryStorage(): Storage {
  const items = new Map<string, string>();

  return {
    get length(): number {
      return items.size;
    },
    clear(): void {
      items.clear();
    },
    getItem(key: string): string | null {
      return items.get(key) ?? null;
    },
    key(index: number): string | null {
      return Array.from(items.keys())[index] ?? null;
    },
    removeItem(key: string): void {
      items.delete(key);
    },
    setItem(key: string, value: string): void {
      items.set(key, value);
    },
  };
}

describe('learn progress', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-21T10:00:00.000Z'));
    vi.stubGlobal('localStorage', createMemoryStorage());
  });

  afterEach(() => {
    resetProgress();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('returns empty staged progress when no storage exists', () => {
    expect(getProgress()).toEqual({ articlesRead: {}, modulesCompleted: [] });
    expect(getStage('architecture/overview')).toBeUndefined();
    expect(getModuleProgress(['architecture/overview', 'concepts/signals'])).toEqual({
      read: 0,
      checked: 0,
      practiced: 0,
      mastered: 0,
      total: 2,
    });
  });

  it('migrates old completed articles to mastered', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        articlesRead: {
          'architecture/overview': {
            firstRead: '2026-04-20T09:00:00.000Z',
            lastRead: '2026-04-20T09:30:00.000Z',
            completed: true,
          },
        },
        modulesCompleted: ['foundation'],
      }),
    );

    const progress = getProgress();

    expect(getStage('architecture/overview')).toBe('mastered');
    expect(progress).toEqual({
      articlesRead: {
        'architecture/overview': {
          firstRead: '2026-04-20T09:00:00.000Z',
          lastRead: '2026-04-20T09:30:00.000Z',
          stage: 'mastered',
          masteredAt: '2026-04-20T09:30:00.000Z',
        },
      },
      modulesCompleted: ['foundation'],
    });
    expect(localStorage.getItem(STORAGE_KEY)).not.toContain('"completed"');
  });

  it('migrates old incomplete articles to read', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        articlesRead: {
          'concepts/progressive-enhancement': {
            firstRead: '2026-04-20T09:00:00.000Z',
            lastRead: '2026-04-20T09:30:00.000Z',
            completed: false,
          },
        },
      }),
    );

    expect(getProgress()).toEqual({
      articlesRead: {
        'concepts/progressive-enhancement': {
          firstRead: '2026-04-20T09:00:00.000Z',
          lastRead: '2026-04-20T09:30:00.000Z',
          stage: 'read',
        },
      },
      modulesCompleted: [],
    });
    expect(getStage('concepts/progressive-enhancement')).toBe('read');
    expect(localStorage.getItem(STORAGE_KEY)).not.toContain('"completed"');
  });

  it('advances through stages without moving backward', () => {
    const slug = 'labs/repair-a-knowledge-graph';

    markArticleRead(slug);
    expect(getStage(slug)).toBe('read');

    vi.setSystemTime(new Date('2026-04-21T11:00:00.000Z'));
    markArticleChecked(slug);
    expect(getStage(slug)).toBe('checked');

    vi.setSystemTime(new Date('2026-04-21T12:00:00.000Z'));
    markArticlePracticed(slug);
    expect(getStage(slug)).toBe('practiced');

    vi.setSystemTime(new Date('2026-04-21T13:00:00.000Z'));
    markArticleMastered(slug);
    expect(getStage(slug)).toBe('mastered');

    vi.setSystemTime(new Date('2026-04-21T14:00:00.000Z'));
    markArticleRead(slug);
    markArticleChecked(slug);
    markArticlePracticed(slug);

    expect(getStage(slug)).toBe('mastered');
    expect(getModuleProgress([slug])).toEqual({
      read: 1,
      checked: 1,
      practiced: 1,
      mastered: 1,
      total: 1,
    });
  });
});
