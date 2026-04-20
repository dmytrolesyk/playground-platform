import { createSignal, type JSX } from 'solid-js';
import { useDesktop } from '../../store/context';
import { type ArchNode, LAYERS, NODES } from './architecture-data';
import { ExplorerCanvas } from './ExplorerCanvas';
import { ExplorerPanel } from './ExplorerPanel';
import { LayerToggle } from './LayerToggle';
import './styles/architecture-explorer.css';

export function ArchitectureExplorer(): JSX.Element {
  const [, actions] = useDesktop();
  const [selectedNodeId, setSelectedNodeId] = createSignal<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = createSignal<string | null>(null);
  const [visibleLayers, setVisibleLayers] = createSignal<Set<string>>(
    new Set(LAYERS.filter((l) => l.defaultVisible).map((l) => l.id)),
  );

  const selectedNode = (): ArchNode | null => {
    const id = selectedNodeId();
    if (!id) return null;
    return NODES.find((n) => n.id === id) ?? null;
  };

  const handleToggleLayer = (layerId: string): void => {
    setVisibleLayers((prev) => {
      const next = new Set(prev);
      if (next.has(layerId)) {
        next.delete(layerId);
      } else {
        next.add(layerId);
      }
      return next;
    });
  };

  const handleOpenInLibrary = (slug: string): void => {
    actions.openWindow('library', { initialUrl: `/learn/${slug}` });
  };

  return (
    <div class="arch-explorer">
      <LayerToggle visibleLayers={visibleLayers()} onToggle={handleToggleLayer} />
      <div style={{ position: 'relative', flex: '1', overflow: 'hidden' }}>
        <ExplorerCanvas
          selectedNodeId={selectedNodeId()}
          hoveredNodeId={hoveredNodeId()}
          visibleLayers={visibleLayers()}
          onSelectNode={setSelectedNodeId}
          onHoverNode={setHoveredNodeId}
        />
        <ExplorerPanel
          node={selectedNode}
          onClose={() => setSelectedNodeId(null)}
          onOpenInLibrary={handleOpenInLibrary}
        />
      </div>
    </div>
  );
}
