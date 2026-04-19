import { createSignal, type JSX, onMount } from 'solid-js';
import './styles/browser-app.css';

interface CvSection {
  slug: string;
  title: string;
  html: string;
}

function loadCvData(): CvSection[] {
  const el = document.getElementById('cv-data');
  if (!el?.textContent) return [];
  try {
    return JSON.parse(el.textContent) as CvSection[];
  } catch {
    return [];
  }
}

export function BrowserApp(): JSX.Element {
  const [sections, setSections] = createSignal<CvSection[]>([]);

  onMount(() => {
    setSections(loadCvData());
  });

  return (
    <div class="browser-app">
      {/* Toolbar */}
      <div class="browser-toolbar">
        <div class="browser-toolbar__buttons">
          <button type="button" disabled={true}>
            ← Back
          </button>
          <button type="button" disabled={true}>
            → Fwd
          </button>
          <button type="button" disabled={true}>
            ↻ Reload
          </button>
          <button type="button" disabled={true}>
            🏠 Home
          </button>
        </div>
        <div class="browser-toolbar__address">
          <span class="browser-toolbar__label">Address</span>
          <input
            type="text"
            value="http://cv.local/dmytro-lesyk"
            readOnly={true}
            class="browser-toolbar__input"
          />
        </div>
      </div>

      {/* Content viewport */}
      <div class="browser-viewport">
        {sections().length === 0 ? (
          <p style={{ padding: '16px', color: '#808080' }}>Loading CV content...</p>
        ) : (
          sections().map((section: CvSection) => (
            <div class="browser-section" innerHTML={section.html} />
          ))
        )}
      </div>

      {/* Status bar */}
      <div class="status-bar">
        <p class="status-bar-field">Document: Done</p>
      </div>
    </div>
  );
}
