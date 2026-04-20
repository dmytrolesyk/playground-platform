import type { JSX } from 'solid-js';

interface LibraryToolbarProps {
  url: string;
  onBack: () => void;
  onForward: () => void;
  onReload: () => void;
  onToggleIndex: () => void;
  onNewTab: () => void;
  canGoBack: boolean;
  canGoForward: boolean;
}

export function LibraryToolbar(props: LibraryToolbarProps): JSX.Element {
  return (
    <div class="library-toolbar">
      <div class="library-toolbar__buttons">
        <button type="button" disabled={!props.canGoBack} onClick={props.onBack}>
          ← Back
        </button>
        <button type="button" disabled={!props.canGoForward} onClick={props.onForward}>
          → Fwd
        </button>
        <button type="button" onClick={props.onReload}>
          ↻ Reload
        </button>
        <button type="button" onClick={props.onToggleIndex}>
          📖 Index
        </button>
        <button type="button" onClick={props.onNewTab}>
          🔗 New Tab
        </button>
      </div>
      <div class="library-toolbar__address">
        <span class="library-toolbar__label">Address</span>
        <input type="text" value={props.url} readOnly={true} class="library-toolbar__input" />
      </div>
    </div>
  );
}
