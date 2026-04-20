import type { JSX } from 'solid-js';
// Import app manifest to register all apps before rendering
import './apps/app-manifest';
import { APP_REGISTRY } from './apps/registry';
import { CrtMonitorFrame } from './CrtMonitorFrame';
import { DesktopIconGrid } from './DesktopIconGrid';
import { DesktopProvider, useDesktop } from './store/context';
import { Taskbar } from './Taskbar';
import { WindowManager } from './WindowManager';

function DesktopInner(): JSX.Element {
  const [state, actions] = useDesktop();

  const handleDesktopClick = (e: MouseEvent): void => {
    const target = e.target as HTMLElement;
    if (target.classList.contains('desktop') || target.classList.contains('crt-screen')) {
      actions.selectDesktopIcon(null);
      actions.closeStartMenu();
    }
  };

  const handleKeyDown = (e: KeyboardEvent): void => {
    // If the focused window's app captures keyboard, yield to it
    const topWindowId =
      state.windowOrder.length > 0 ? state.windowOrder[state.windowOrder.length - 1] : undefined;
    const topWindow = topWindowId ? state.windows[topWindowId] : undefined;
    if (topWindow && !topWindow.isMinimized) {
      const appEntry = APP_REGISTRY[topWindow.app];
      if (appEntry?.captureKeyboard) return;
    }

    if (e.key === 'Escape') {
      if (state.startMenuOpen) {
        actions.closeStartMenu();
      }
    }
  };

  return (
    <CrtMonitorFrame>
      <div
        class="desktop"
        role="application"
        aria-label="Desktop"
        onMouseDown={handleDesktopClick}
        onKeyDown={handleKeyDown}
      >
        <DesktopIconGrid />
        <WindowManager />
        <Taskbar />
      </div>
    </CrtMonitorFrame>
  );
}

export default function Desktop(): JSX.Element {
  return (
    <DesktopProvider>
      <DesktopInner />
    </DesktopProvider>
  );
}
