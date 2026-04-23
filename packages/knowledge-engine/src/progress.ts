// Mastery progress model for knowledge articles
// Uses localStorage for persistence — browser-only

export type MasteryStage = 'read' | 'checked' | 'practiced' | 'mastered';

export interface ArticleProgress {
  firstRead: string;
  lastRead: string;
  stage: MasteryStage;
  checkedAt?: string;
  practicedAt?: string;
  masteredAt?: string;
}

export interface LearningProgress {
  articlesRead: Record<string, ArticleProgress>;
  modulesCompleted: string[];
}

type LegacyArticleProgress = {
  firstRead?: unknown;
  lastRead?: unknown;
  completed?: unknown;
  stage?: unknown;
  checkedAt?: unknown;
  practicedAt?: unknown;
  masteredAt?: unknown;
};

type StoredLearningProgress = {
  articlesRead?: unknown;
  modulesCompleted?: unknown;
};

const STORAGE_KEY = 'kb-learning-progress';

const STAGE_ORDER: Record<MasteryStage, number> = {
  read: 0,
  checked: 1,
  practiced: 2,
  mastered: 3,
};

function emptyProgress(): LearningProgress {
  return { articlesRead: {}, modulesCompleted: [] };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isMasteryStage(value: unknown): value is MasteryStage {
  return value === 'read' || value === 'checked' || value === 'practiced' || value === 'mastered';
}

function stringOrFallback(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.length > 0 ? value : fallback;
}

function optionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function migrateArticleProgress(
  value: LegacyArticleProgress,
  fallbackDate: string,
): ArticleProgress {
  const firstRead = stringOrFallback(value.firstRead, fallbackDate);
  const lastRead = stringOrFallback(value.lastRead, firstRead);

  if (isMasteryStage(value.stage)) {
    const progress: ArticleProgress = {
      firstRead,
      lastRead,
      stage: value.stage,
    };
    const checkedAt = optionalString(value.checkedAt);
    const practicedAt = optionalString(value.practicedAt);
    const masteredAt = optionalString(value.masteredAt);
    if (checkedAt !== undefined) progress.checkedAt = checkedAt;
    if (practicedAt !== undefined) progress.practicedAt = practicedAt;
    if (masteredAt !== undefined) progress.masteredAt = masteredAt;
    return progress;
  }

  if (value.completed === true) {
    return {
      firstRead,
      lastRead,
      stage: 'mastered',
      masteredAt: optionalString(value.masteredAt) ?? lastRead,
    };
  }

  return { firstRead, lastRead, stage: 'read' };
}

function migrateProgress(value: StoredLearningProgress): LearningProgress {
  const progress = emptyProgress();
  const now = new Date().toISOString();

  if (isRecord(value.articlesRead)) {
    for (const [slug, article] of Object.entries(value.articlesRead)) {
      if (isRecord(article)) {
        progress.articlesRead[slug] = migrateArticleProgress(article, now);
      }
    }
  }

  if (Array.isArray(value.modulesCompleted)) {
    progress.modulesCompleted = value.modulesCompleted.filter(
      (module): module is string => typeof module === 'string' && module.length > 0,
    );
  }

  return progress;
}

function getStorage(): Storage | undefined {
  return typeof localStorage === 'undefined' ? undefined : localStorage;
}

function loadProgress(): LearningProgress {
  const storage = getStorage();
  if (storage === undefined) return emptyProgress();

  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (raw === null) return emptyProgress();

    const parsed = JSON.parse(raw) as StoredLearningProgress;
    const progress = migrateProgress(parsed);
    saveProgress(progress);
    return progress;
  } catch {
    return emptyProgress();
  }
}

function saveProgress(progress: LearningProgress): void {
  getStorage()?.setItem(STORAGE_KEY, JSON.stringify(progress));
}

function stageAtLeast(stage: MasteryStage, minimum: MasteryStage): boolean {
  return STAGE_ORDER[stage] >= STAGE_ORDER[minimum];
}

function progressWithArticle(slug: string): {
  progress: LearningProgress;
  article: ArticleProgress;
} {
  const progress = loadProgress();
  const now = new Date().toISOString();
  const existing = progress.articlesRead[slug];
  const article = existing ?? { firstRead: now, lastRead: now, stage: 'read' };

  progress.articlesRead[slug] = article;
  return { progress, article };
}

function advanceArticle(slug: string, targetStage: MasteryStage): void {
  const { progress, article } = progressWithArticle(slug);
  const now = new Date().toISOString();
  const nextStage = stageAtLeast(article.stage, targetStage) ? article.stage : targetStage;

  article.lastRead = now;
  article.stage = nextStage;

  if (stageAtLeast(nextStage, 'checked')) {
    article.checkedAt = article.checkedAt ?? now;
  }
  if (stageAtLeast(nextStage, 'practiced')) {
    article.practicedAt = article.practicedAt ?? now;
  }
  if (nextStage === 'mastered') {
    article.masteredAt = article.masteredAt ?? now;
  }

  saveProgress(progress);
}

export function markArticleRead(slug: string): void {
  const { progress, article } = progressWithArticle(slug);
  article.lastRead = new Date().toISOString();
  saveProgress(progress);
}

export function markArticleChecked(slug: string): void {
  advanceArticle(slug, 'checked');
}

export function markArticlePracticed(slug: string): void {
  advanceArticle(slug, 'practiced');
}

export function markArticleMastered(slug: string): void {
  advanceArticle(slug, 'mastered');
}

export function getProgress(): LearningProgress {
  return loadProgress();
}

export function getStage(slug: string): MasteryStage | undefined {
  return loadProgress().articlesRead[slug]?.stage;
}

export function isArticleRead(slug: string): boolean {
  return getStage(slug) !== undefined;
}

export function isArticleCompleted(slug: string): boolean {
  return getStage(slug) === 'mastered';
}

export function getReadCount(): number {
  return Object.keys(loadProgress().articlesRead).length;
}

export function getCompletedCount(): number {
  return Object.values(loadProgress().articlesRead).filter(
    (article) => article.stage === 'mastered',
  ).length;
}

export function getModuleProgress(articleSlugs: string[]): {
  read: number;
  checked: number;
  practiced: number;
  mastered: number;
  total: number;
} {
  const progress = loadProgress();
  let read = 0;
  let checked = 0;
  let practiced = 0;
  let mastered = 0;

  for (const slug of articleSlugs) {
    const stage = progress.articlesRead[slug]?.stage;
    if (stage === undefined) continue;
    read += 1;
    if (stageAtLeast(stage, 'checked')) checked += 1;
    if (stageAtLeast(stage, 'practiced')) practiced += 1;
    if (stage === 'mastered') mastered += 1;
  }

  return { read, checked, practiced, mastered, total: articleSlugs.length };
}

export function markArticleCompleted(slug: string, completed: boolean): void {
  if (completed) {
    markArticleMastered(slug);
    return;
  }
  markArticleRead(slug);
}

export function resetProgress(): void {
  getStorage()?.removeItem(STORAGE_KEY);
}
