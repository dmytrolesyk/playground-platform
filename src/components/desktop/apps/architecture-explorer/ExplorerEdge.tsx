import type { JSX } from 'solid-js';
import { type ArchEdge, type ArchNode, LAYERS } from './architecture-data';

interface ExplorerEdgeProps {
  edge: ArchEdge;
  fromNode: ArchNode;
  toNode: ArchNode;
  isHighlighted: boolean;
  visibleLayers: Set<string>;
}

export function ExplorerEdge(props: ExplorerEdgeProps): JSX.Element {
  const layer = LAYERS.find((l) => l.edgeType === props.edge.type);

  const visible = (): boolean => {
    if (!layer) return false;
    return props.visibleLayers.has(layer.id);
  };

  const x1 = (): number => props.fromNode.x + props.fromNode.width / 2;
  const y1 = (): number => props.fromNode.y + props.fromNode.height;
  const x2 = (): number => props.toNode.x + props.toNode.width / 2;
  const y2 = (): number => props.toNode.y;

  const opacity = (): number => (props.isHighlighted ? 1 : 0.3);

  return (
    <g style={{ display: visible() ? 'inline' : 'none' }}>
      <line
        x1={x1()}
        y1={y1()}
        x2={x2()}
        y2={y2()}
        stroke={layer?.color ?? '#999'}
        stroke-width={props.isHighlighted ? 2.5 : 1.5}
        stroke-dasharray={props.edge.type === 'lazy-load' ? '6,3' : 'none'}
        opacity={opacity()}
        marker-end="url(#arrowhead)"
      />
      {props.edge.label && props.isHighlighted && (
        <text
          x={(x1() + x2()) / 2}
          y={(y1() + y2()) / 2 - 6}
          text-anchor="middle"
          font-size="10"
          font-family="Arial, Helvetica, sans-serif"
          fill={layer?.color ?? '#999'}
        >
          {props.edge.label}
        </text>
      )}
    </g>
  );
}
