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

    // Close start menu when clicking anywhere outside it and the start button
    if (state.startMenuOpen) {
      const isStartBtn = target.closest('.taskbar__start-btn');
      const isStartMenu = target.closest('.start-menu');
      if (!(isStartBtn || isStartMenu)) {
        actions.closeStartMenu();
      }
    }

    // Deselect desktop icon when clicking outside icon area
    if (state.selectedDesktopIcon !== null) {
      const isIcon = target.closest('.desktop-icon');
      if (!isIcon) {
        actions.selectDesktopIcon(null);
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent): void => {
    // If the focused window's app captures keyboard, yield to it
    const topId = actions.getTopWindowId();
    const topWindow = topId ? state.windows[topId] : undefined;
    if (topWindow) {
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
