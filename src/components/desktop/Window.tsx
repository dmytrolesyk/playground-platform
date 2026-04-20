import type { JSX } from 'solid-js';
import { APP_REGISTRY } from './apps/registry';
import { useDesktop } from './store/context';
import type { WindowState } from './store/types';
import { TitleBar } from './TitleBar';
import './styles/window.css';

const TASKBAR_HEIGHT = 36;
const DEFAULT_MIN_WIDTH = 200;
const DEFAULT_MIN_HEIGHT = 150;

type ResizeEdge = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

const CURSOR_MAP: Record<ResizeEdge, string> = {
  n: 'ns-resize',
  s: 'ns-resize',
  e: 'ew-resize',
  w: 'ew-resize',
  ne: 'nesw-resize',
  nw: 'nwse-resize',
  se: 'nwse-resize',
  sw: 'nesw-resize',
};

interface WindowProps {
  window: WindowState;
  children: JSX.Element;
}

export function Window(props: WindowProps): JSX.Element {
  const [state, actions] = useDesktop();
  let isDragging = false;
  let dragOffsetX = 0;
  let dragOffsetY = 0;

  // Resize state
  let isResizing = false;
  let resizeEdge: ResizeEdge | null = null;
  let resizeStartX = 0;
  let resizeStartY = 0;
  let resizeStartBounds = { x: 0, y: 0, w: 0, h: 0 };

  const handleDragStart = (e: PointerEvent): void => {
    if (state.isMobile) return;
    if (e.button !== 0) return;
    if (props.window.isMaximized) return;

    const clicked = e.target as HTMLElement;
    if (clicked.closest('.title-bar-controls')) return;

    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);
    isDragging = true;
    dragOffsetX = e.clientX - props.window.x;
    dragOffsetY = e.clientY - props.window.y;

    actions.focusWindow(props.window.id);

    const windowEl = target.closest('.win-container') as HTMLElement | null;
    if (windowEl) {
      windowEl.style.willChange = 'transform';
    }
  };

  const handleDragMove = (e: PointerEvent): void => {
    if (!isDragging) return;

    let newX = e.clientX - dragOffsetX;
    let newY = e.clientY - dragOffsetY;

    const container = (e.currentTarget as HTMLElement).closest('.desktop') as HTMLElement | null;
    const maxX = (container?.clientWidth ?? window.innerWidth) - 100;
    const maxY = (container?.clientHeight ?? window.innerHeight) - TASKBAR_HEIGHT - 20;
    newX = Math.max(-props.window.width + 100, Math.min(newX, maxX));
    newY = Math.max(0, Math.min(newY, maxY));

    actions.updateWindowPosition(props.window.id, newX, newY);
  };

  const handleDragEnd = (e: PointerEvent): void => {
    if (!isDragging) return;
    isDragging = false;

    const target = e.currentTarget as HTMLElement;
    target.releasePointerCapture(e.pointerId);

    const windowEl = target.closest('.win-container') as HTMLElement | null;
    if (windowEl) {
      windowEl.style.willChange = 'auto';
    }
  };

  const handleResizeStart = (edge: ResizeEdge, e: PointerEvent): void => {
    if (state.isMobile) return;
    if (props.window.isMaximized) return;
    e.preventDefault();
    e.stopPropagation();

    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);
    isResizing = true;
    resizeEdge = edge;
    resizeStartX = e.clientX;
    resizeStartY = e.clientY;
    resizeStartBounds = {
      x: props.window.x,
      y: props.window.y,
      w: props.window.width,
      h: props.window.height,
    };

    actions.focusWindow(props.window.id);
  };

  const handleResizeMove = (e: PointerEvent): void => {
    if (!(isResizing && resizeEdge)) return;

    const dx = e.clientX - resizeStartX;
    const dy = e.clientY - resizeStartY;
    let { x, y, w, h } = resizeStartBounds;

    const appEntry = APP_REGISTRY[props.window.app];
    const minW = appEntry?.minSize?.width ?? DEFAULT_MIN_WIDTH;
    const minH = appEntry?.minSize?.height ?? DEFAULT_MIN_HEIGHT;

    if (resizeEdge.includes('e')) w = Math.max(minW, w + dx);
    if (resizeEdge.includes('s')) h = Math.max(minH, h + dy);
    if (resizeEdge.includes('w')) {
      const newW = Math.max(minW, w - dx);
      x += w - newW;
      w = newW;
    }
    if (resizeEdge.includes('n')) {
      const newH = Math.max(minH, h - dy);
      y += h - newH;
      h = newH;
    }

    actions.updateWindowPosition(props.window.id, x, y);
    actions.updateWindowSize(props.window.id, w, h);
  };

  const handleResizeEnd = (e: PointerEvent): void => {
    if (!isResizing) return;
    isResizing = false;
    resizeEdge = null;

    const target = e.currentTarget as HTMLElement;
    target.releasePointerCapture(e.pointerId);
  };

  const handleWindowFocus = (): void => {
    actions.focusWindow(props.window.id);
  };

  const isFullScreen = (): boolean => state.isMobile || props.window.isMaximized;

  function renderResizeHandle(edge: ResizeEdge): JSX.Element {
    return (
      <div
        class={`win-resize win-resize--${edge}`}
        style={{ cursor: CURSOR_MAP[edge] }}
        onPointerDown={(e: PointerEvent) => handleResizeStart(edge, e)}
        onPointerMove={handleResizeMove}
        onPointerUp={handleResizeEnd}
      />
    );
  }

  return (
    <div
      class="window win-container"
      classList={{
        'win-maximized': isFullScreen(),
        'win-minimized': props.window.isMinimized,
      }}
      style={{
        position: state.isMobile ? 'fixed' : 'absolute',
        ...(isFullScreen()
          ? {
              top: '0',
              left: '0',
              width: '100%',
              height: state.isMobile
                ? `calc(100vh - ${TASKBAR_HEIGHT}px)`
                : `calc(100% - ${TASKBAR_HEIGHT}px)`,
              transform: 'none',
            }
          : {
              width: `${props.window.width}px`,
              height: `${props.window.height}px`,
              transform: `translate(${props.window.x}px, ${props.window.y}px)`,
            }),
        'z-index': props.window.zIndex,
        display: props.window.isMinimized ? 'none' : 'flex',
        'flex-direction': 'column',
      }}
      role="dialog"
      aria-labelledby={`win-title-${props.window.id}`}
      onMouseDown={handleWindowFocus}
    >
      <div
        onPointerDown={handleDragStart}
        onPointerMove={handleDragMove}
        onPointerUp={handleDragEnd}
      >
        <TitleBar window={props.window} />
      </div>
      <div class="window-body" style={{ flex: '1', overflow: 'auto', margin: '0', padding: '8px' }}>
        {props.children}
      </div>

      {/* Resize handles — hidden when maximized, mobile, or non-resizable */}
      {!isFullScreen() && (APP_REGISTRY[props.window.app]?.resizable ?? true) && (
        <>
          {renderResizeHandle('n')}
          {renderResizeHandle('s')}
          {renderResizeHandle('e')}
          {renderResizeHandle('w')}
          {renderResizeHandle('ne')}
          {renderResizeHandle('nw')}
          {renderResizeHandle('se')}
          {renderResizeHandle('sw')}
        </>
      )}
    </div>
  );
}
