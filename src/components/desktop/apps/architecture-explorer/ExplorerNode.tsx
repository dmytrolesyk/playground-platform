import type { JSX } from 'solid-js';
import { type ArchNode, CATEGORY_BORDER_COLORS, CATEGORY_COLORS } from './architecture-data';

interface ExplorerNodeProps {
  node: ArchNode;
  isSelected: boolean;
  isHighlighted: boolean;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
}

export function ExplorerNode(props: ExplorerNodeProps): JSX.Element {
  const fill = (): string => {
    if (props.isSelected) return '#fffde0';
    if (props.isHighlighted) return '#fff3e0';
    return CATEGORY_COLORS[props.node.category] ?? '#f0f0f0';
  };

  const stroke = (): string => {
    if (props.isSelected) return '#d4a017';
    return CATEGORY_BORDER_COLORS[props.node.category] ?? '#999';
  };

  const strokeWidth = (): number => {
    return props.isSelected || props.isHighlighted ? 2.5 : 1.5;
  };

  return (
    <g
      role="group"
      aria-label={props.node.label}
      tabIndex={0}
      style={{ cursor: 'pointer' }}
      onClick={() => props.onSelect(props.node.id)}
      onMouseEnter={() => props.onHover(props.node.id)}
      onMouseLeave={() => props.onHover(null)}
      onKeyDown={(e: KeyboardEvent) => {
        if (e.key === 'Enter') props.onSelect(props.node.id);
      }}
    >
      <rect
        x={props.node.x}
        y={props.node.y}
        width={props.node.width}
        height={props.node.height}
        rx={4}
        ry={4}
        fill={fill()}
        stroke={stroke()}
        stroke-width={strokeWidth()}
      />
      <text
        x={props.node.x + props.node.width / 2}
        y={props.node.y + props.node.height / 2}
        text-anchor="middle"
        dominant-baseline="central"
        font-size="12"
        font-family="Arial, Helvetica, sans-serif"
        font-weight={props.isSelected ? '700' : '500'}
        fill="#1a1a1a"
      >
        {props.node.label}
      </text>
    </g>
  );
}
