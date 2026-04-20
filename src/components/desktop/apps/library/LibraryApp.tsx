import { createSignal, type JSX, Show } from 'solid-js';
import { useDesktop } from '../../store/context';
import { LibraryToolbar } from './LibraryToolbar';
import type { KnowledgeIndexEntry } from './LibraryTreeView';
import { LibraryTreeView } from './LibraryTreeView';
import './styles/library-app.css';

function loadKnowledgeIndex(): KnowledgeIndexEntry[] {
  const el = document.getElementById('knowledge-index');
  if (!el?.textContent) return [];
  try {
    return JSON.parse(el.textContent) as KnowledgeIndexEntry[];
  } catch {
    return [];
  }
}

interface LibraryAppProps {
  initialUrl?: string;
}

export function LibraryApp(props: LibraryAppProps): JSX.Element {
  const [state] = useDesktop();

  // On mobile, bypass the iframe and open /learn directly
  if (state.isMobile) {
    window.location.href = props.initialUrl ?? '/learn';
    return <div style={{ padding: '16px' }}>Redirecting to Knowledge Base...</div>;
  }

  const defaultUrl = props.initialUrl ?? '/learn';
  const [currentUrl, setCurrentUrl] = createSignal(defaultUrl);
  const [showIndex, setShowIndex] = createSignal(false);
  const [history, setHistory] = createSignal<string[]>([defaultUrl]);
  const [historyIndex, setHistoryIndex] = createSignal(0);

  const entries = loadKnowledgeIndex();

  let iframeRef: HTMLIFrameElement | undefined;

  const navigateTo = (url: string): void => {
    const newHistory = [...history().slice(0, historyIndex() + 1), url];
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setCurrentUrl(url);
    setShowIndex(false);
  };

  const handleBack = (): void => {
    if (historyIndex() > 0) {
      const newIndex = historyIndex() - 1;
      setHistoryIndex(newIndex);
      const url = history()[newIndex];
      if (url) setCurrentUrl(url);
    }
  };

  const handleForward = (): void => {
    if (historyIndex() < history().length - 1) {
      const newIndex = historyIndex() + 1;
      setHistoryIndex(newIndex);
      const url = history()[newIndex];
      if (url) setCurrentUrl(url);
    }
  };

  const handleReload = (): void => {
    if (iframeRef) {
      iframeRef.src = currentUrl();
    }
  };

  const handleNewTab = (): void => {
    window.open(currentUrl(), '_blank');
  };

  const handleTreeSelect = (slug: string): void => {
    navigateTo(`/learn/${slug}`);
  };

  return (
    <div class="library-app">
      <LibraryToolbar
        url={currentUrl()}
        onBack={handleBack}
        onForward={handleForward}
        onReload={handleReload}
        onToggleIndex={() => setShowIndex((v) => !v)}
        onNewTab={handleNewTab}
        canGoBack={historyIndex() > 0}
        canGoForward={historyIndex() < history().length - 1}
      />

      <Show
        when={showIndex()}
        fallback={
          <div class="library-viewport">
            <iframe ref={iframeRef} src={currentUrl()} title="Knowledge Base" />
          </div>
        }
      >
        <LibraryTreeView entries={entries} onSelect={handleTreeSelect} />
      </Show>

      <div class="status-bar">
        <p class="status-bar-field">Document: Done</p>
      </div>
    </div>
  );
}
