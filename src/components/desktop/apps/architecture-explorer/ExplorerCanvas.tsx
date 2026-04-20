import { createSignal, For, type JSX } from 'solid-js';
import { type ArchEdge, type ArchNode, EDGES, NODES } from './architecture-data';
import { ExplorerEdge } from './ExplorerEdge';
import { ExplorerNode } from './ExplorerNode';

interface ExplorerCanvasProps {
  selectedNodeId: string | null;
  hoveredNodeId: string | null;
  visibleLayers: Set<string>;
  onSelectNode: (id: string | null) => void;
  onHoverNode: (id: string | null) => void;
}

const VIEWBOX_W = 1000;
const VIEWBOX_H = 620;

export function ExplorerCanvas(props: ExplorerCanvasProps): JSX.Element {
  const [viewBox, setViewBox] = createSignal({
    x: 0,
    y: 0,
    w: VIEWBOX_W,
    h: VIEWBOX_H,
  });
  let isPanning = false;
  let panStartX = 0;
  let panStartY = 0;
  let panStartVB = { x: 0, y: 0 };

  const nodeMap = (): Map<string, ArchNode> => {
    const map = new Map<string, ArchNode>();
    for (const node of NODES) {
      map.set(node.id, node);
    }
    return map;
  };

  const connectedNodeIds = (): Set<string> => {
    const hovered = props.hoveredNodeId;
    if (!hovered) return new Set<string>();
    const ids = new Set<string>();
    ids.add(hovered);
    for (const edge of EDGES) {
      if (edge.from === hovered) ids.add(edge.to);
      if (edge.to === hovered) ids.add(edge.from);
    }
    return ids;
  };

  const isEdgeHighlighted = (edge: ArchEdge): boolean => {
    const hovered = props.hoveredNodeId;
    if (!hovered) return false;
    return edge.from === hovered || edge.to === hovered;
  };

  const handlePanStart = (e: PointerEvent): void => {
    const target = e.target as SVGElement;
    if (target.tagName !== 'svg' && !target.classList.contains('arch-bg')) {
      return;
    }
    isPanning = true;
    panStartX = e.clientX;
    panStartY = e.clientY;
    panStartVB = { x: viewBox().x, y: viewBox().y };
    (e.currentTarget as SVGElement).setPointerCapture(e.pointerId);
  };

  const handlePanMove = (e: PointerEvent): void => {
    if (!isPanning) return;
    const dx = (e.clientX - panStartX) * (viewBox().w / VIEWBOX_W);
    const dy = (e.clientY - panStartY) * (viewBox().h / VIEWBOX_H);
    setViewBox({
      ...viewBox(),
      x: panStartVB.x - dx,
      y: panStartVB.y - dy,
    });
  };

  const handlePanEnd = (e: PointerEvent): void => {
    isPanning = false;
    (e.currentTarget as SVGElement).releasePointerCapture(e.pointerId);
  };

  const handleWheel = (e: WheelEvent): void => {
    e.preventDefault();
    const scale = e.deltaY > 0 ? 1.1 : 0.9;
    const vb = viewBox();
    const newW = vb.w * scale;
    const newH = vb.h * scale;
    setViewBox({
      x: vb.x + (vb.w - newW) / 2,
      y: vb.y + (vb.h - newH) / 2,
      w: newW,
      h: newH,
    });
  };

  const handleBgClick = (e: MouseEvent): void => {
    if ((e.target as SVGElement).classList.contains('arch-bg')) {
      props.onSelectNode(null);
    }
  };

  return (
    <div class="arch-explorer__canvas">
      <svg
        viewBox={`${viewBox().x} ${viewBox().y} ${viewBox().w} ${viewBox().h}`}
        onPointerDown={handlePanStart}
        onPointerMove={handlePanMove}
        onPointerUp={handlePanEnd}
        onWheel={handleWheel}
        onClick={handleBgClick}
        onKeyDown={(e: KeyboardEvent) => {
          if (e.key === 'Escape') props.onSelectNode(null);
        }}
      >
        <title>Architecture diagram</title>
        <defs>
          <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="#666" />
          </marker>
        </defs>

        {/* Background */}
        <rect
          class="arch-bg"
          x={viewBox().x - 1000}
          y={viewBox().y - 1000}
          width={viewBox().w + 2000}
          height={viewBox().h + 2000}
          fill="#f8f8f6"
        />

        {/* Edges (behind nodes) */}
        <For each={EDGES}>
          {(edge: ArchEdge) => {
            const fromNode = nodeMap().get(edge.from);
            const toNode = nodeMap().get(edge.to);
            if (!(fromNode && toNode)) return null;
            return (
              <ExplorerEdge
                edge={edge}
                fromNode={fromNode}
                toNode={toNode}
                isHighlighted={isEdgeHighlighted(edge)}
                visibleLayers={props.visibleLayers}
              />
            );
          }}
        </For>

        {/* Nodes */}
        <For each={NODES}>
          {(node: ArchNode) => (
            <ExplorerNode
              node={node}
              isSelected={props.selectedNodeId === node.id}
              isHighlighted={connectedNodeIds().has(node.id)}
              onSelect={props.onSelectNode}
              onHover={props.onHoverNode}
            />
          )}
        </For>
      </svg>
    </div>
  );
}
