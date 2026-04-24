import type { MasteryStage } from '@playground/knowledge-engine/progress';
import { getModuleProgress, getProgress } from '@playground/knowledge-engine/progress';

const DATA_MODULE_ARTICLES = 'moduleArticles';

const STAGE_ORDER: Record<MasteryStage, number> = {
  read: 0,
  checked: 1,
  practiced: 2,
  mastered: 3,
};

function stageAtLeast(stage: MasteryStage, minimum: MasteryStage): boolean {
  return STAGE_ORDER[stage] >= STAGE_ORDER[minimum];
}

function progressSummaryText(): string {
  const articles = Object.values(getProgress().articlesRead);
  const read = articles.length;
  let checked = 0;
  let practiced = 0;
  let mastered = 0;

  for (const article of articles) {
    if (stageAtLeast(article.stage, 'checked')) checked += 1;
    if (stageAtLeast(article.stage, 'practiced')) practiced += 1;
    if (article.stage === 'mastered') mastered += 1;
  }

  return `Progress: ${read} read · ${checked} checked · ${practiced} practiced · ${mastered} mastered`;
}

function renderModuleProgress(bar: HTMLElement): void {
  const slugsStr = bar.dataset[DATA_MODULE_ARTICLES];
  if (!slugsStr) return;

  const slugs = slugsStr.split(',').filter(Boolean);
  const moduleProgress = getModuleProgress(slugs);
  const pct = moduleProgress.total > 0 ? (moduleProgress.mastered / moduleProgress.total) * 100 : 0;

  const fill = bar.querySelector<HTMLElement>('.learn-module__progress-fill');
  if (fill) {
    fill.style.width = `${pct}%`;
  }

  const label = bar.parentElement?.querySelector<HTMLElement>('.learn-module__progress-label');
  if (label) {
    label.textContent =
      `${moduleProgress.mastered}/${moduleProgress.total} mastered` +
      ` · ${moduleProgress.read} read` +
      ` · ${moduleProgress.checked} checked` +
      ` · ${moduleProgress.practiced} practiced`;
  }
}

export function initIndexProgress(): void {
  document.querySelectorAll<HTMLElement>('[data-module-articles]').forEach((bar) => {
    renderModuleProgress(bar);
  });

  const summary = document.getElementById('progress-summary');
  if (summary) {
    summary.textContent = progressSummaryText();
  }
}
