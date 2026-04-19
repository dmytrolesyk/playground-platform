import { For, type JSX, Show } from 'solid-js';
import { Clock } from './Clock';
import { StartMenu } from './StartMenu';
import { useDesktop } from './store/context';
import type { WindowState } from './store/types';
import './styles/taskbar.css';

export function Taskbar(): JSX.Element {
  const [state, actions] = useDesktop();

  const openWindows = (): WindowState[] => {
    return state.windowOrder
      .map((id) => state.windows[id])
      .filter((w): w is WindowState => w !== undefined);
  };

  const isTopWindow = (windowId: string): boolean => {
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
    return topId === windowId;
  };

  const handleTaskButtonClick = (windowId: string): void => {
    const win = state.windows[windowId];
    if (!win) return;

    if (win.isMinimized) {
      actions.minimizeWindow(windowId);
      actions.focusWindow(windowId);
    } else if (isTopWindow(windowId)) {
      actions.minimizeWindow(windowId);
    } else {
      actions.focusWindow(windowId);
    }
  };

  const handleStartClick = (): void => {
    actions.toggleStartMenu();
  };

  return (
    <div class="taskbar" role="toolbar">
      <StartMenu />
      <button
        type="button"
        class="taskbar__start-btn"
        classList={{ 'taskbar__start-btn--active': state.startMenuOpen }}
        onClick={handleStartClick}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          aria-hidden="true"
          style={{ 'flex-shrink': '0', 'image-rendering': 'pixelated' }}
        >
          <rect x="1" y="1" width="6" height="6" fill="#ff0000" />
          <rect x="9" y="1" width="6" height="6" fill="#00ff00" />
          <rect x="1" y="9" width="6" height="6" fill="#0000ff" />
          <rect x="9" y="9" width="6" height="6" fill="#ffff00" />
        </svg>
        <strong>Start</strong>
      </button>
      <div class="taskbar__divider" />
      <Show when={!state.isMobile}>
        <div class="taskbar__tasks">
          <For each={openWindows()}>
            {(win: WindowState) => (
              <button
                type="button"
                class="taskbar__task-btn"
                classList={{ 'taskbar__task-btn--active': isTopWindow(win.id) && !win.isMinimized }}
                onClick={() => handleTaskButtonClick(win.id)}
                title={win.title}
              >
                {win.icon && (
                  <img
                    src={win.icon}
                    alt=""
                    width={20}
                    height={20}
                    style={{ 'image-rendering': 'pixelated' }}
                    draggable={false}
                  />
                )}
                <span class="taskbar__task-text">{win.title}</span>
              </button>
            )}
          </For>
        </div>
      </Show>
      <Show when={state.isMobile}>
        <div class="taskbar__tasks taskbar__tasks--mobile">
          {openWindows().length > 0 && (
            <span class="taskbar__active-app">
              {openWindows().find((w) => !w.isMinimized)?.title ?? ''}
            </span>
          )}
        </div>
      </Show>
      <div class="taskbar__tray">
        <Clock />
      </div>
    </div>
  );
}
