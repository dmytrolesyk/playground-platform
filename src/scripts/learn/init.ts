import { initArticleProgress } from './article-progress';
import { initFlagReview } from './flag-review';
import { initIndexProgress } from './index-progress';
import { initMermaid } from './mermaid';

export async function initLearnEnhancements(): Promise<void> {
  initArticleProgress();
  initIndexProgress();
  initFlagReview();
  await initMermaid();
}
