import { For, type JSX } from 'solid-js';
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
      actions.minimizeWindow(windowId); // toggles off
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
        <strong>Start</strong>
      </button>
      <div class="taskbar__divider" />
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
                  width={16}
                  height={16}
                  style={{ 'image-rendering': 'pixelated' }}
                  draggable={false}
                />
              )}
              <span class="taskbar__task-text">{win.title}</span>
            </button>
          )}
        </For>
      </div>
      <div class="taskbar__tray">
        <Clock />
      </div>
    </div>
  );
}
