import type { MasteryStage } from '@playground/knowledge-engine/progress';
import {
  getStage,
  markArticleChecked,
  markArticleMastered,
  markArticlePracticed,
  markArticleRead,
} from '@playground/knowledge-engine/progress';

const DATA_STAGE = 'stage';
const DATA_PROGRESS_STAGE = 'progressStage';
const DATA_PROGRESS_BUTTONS_BOUND = 'progressButtonsBound';
const DATA_PROGRESS_ANSWER_BOUND = 'progressAnswerBound';
const DATA_SLUG = 'slug';

const STAGE_LABELS: Record<MasteryStage, string> = {
  read: 'Read',
  checked: 'Checked',
  practiced: 'Practiced',
  mastered: 'Mastered',
};

const STAGE_ORDER: Record<MasteryStage, number> = {
  read: 0,
  checked: 1,
  practiced: 2,
  mastered: 3,
};

const MASTERY_STAGES = new Set<string>(['read', 'checked', 'practiced', 'mastered']);

function isMasteryStage(value: string | undefined): value is MasteryStage {
  return value !== undefined && MASTERY_STAGES.has(value);
}

function stageAtLeast(stage: MasteryStage, minimum: MasteryStage): boolean {
  return STAGE_ORDER[stage] >= STAGE_ORDER[minimum];
}

function markStage(slug: string, stage: MasteryStage): void {
  switch (stage) {
    case 'read':
      markArticleRead(slug);
      break;
    case 'checked':
      markArticleChecked(slug);
      break;
    case 'practiced':
      markArticlePracticed(slug);
      break;
    case 'mastered':
      markArticleMastered(slug);
      break;
    default:
      stage satisfies never;
  }
}

function updateArticleProgress(root: HTMLElement, slug: string): void {
  const stage = getStage(slug) ?? 'read';
  root.dataset[DATA_STAGE] = stage;

  const stageLabel = root.querySelector<HTMLElement>('.progress-tracker__stage');
  if (stageLabel) {
    stageLabel.textContent = STAGE_LABELS[stage];
  }

  root.querySelectorAll<HTMLButtonElement>('[data-progress-stage]').forEach((button) => {
    const buttonStageRaw = button.dataset[DATA_PROGRESS_STAGE];
    if (!isMasteryStage(buttonStageRaw)) return;
    const buttonStage = buttonStageRaw;

    const isActive = stageAtLeast(stage, buttonStage);
    button.classList.toggle('progress-tracker__btn--active', isActive);
    button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  });
}

function bindStageButtons(root: HTMLElement, slug: string): void {
  if (root.dataset[DATA_PROGRESS_BUTTONS_BOUND] === 'true') {
    return;
  }

  root.dataset[DATA_PROGRESS_BUTTONS_BOUND] = 'true';

  root.querySelectorAll<HTMLButtonElement>('[data-progress-stage]').forEach((button) => {
    button.addEventListener('click', () => {
      const nextStageRaw = button.dataset[DATA_PROGRESS_STAGE];
      if (!isMasteryStage(nextStageRaw)) return;
      const nextStage = nextStageRaw;

      markStage(slug, nextStage);
      updateArticleProgress(root, slug);
    });
  });
}

function bindExerciseAnswers(root: HTMLElement, slug: string): void {
  document.querySelectorAll<HTMLDetailsElement>('.exercise__answer').forEach((details) => {
    if (details.dataset[DATA_PROGRESS_ANSWER_BOUND] === 'true') {
      return;
    }

    details.dataset[DATA_PROGRESS_ANSWER_BOUND] = 'true';
    details.addEventListener('toggle', () => {
      if (!details.open) return;

      markArticleChecked(slug);
      updateArticleProgress(root, slug);
    });
  });
}

export function initArticleProgress(): void {
  const root = document.getElementById('progress-tracker');
  if (!(root instanceof HTMLElement)) return;

  const slug = root.dataset[DATA_SLUG];
  if (!slug) return;

  markArticleRead(slug);
  bindStageButtons(root, slug);
  bindExerciseAnswers(root, slug);
  updateArticleProgress(root, slug);
}
