import { createSignal, For, type JSX, onMount } from 'solid-js';
import { getDesktopApps } from './apps/registry';
import { DesktopIcon } from './DesktopIcon';
import type { AppRegistryEntry } from './store/types';
import './styles/desktop.css';

const ICON_WIDTH = 80;
const ICON_HEIGHT = 80;
const GRID_PADDING = 16;
const GRID_GAP = 8;
const TASKBAR_HEIGHT = 36;

interface IconPosition {
  id: string;
  x: number;
  y: number;
}

function calculateInitialPositions(
  apps: AppRegistryEntry[],
  containerWidth: number,
  containerHeight: number,
): IconPosition[] {
  const positions: IconPosition[] = [];

  const leftApps = apps.filter((a) => a.desktopAlign !== 'right');
  const rightApps = apps.filter((a) => a.desktopAlign === 'right');

  // Place left-aligned icons (top-left, column-first)
  let col = 0;
  let row = 0;
  for (const app of leftApps) {
    const x = GRID_PADDING + col * (ICON_WIDTH + GRID_GAP);
    const y = GRID_PADDING + row * (ICON_HEIGHT + GRID_GAP);
    positions.push({ id: app.id, x, y });
    row += 1;
    if (y + ICON_HEIGHT * 2 + TASKBAR_HEIGHT > containerHeight) {
      row = 0;
      col += 1;
    }
  }

  // Place right-aligned icons (top-right, column-first)
  col = 0;
  row = 0;
  for (const app of rightApps) {
    const x = containerWidth - GRID_PADDING - ICON_WIDTH - col * (ICON_WIDTH + GRID_GAP);
    const y = GRID_PADDING + row * (ICON_HEIGHT + GRID_GAP);
    positions.push({ id: app.id, x, y });
    row += 1;
    if (y + ICON_HEIGHT * 2 + TASKBAR_HEIGHT > containerHeight) {
      row = 0;
      col += 1;
    }
  }

  return positions;
}

export function DesktopIconGrid(): JSX.Element {
  const apps = (): AppRegistryEntry[] => getDesktopApps();
  const [positions, setPositions] = createSignal<IconPosition[]>([]);
  let gridRef: HTMLDivElement | undefined;

  onMount(() => {
    const width = gridRef?.clientWidth ?? 1024;
    const height = gridRef?.clientHeight ?? 800;
    setPositions(calculateInitialPositions(apps(), width, height));
  });

  const handleIconDrag = (iconId: string, newX: number, newY: number): void => {
    setPositions((prev) => prev.map((p) => (p.id === iconId ? { ...p, x: newX, y: newY } : p)));
  };

  return (
    <div class="desktop-icon-grid" ref={gridRef}>
      <For each={positions()}>
        {(pos: IconPosition) => {
          const app = apps().find((a) => a.id === pos.id);
          if (!app) return null;
          return (
            <DesktopIcon
              id={app.id}
              icon={app.icon}
              label={app.title}
              x={pos.x}
              y={pos.y}
              onDrag={(x: number, y: number) => handleIconDrag(app.id, x, y)}
            />
          );
        }}
      </For>
    </div>
  );
}
