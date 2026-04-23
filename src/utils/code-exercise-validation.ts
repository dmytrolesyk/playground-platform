/**
 * Code exercise validation — Tier 1 pattern-based checks.
 *
 * Runs entirely in the browser, no server calls.
 * Checks structure (expected definitions) and executes test cases via new Function().
 */

export interface TestCase {
  input: string;
  expected: string;
}

export interface ValidationResult {
  passed: boolean;
  message: string;
  details: string[];
}

/**
 * Extract function/variable names defined in the solution and return
 * any that are missing from the user's code.
 */
export function findMissingDefinitions(code: string, solution: string): string[] {
  const solutionFunctions = [
    ...solution.matchAll(/(?:function\s+(\w+)|(?:const|let|var)\s+(\w+)\s*=)/g),
  ]
    .map((m) => m[1] ?? m[2])
    .filter((name): name is string => name !== undefined);

  return solutionFunctions.filter(
    (name) => !new RegExp(`(?:function\\s+${name}|(?:const|let|var)\\s+${name}\\s*=)`).test(code),
  );
}

/**
 * Run test cases by wrapping user code + test input in a `new Function()`.
 * Returns how many passed and per-test detail strings.
 */
export function runTestCases(
  code: string,
  testCases: TestCase[],
): { passedTests: number; details: string[] } {
  const details: string[] = [];
  let passedTests = 0;

  for (const testCase of testCases) {
    try {
      const wrapped = `${code}\n;\n${testCase.input}`;
      const fn = new Function(wrapped);
      fn();
      passedTests++;
      details.push(`✅ Test passed: ${testCase.input.slice(0, 60)}…`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      details.push(`❌ Test failed: ${testCase.input.slice(0, 60)}… — ${msg}`);
    }
  }

  return { passedTests, details };
}

/**
 * Validate user code against the expected solution.
 *
 * Checks:
 * 1. Code is non-empty
 * 2. Expected function/variable definitions exist
 * 3. Test cases execute without errors (if any test cases provided)
 */
export function validateCode(
  code: string,
  solution: string,
  testCases: TestCase[],
): ValidationResult {
  const trimmedCode = code.trim();

  if (!trimmedCode) {
    return { passed: false, message: 'No code written yet.', details: [] };
  }

  const missingDefinitions = findMissingDefinitions(trimmedCode, solution.trim());
  const details: string[] = missingDefinitions.map((name) => `Missing definition: ${name}`);

  if (testCases.length > 0) {
    const testResult = runTestCases(trimmedCode, testCases);
    details.push(...testResult.details);

    return testResult.passedTests === testCases.length
      ? { passed: true, message: `All ${testCases.length} test(s) passed!`, details }
      : {
          passed: false,
          message: `${testResult.passedTests}/${testCases.length} test(s) passed.`,
          details,
        };
  }

  if (missingDefinitions.length === 0) {
    return {
      passed: true,
      message: 'Code structure looks correct! Compare with the solution to verify.',
      details: ['All expected definitions found.'],
    };
  }

  return { passed: false, message: 'Some definitions are missing. Check the hints.', details };
}
