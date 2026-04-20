import { createSignal, type JSX, onMount } from 'solid-js';
import { type CvSection, loadCvData } from './cv-data';
import './styles/browser-app.css';

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
        {/* Photo and header */}
        <div class="browser-header">
          <img src="/images/photo.jpg" alt="Dmytro Lesyk" class="browser-header__photo" />
          <div class="browser-header__info">
            <h1 class="browser-header__name">Dmytro Lesyk</h1>
            <p class="browser-header__title">Frontend Engineer · Kyiv, Ukraine</p>
            <p class="browser-header__contact">
              dmitriylesik@gmail.com ·{' '}
              <a
                href="https://linkedin.com/in/dmytro-lesyk-961599139/"
                target="_blank"
                rel="noopener noreferrer"
              >
                LinkedIn
              </a>
            </p>
          </div>
        </div>

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
