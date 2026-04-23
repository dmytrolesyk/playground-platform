import { createSignal, type JSX, Show } from 'solid-js';
import './styles/github-notifier-app.css';

const EMBED_URL = 'https://swe-school.dmytrolesyk.dev/embed/subscribe';

export function GithubNotifierApp(): JSX.Element {
  const [iframeVersion, setIframeVersion] = createSignal('initial');
  const [loaded, setLoaded] = createSignal(false);

  const handleReload = (): void => {
    setLoaded(false);
    setIframeVersion(String(Date.now()));
  };

  const handleOpenInBrowser = (): void => {
    window.open(EMBED_URL, '_blank', 'noopener,noreferrer');
  };

  return (
    <div class="github-notifier-app">
      <div class="github-notifier-toolbar">
        <div class="github-notifier-toolbar__buttons">
          <button type="button" onClick={handleReload}>
            ↻ Reload
          </button>
          <button type="button" onClick={handleOpenInBrowser}>
            🔗 Open in Browser
          </button>
        </div>

        <div class="github-notifier-toolbar__address">
          <span class="github-notifier-toolbar__label">Address</span>
          <input
            type="text"
            value={EMBED_URL}
            readOnly={true}
            class="github-notifier-toolbar__input"
          />
        </div>
      </div>

      <div class="github-notifier-viewport">
        <Show when={!loaded()}>
          <div class="github-notifier-viewport__loading">Loading Github Notifier...</div>
        </Show>

        <Show when={iframeVersion()} keyed={true}>
          <iframe
            src={EMBED_URL}
            title="Github Notifier"
            class="github-notifier-viewport__frame"
            onLoad={() => setLoaded(true)}
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </Show>
      </div>

      <div class="status-bar">
        <p class="status-bar-field">{loaded() ? 'Remote app ready' : 'Loading remote app...'}</p>
      </div>
    </div>
  );
}
