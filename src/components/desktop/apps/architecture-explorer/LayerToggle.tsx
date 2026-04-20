import { For, type JSX } from 'solid-js';
import { type ArchLayer, LAYERS } from './architecture-data';

interface LayerToggleProps {
  visibleLayers: Set<string>;
  onToggle: (layerId: string) => void;
}

export function LayerToggle(props: LayerToggleProps): JSX.Element {
  return (
    <div class="arch-explorer__toolbar">
      <span>
        <strong>Layers:</strong>
      </span>
      <For each={LAYERS}>
        {(layer: ArchLayer) => (
          <label>
            <input
              type="checkbox"
              checked={props.visibleLayers.has(layer.id)}
              onChange={() => props.onToggle(layer.id)}
            />
            <span style={{ color: layer.color }}>●</span>
            {layer.label}
          </label>
        )}
      </For>
    </div>
  );
}
