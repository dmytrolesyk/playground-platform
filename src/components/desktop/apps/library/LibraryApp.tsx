import { createEffect, createSignal, type JSX, on, Show, untrack } from 'solid-js';
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
  let pendingIframeUrl: string | undefined;

  const normalizeUrl = (url: string): string => {
    try {
      const parsed = new URL(url, window.location.origin);
      if (parsed.origin !== window.location.origin) return url;
      return `${parsed.pathname}${parsed.search}${parsed.hash}`;
    } catch {
      return url;
    }
  };

  const replaceCurrentUrl = (url: string): void => {
    const nextUrl = normalizeUrl(url);
    setHistory((entries) => {
      const nextEntries = [...entries];
      nextEntries[historyIndex()] = nextUrl;
      return nextEntries;
    });
    setCurrentUrl(nextUrl);
  };

  const navigateTo = (url: string): void => {
    const nextUrl = normalizeUrl(url);
    const currentHistory = history();
    const currentIndex = historyIndex();

    if (currentHistory[currentIndex] === nextUrl) {
      setCurrentUrl(nextUrl);
      setShowIndex(false);
      return;
    }

    pendingIframeUrl = nextUrl;
    const newHistory = [...currentHistory.slice(0, currentIndex + 1), nextUrl];
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setCurrentUrl(nextUrl);
    setShowIndex(false);
  };

  const handleBack = (): void => {
    if (historyIndex() > 0) {
      const newIndex = historyIndex() - 1;
      setHistoryIndex(newIndex);
      const url = history()[newIndex];
      if (url) {
        pendingIframeUrl = url;
        setCurrentUrl(url);
      }
    }
  };

  const handleForward = (): void => {
    if (historyIndex() < history().length - 1) {
      const newIndex = historyIndex() + 1;
      setHistoryIndex(newIndex);
      const url = history()[newIndex];
      if (url) {
        pendingIframeUrl = url;
        setCurrentUrl(url);
      }
    }
  };

  const handleReload = (): void => {
    if (iframeRef) {
      pendingIframeUrl = currentUrl();
      iframeRef.src = currentUrl();
    }
  };

  const handleNewTab = (): void => {
    window.open(currentUrl(), '_blank');
  };

  const handleTreeSelect = (slug: string): void => {
    navigateTo(`/learn/${slug}`);
  };

  const handleIframeLoad = (): void => {
    try {
      const location = iframeRef?.contentWindow?.location;
      if (!location || location.origin !== window.location.origin) return;

      const loadedUrl = `${location.pathname}${location.search}${location.hash}`;
      if (pendingIframeUrl) {
        pendingIframeUrl = undefined;
        if (loadedUrl !== currentUrl()) {
          replaceCurrentUrl(loadedUrl);
        }
        return;
      }

      if (loadedUrl !== currentUrl()) {
        navigateTo(loadedUrl);
        pendingIframeUrl = undefined;
      }
    } catch {
      // Cross-origin iframe navigation is not expected, but browser security can block inspection.
    }
  };

  createEffect(
    on(
      () => props.initialUrl,
      (initialUrl) => {
        if (initialUrl) {
          untrack(() => navigateTo(initialUrl));
        }
      },
      { defer: true },
    ),
  );

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
            <iframe
              ref={iframeRef}
              src={currentUrl()}
              title="Knowledge Base"
              onLoad={handleIframeLoad}
            />
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
