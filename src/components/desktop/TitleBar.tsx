import type { JSX } from 'solid-js';
import { useDesktop } from './store/context';
import type { WindowState } from './store/types';

interface TitleBarProps {
  window: WindowState;
}

export function TitleBar(props: TitleBarProps): JSX.Element {
  const [, actions] = useDesktop();

  // Determine if this window is focused (topmost)
  const isFocused = (): boolean => actions.isTopWindow(props.window.id);

  const handleMinimize = (e: Event): void => {
    e.stopPropagation();
    actions.minimizeWindow(props.window.id);
  };

  const handleMaximize = (e: Event): void => {
    e.stopPropagation();
    actions.maximizeWindow(props.window.id);
  };

  const handleClose = (e: Event): void => {
    e.stopPropagation();
    actions.closeWindow(props.window.id);
  };

  return (
    <div
      class={`title-bar ${isFocused() ? '' : 'inactive'}`}
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
