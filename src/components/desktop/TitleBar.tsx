import type { JSX, MouseEvent } from 'solid-js';
import { useDesktop } from './store/context';
import type { WindowState } from './store/types';

interface TitleBarProps {
  window: WindowState;
  onDragStart: (e: PointerEvent) => void;
}

export function TitleBar(props: TitleBarProps): JSX.Element {
  const [state, actions] = useDesktop();

  // Determine if this window is focused (topmost)
  const isFocused = (): boolean => {
    const order = state.windowOrder;
    if (order.length === 0) return false;
    let maxZ = -1;
    let topId = '';
    for (const id of order) {
      const win = state.windows[id];
      if (win && !win.isMinimized && win.zIndex > maxZ) {
        maxZ = win.zIndex;
        topId = id;
      }
    }
    return topId === props.window.id;
  };

  const handleMinimize = (e: MouseEvent): void => {
    e.stopPropagation();
    actions.minimizeWindow(props.window.id);
  };

  const handleMaximize = (e: MouseEvent): void => {
    e.stopPropagation();
    actions.maximizeWindow(props.window.id);
  };

  const handleClose = (e: MouseEvent): void => {
    e.stopPropagation();
    actions.closeWindow(props.window.id);
  };

  return (
    <div
      class={`title-bar ${isFocused() ? '' : 'inactive'}`}
      onPointerDown={props.onDragStart}
      style={{ 'touch-action': 'none', 'user-select': 'none' }}
    >
      <div class="title-bar-text" style={{ display: 'flex', 'align-items': 'center', gap: '4px' }}>
        {props.window.icon && (
          <img
            src={props.window.icon}
            alt=""
            width={16}
            height={16}
            style={{ 'image-rendering': 'pixelated' }}
            draggable={false}
          />
        )}
        <span id={`win-title-${props.window.id}`}>{props.window.title}</span>
      </div>
      <div class="title-bar-controls">
        <button type="button" aria-label="Minimize" onClick={handleMinimize} />
        <button
          type="button"
          aria-label={props.window.isMaximized ? 'Restore' : 'Maximize'}
          onClick={handleMaximize}
        />
        <button type="button" aria-label="Close" onClick={handleClose} />
      </div>
    </div>
  );
}
