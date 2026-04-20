import { type Accessor, type JSX, Show } from 'solid-js';
import type { ArchNode } from './architecture-data';

interface ExplorerPanelProps {
  node: Accessor<ArchNode | null>;
  onClose: () => void;
  onOpenInLibrary: (slug: string) => void;
}

export function ExplorerPanel(props: ExplorerPanelProps): JSX.Element {
  return (
    <Show when={props.node()}>
      {(node: () => ArchNode) => (
        <div class="arch-explorer__panel">
          <button
            type="button"
            class="arch-explorer__panel-close"
            onClick={props.onClose}
            aria-label="Close panel"
          >
            ×
          </button>
          <h3>{node().label}</h3>
          <p>{node().description}</p>

          <Show when={node().sourceFiles} keyed={true}>
            {(files: string[]) => (
              <>
                <strong>Source files:</strong>
                <ul>
                  {files.map((f: string) => (
                    <li>
                      <code>{f}</code>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </Show>

          <Show when={node().knowledgeSlug} keyed={true}>
            {(slug: string) => (
              <button type="button" onClick={() => props.onOpenInLibrary(slug)}>
                📖 Read Full Article
              </button>
            )}
          </Show>
        </div>
      )}
    </Show>
  );
}
