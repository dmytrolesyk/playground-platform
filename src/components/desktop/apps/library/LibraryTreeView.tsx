import { For, type JSX } from 'solid-js';

export interface KnowledgeIndexEntry {
  id: string;
  title: string;
  category: string;
  summary: string;
}

interface LibraryTreeViewProps {
  entries: KnowledgeIndexEntry[];
  onSelect: (slug: string) => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  architecture: 'Architecture',
  concept: 'Concepts',
  technology: 'Technologies',
  feature: 'Features',
};

const CATEGORY_ORDER = ['architecture', 'concept', 'technology', 'feature'];

export function LibraryTreeView(props: LibraryTreeViewProps): JSX.Element {
  const grouped = (): Record<string, KnowledgeIndexEntry[]> => {
    const groups: Record<string, KnowledgeIndexEntry[]> = {};
    for (const entry of props.entries) {
      const cat = entry.category;
      if (!groups[cat]) {
        groups[cat] = [];
      }
      groups[cat].push(entry);
    }
    return groups;
  };

  return (
    <div class="library-tree">
      <For each={CATEGORY_ORDER}>
        {(cat: string) => {
          const items = grouped()[cat];
          if (items === undefined || items.length === 0) return null;
          return (
            <>
              <div class="library-tree__category">{CATEGORY_LABELS[cat] ?? cat}</div>
              <ul>
                <For each={items}>
                  {(entry: KnowledgeIndexEntry) => (
                    <button
                      type="button"
                      class="library-tree__item"
                      onClick={() => props.onSelect(entry.id)}
                    >
                      {entry.title}
                    </button>
                  )}
                </For>
              </ul>
            </>
          );
        }}
      </For>
    </div>
  );
}
