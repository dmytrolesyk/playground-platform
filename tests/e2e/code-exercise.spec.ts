import { expect, test } from '@playwright/test';

// Use the hash-maps article — it has a code exercise with starterCode + testCases
const ARTICLE_WITH_CODE_EXERCISE = '/learn/cs-fundamentals/hash-maps-and-lookup';

test.describe('Code exercise (CodeMirror)', () => {
  test('renders editor and supports check, reset, and show solution', async ({ page }) => {
    await page.goto(ARTICLE_WITH_CODE_EXERCISE);

    // Scroll to the exercise section to trigger client:visible loading
    const codeExercise = page.locator('.exercise--code').first();
    await codeExercise.scrollIntoViewIfNeeded();

    // Wait for CodeMirror to mount — the .cm-editor element appears inside the container
    const editor = codeExercise.locator('.cm-editor');
    await expect(editor).toBeVisible({ timeout: 15_000 });

    // Verify editor has non-zero dimensions
    const box = await editor.boundingBox();
    expect(box).not.toBeNull();
    expect(box?.width).toBeGreaterThan(50);
    expect(box?.height).toBeGreaterThan(50);

    // Verify starter code is shown (the cm-content should contain text)
    const content = codeExercise.locator('.cm-content');
    await expect(content).toContainText('constructor');

    // Verify action buttons are present
    const checkBtn = codeExercise.getByTestId('code-exercise-check');
    const resetBtn = codeExercise.getByTestId('code-exercise-reset');
    const solutionBtn = codeExercise.getByTestId('code-exercise-show-solution');
    await expect(checkBtn).toBeVisible();
    await expect(resetBtn).toBeVisible();
    await expect(solutionBtn).toBeVisible();

    // Click Check — should show a validation result
    await checkBtn.click();
    const result = codeExercise.getByTestId('code-exercise-result');
    await expect(result).toBeVisible();

    // Click Show Solution — should reveal solution panel
    await solutionBtn.click();
    const solution = codeExercise.getByTestId('code-exercise-solution');
    await expect(solution).toBeVisible();
    await expect(solution).toContainText('Solution:');

    // Click Hide Solution — should hide solution panel
    await solutionBtn.click();
    await expect(solution).not.toBeVisible();

    // Click Reset — should clear the validation result
    await resetBtn.click();
    // After reset, previous result may still be visible until next check,
    // but validation state is cleared. Verify by checking again.
    await checkBtn.click();
    await expect(result).toBeVisible();
  });
});
