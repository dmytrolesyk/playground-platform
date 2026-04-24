/**
 * InteractiveExercise — CodeMirror 6 in-page code editor for `code` exercises.
 *
 * Lazy-loads CodeMirror to keep the main bundle small (~50-100KB modular).
 * Falls back to a <textarea> if CodeMirror fails to load.
 *
 * Features:
 * - Syntax-highlighted editor with starter code
 * - "Check" button for Tier 1 pattern-based validation
 * - "Show solution" toggle to reveal the correct answer
 * - "Reset" to restore starter code
 */

import { type Component, createSignal, type JSX, onCleanup, onMount, Show } from 'solid-js';
import {
  type TestCase,
  type ValidationResult,
  validateCode,
} from '../../utils/code-exercise-validation';

// ── Types ───────────────────────────────────────────────────────────

interface Props {
  starterCode: string;
  solution: string;
  testCases: TestCase[];
  language: 'typescript' | 'javascript' | 'python' | 'html' | 'css';
  question: string;
  hint?: string | undefined;
  answer: string;
}

type EditorView = import('@codemirror/view').EditorView;

// ── Language loading ────────────────────────────────────────────────

type LanguageSupport = import('@codemirror/language').LanguageSupport;

async function loadLanguageExtension(
  lang: Props['language'],
): Promise<LanguageSupport | undefined> {
  switch (lang) {
    case 'typescript': {
      const { javascript } = await import('@codemirror/lang-javascript');
      return javascript({ typescript: true });
    }
    case 'javascript': {
      const { javascript } = await import('@codemirror/lang-javascript');
      return javascript();
    }
    case 'python': {
      const { python } = await import('@codemirror/lang-python');
      return python();
    }
    case 'html': {
      const { html } = await import('@codemirror/lang-html');
      return html();
    }
    case 'css': {
      const { css } = await import('@codemirror/lang-css');
      return css();
    }
    default:
      return undefined;
  }
}

// ── Component ───────────────────────────────────────────────────────

const InteractiveExercise: Component<Props> = (props: Props): JSX.Element => {
  let editorContainer: HTMLDivElement | undefined;
  let editorView: EditorView | undefined;

  const [cmLoaded, setCmLoaded] = createSignal(false);
  const [cmFailed, setCmFailed] = createSignal(false);
  const [fallbackCode, setFallbackCode] = createSignal(props.starterCode);
  const [showSolution, setShowSolution] = createSignal(false);
  const [validationResult, setValidationResult] = createSignal<ValidationResult | null>(null);

  // ── CodeMirror initialization ───────────────────────────────────

  onMount(() => {
    (async () => {
      if (!editorContainer) return;

      try {
        const [
          { EditorView, lineNumbers, highlightActiveLine, drawSelection },
          { EditorState },
          { basicSetup },
          langExt,
        ] = await Promise.all([
          import('@codemirror/view'),
          import('@codemirror/state'),
          import('codemirror'),
          loadLanguageExtension(props.language),
        ]);

        const extensions = [
          basicSetup,
          lineNumbers(),
          highlightActiveLine(),
          drawSelection(),
          EditorView.theme({
            '&': {
              fontSize: '14px',
              border: '1px solid #d0d0c8',
              borderRadius: '3px',
            },
            '.cm-content': {
              fontFamily: '"Courier New", Courier, monospace',
              minHeight: '120px',
            },
            '.cm-gutters': {
              backgroundColor: '#f5f5f0',
              borderRight: '1px solid #d0d0c8',
            },
            '&.cm-focused': {
              outline: '2px solid #008080',
            },
          }),
        ];

        if (langExt) {
          extensions.push(langExt);
        }

        editorView = new EditorView({
          state: EditorState.create({
            doc: props.starterCode,
            extensions,
          }),
          parent: editorContainer,
        });

        setCmLoaded(true);
      } catch {
        setCmFailed(true);
      }
    })().catch(() => {
      /* CodeMirror load failure handled by setCmFailed */
    });
  });

  onCleanup(() => {
    if (editorView) {
      editorView.destroy();
      editorView = undefined;
    }
  });

  // ── Helpers ─────────────────────────────────────────────────────

  function getCode(): string {
    if (editorView) {
      return editorView.state.doc.toString();
    }
    return fallbackCode();
  }

  function setCode(code: string): void {
    if (editorView) {
      editorView.dispatch({
        changes: {
          from: 0,
          to: editorView.state.doc.length,
          insert: code,
        },
      });
    } else {
      setFallbackCode(code);
    }
  }

  function handleCheck(): void {
    const code = getCode();
    const result = validateCode(code, props.solution, props.testCases);
    setValidationResult(result);
  }

  function handleReset(): void {
    setCode(props.starterCode);
    setValidationResult(null);
  }

  function toggleSolution(): void {
    setShowSolution((prev) => !prev);
  }

  // ── Render ────────────────────────────────────────────────────────

  return (
    <div class="code-exercise">
      {/* Editor area */}
      <div class="code-exercise__editor-wrapper">
        <Show when={!cmFailed()}>
          <div
            ref={editorContainer}
            class="code-exercise__editor"
            data-testid="code-exercise-editor"
          />
        </Show>

        {/* Fallback textarea when CodeMirror fails */}
        <Show when={cmFailed()}>
          <textarea
            class="code-exercise__fallback"
            value={fallbackCode()}
            onInput={(e: InputEvent & { currentTarget: HTMLTextAreaElement }) =>
              setFallbackCode(e.currentTarget.value)
            }
            rows={12}
            spellcheck={false}
            data-testid="code-exercise-fallback"
          />
        </Show>

        {/* Loading state before CodeMirror mounts */}
        <Show when={!(cmLoaded() || cmFailed())}>
          <div class="code-exercise__loading">Loading editor…</div>
        </Show>
      </div>

      {/* Action buttons */}
      <div class="code-exercise__actions">
        <button
          type="button"
          class="code-exercise__btn code-exercise__btn--check"
          onClick={handleCheck}
          data-testid="code-exercise-check"
        >
          ▶ Check
        </button>
        <button
          type="button"
          class="code-exercise__btn code-exercise__btn--reset"
          onClick={handleReset}
          data-testid="code-exercise-reset"
        >
          ↺ Reset
        </button>
        <button
          type="button"
          class="code-exercise__btn code-exercise__btn--solution"
          onClick={toggleSolution}
          data-testid="code-exercise-show-solution"
        >
          {showSolution() ? '🙈 Hide Solution' : '👁 Show Solution'}
        </button>
      </div>

      {/* Validation result */}
      <Show when={validationResult()}>
        {(result: () => ValidationResult) => (
          <div
            class={`code-exercise__result ${result().passed ? 'code-exercise__result--pass' : 'code-exercise__result--fail'}`}
            data-testid="code-exercise-result"
          >
            <p class="code-exercise__result-message">
              {result().passed ? '✅' : '❌'} {result().message}
            </p>
            <Show when={result().details.length > 0}>
              <ul class="code-exercise__result-details">
                {result().details.map((d) => (
                  <li>{d}</li>
                ))}
              </ul>
            </Show>
          </div>
        )}
      </Show>

      {/* Solution reveal */}
      <Show when={showSolution()}>
        <div class="code-exercise__solution" data-testid="code-exercise-solution">
          <p class="code-exercise__solution-label">Solution:</p>
          <pre class="code-exercise__solution-code">{props.solution}</pre>
          <div class="code-exercise__solution-explanation">
            <p>{props.answer}</p>
          </div>
        </div>
      </Show>
    </div>
  );
};

export default InteractiveExercise;
