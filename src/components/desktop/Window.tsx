import type { JSX } from 'solid-js';
import { useDesktop } from './store/context';
import type { WindowState } from './store/types';
import { TitleBar } from './TitleBar';
import './styles/window.css';

const TASKBAR_HEIGHT = 28;

interface WindowProps {
  window: WindowState;
  children: JSX.Element;
}

export function Window(props: WindowProps): JSX.Element {
  const [state, actions] = useDesktop();
  let isDragging = false;
  let dragOffsetX = 0;
  let dragOffsetY = 0;

  const handleDragStart = (e: PointerEvent): void => {
    // No drag on mobile
    if (state.isMobile) return;
    if (e.button !== 0) return;
    if (props.window.isMaximized) return;

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

    const maxX = window.innerWidth - 100;
    const maxY = window.innerHeight - TASKBAR_HEIGHT - 20;
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

  const handleWindowFocus = (): void => {
    actions.focusWindow(props.window.id);
  };

  const isFullScreen = (): boolean => state.isMobile || props.window.isMaximized;

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
              height: `calc(100vh - ${TASKBAR_HEIGHT}px)`,
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
        <TitleBar window={props.window} onDragStart={() => {}} />
      </div>
      <div class="window-body" style={{ flex: '1', overflow: 'auto', margin: '0', padding: '8px' }}>
        {props.children}
      </div>
    </div>
  );
}
