import { describe, expect, it } from 'vitest';
import { findMissingDefinitions, runTestCases, validateCode } from './code-exercise-validation';

describe('findMissingDefinitions', () => {
  it('returns empty array when all definitions are present', () => {
    const code = 'function add(a, b) { return a + b; }';
    const solution = 'function add(a, b) { return a + b; }';
    expect(findMissingDefinitions(code, solution)).toEqual([]);
  });

  it('detects missing function definitions', () => {
    const code = '// empty';
    const solution = 'function memoize(fn) { return fn; }';
    expect(findMissingDefinitions(code, solution)).toEqual(['memoize']);
  });

  it('detects missing const/let/var definitions', () => {
    const code = '// empty';
    const solution = 'const add = (a, b) => a + b;';
    expect(findMissingDefinitions(code, solution)).toEqual(['add']);
  });

  it('handles multiple definitions', () => {
    const code = 'function foo() {}';
    const solution = 'function foo() {}\nfunction bar() {}\nconst baz = 1;';
    const missing = findMissingDefinitions(code, solution);
    expect(missing).toContain('bar');
    expect(missing).toContain('baz');
    expect(missing).not.toContain('foo');
  });

  it('returns empty array when solution has no named definitions', () => {
    const code = '42;';
    const solution = '42;';
    expect(findMissingDefinitions(code, solution)).toEqual([]);
  });
});

describe('runTestCases', () => {
  it('returns all passed for valid code', () => {
    const code = 'function add(a, b) { return a + b; }';
    const testCases = [
      { input: 'add(1, 2);', expected: '3' },
      { input: 'add(0, 0);', expected: '0' },
    ];
    const result = runTestCases(code, testCases);
    expect(result.passedTests).toBe(2);
    expect(result.details).toHaveLength(2);
    expect(result.details[0]).toContain('✅');
    expect(result.details[1]).toContain('✅');
  });

  it('reports failures for code with syntax errors', () => {
    const code = 'function add(a, b { return a + b; }'; // syntax error
    const testCases = [{ input: 'add(1, 2);', expected: '3' }];
    const result = runTestCases(code, testCases);
    expect(result.passedTests).toBe(0);
    expect(result.details[0]).toContain('❌');
  });

  it('reports failures for code with runtime errors', () => {
    const code = 'function add(a, b) { throw new Error("boom"); }';
    const testCases = [{ input: 'add(1, 2);', expected: '3' }];
    const result = runTestCases(code, testCases);
    expect(result.passedTests).toBe(0);
    expect(result.details[0]).toContain('boom');
  });

  it('handles mixed pass/fail', () => {
    const code = 'function greet(name) { if (!name) throw new Error("no name"); return name; }';
    const testCases = [
      { input: 'greet("hi");', expected: 'hi' },
      { input: 'greet();', expected: 'should fail' },
    ];
    const result = runTestCases(code, testCases);
    expect(result.passedTests).toBe(1);
    expect(result.details[0]).toContain('✅');
    expect(result.details[1]).toContain('❌');
  });

  it('returns empty details for empty test cases', () => {
    const result = runTestCases('const x = 1;', []);
    expect(result.passedTests).toBe(0);
    expect(result.details).toEqual([]);
  });
});

describe('validateCode', () => {
  const solution = 'function add(a, b) { return a + b; }';

  it('fails for empty code', () => {
    const result = validateCode('', solution, []);
    expect(result.passed).toBe(false);
    expect(result.message).toBe('No code written yet.');
  });

  it('fails for whitespace-only code', () => {
    const result = validateCode('   \n  ', solution, []);
    expect(result.passed).toBe(false);
    expect(result.message).toBe('No code written yet.');
  });

  it('passes when all definitions present and no test cases', () => {
    const code = 'function add(a, b) { return a + b; }';
    const result = validateCode(code, solution, []);
    expect(result.passed).toBe(true);
    expect(result.message).toContain('Code structure looks correct');
  });

  it('fails when definitions are missing and no test cases', () => {
    const code = '// nothing here';
    const result = validateCode(code, solution, []);
    expect(result.passed).toBe(false);
    expect(result.message).toContain('missing');
    expect(result.details).toContain('Missing definition: add');
  });

  it('passes when all test cases pass', () => {
    const code = 'function add(a, b) { return a + b; }';
    const testCases = [
      { input: 'add(1, 2);', expected: '3' },
      { input: 'add(0, 0);', expected: '0' },
    ];
    const result = validateCode(code, solution, testCases);
    expect(result.passed).toBe(true);
    expect(result.message).toBe('All 2 test(s) passed!');
  });

  it('fails when some test cases fail', () => {
    const code = 'function add(a, b) { throw new Error("nope"); }';
    const testCases = [{ input: 'add(1, 2);', expected: '3' }];
    const result = validateCode(code, solution, testCases);
    expect(result.passed).toBe(false);
    expect(result.message).toBe('0/1 test(s) passed.');
  });

  it('includes missing definition details alongside test results', () => {
    // Code defines a different function name
    const code = 'function sum(a, b) { return a + b; }';
    const testCases = [{ input: 'sum(1, 2);', expected: '3' }];
    const result = validateCode(code, solution, testCases);
    // Test passes (sum works), but add is missing
    expect(result.details.some((d) => d.includes('Missing definition: add'))).toBe(true);
  });
});
