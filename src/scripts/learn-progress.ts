// src/scripts/learn-progress.ts

interface ArticleProgress {
  firstRead: string;
  lastRead: string;
  completed: boolean;
}

interface LearningProgress {
  articlesRead: Record<string, ArticleProgress>;
  modulesCompleted: string[];
}

const STORAGE_KEY = 'kb-learning-progress';

function loadProgress(): LearningProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as LearningProgress;
  } catch {
    /* ignore corrupt data */
  }
  return { articlesRead: {}, modulesCompleted: [] };
}

function saveProgress(progress: LearningProgress): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

export function markArticleRead(slug: string): void {
  const progress = loadProgress();
  const now = new Date().toISOString();
  const existing = progress.articlesRead[slug];
  progress.articlesRead[slug] = {
    firstRead: existing?.firstRead ?? now,
    lastRead: now,
    completed: existing?.completed ?? false,
  };
  saveProgress(progress);
}

export function markArticleCompleted(slug: string, completed: boolean): void {
  const progress = loadProgress();
  const now = new Date().toISOString();
  const existing = progress.articlesRead[slug];
  progress.articlesRead[slug] = {
    firstRead: existing?.firstRead ?? now,
    lastRead: now,
    completed,
  };
  saveProgress(progress);
}

export function getProgress(): LearningProgress {
  return loadProgress();
}

export function isArticleRead(slug: string): boolean {
  return slug in loadProgress().articlesRead;
}

export function isArticleCompleted(slug: string): boolean {
  return loadProgress().articlesRead[slug]?.completed ?? false;
}

export function getReadCount(): number {
  return Object.keys(loadProgress().articlesRead).length;
}

export function getCompletedCount(): number {
  return Object.values(loadProgress().articlesRead).filter((a) => a.completed).length;
}

export function getModuleProgress(articleSlugs: string[]): {
  read: number;
  completed: number;
  total: number;
} {
  const progress = loadProgress();
  let read = 0;
  let completed = 0;
  for (const slug of articleSlugs) {
    const entry = progress.articlesRead[slug];
    if (entry) {
      read++;
      if (entry.completed) completed++;
    }
  }
  return { read, completed, total: articleSlugs.length };
}

export function resetProgress(): void {
  localStorage.removeItem(STORAGE_KEY);
}
