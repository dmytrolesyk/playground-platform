type ReviewFlagState = 'idle' | 'submitting' | 'success' | 'error' | 'already-flagged';

const DATA_STATE = 'state';
const DATA_ARTICLE_ID = 'articleId';
const DATA_FLAG_REVIEW_BOUND = 'flagReviewBound';

function updateFlagReviewUi(
  container: HTMLElement,
  button: HTMLButtonElement,
  status: HTMLElement,
  state: ReviewFlagState,
): void {
  container.dataset[DATA_STATE] = state;

  switch (state) {
    case 'idle':
      button.disabled = false;
      button.textContent = '🚩 Flag for Review';
      status.textContent = 'Notice something unclear? Flag this article for review.';
      break;
    case 'submitting':
      button.disabled = true;
      button.textContent = '🚩 Flagging...';
      status.textContent = 'Submitting review flag...';
      break;
    case 'success':
      button.disabled = true;
      button.textContent = '✅ Flagged';
      status.textContent = 'Thanks! This article has been flagged for review.';
      break;
    case 'already-flagged':
      button.disabled = true;
      button.textContent = '✅ Already Flagged';
      status.textContent = 'This article is already flagged for review.';
      break;
    case 'error':
      button.disabled = false;
      button.textContent = '🚩 Flag for Review';
      status.textContent = 'Failed to flag. Try again later.';
      break;
    default:
      state satisfies never;
  }
}

export function initFlagReview(): void {
  const container = document.getElementById('flag-for-review');
  if (!(container instanceof HTMLElement)) return;

  const articleId = container.dataset[DATA_ARTICLE_ID];
  if (!articleId) return;

  const button = document.getElementById('flag-review-btn');
  const status = document.getElementById('flag-review-status');
  if (!(button instanceof HTMLButtonElement && status instanceof HTMLElement)) return;

  const flagKey = `review-flag:${articleId}`;
  if (localStorage.getItem(flagKey)) {
    updateFlagReviewUi(container, button, status, 'already-flagged');
    return;
  }

  if (container.dataset[DATA_FLAG_REVIEW_BOUND] === 'true') {
    return;
  }

  updateFlagReviewUi(container, button, status, 'idle');
  container.dataset[DATA_FLAG_REVIEW_BOUND] = 'true';

  button.addEventListener('click', async () => {
    updateFlagReviewUi(container, button, status, 'submitting');

    try {
      const reason = prompt('Optional: describe the issue (or leave blank)');
      const response = await fetch('/api/flag-article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articleId,
          reason: reason || undefined,
        }),
      });

      if (!response.ok) {
        updateFlagReviewUi(container, button, status, 'error');
        return;
      }

      localStorage.setItem(flagKey, new Date().toISOString());
      updateFlagReviewUi(container, button, status, 'success');
    } catch {
      updateFlagReviewUi(container, button, status, 'error');
    }
  });
}
