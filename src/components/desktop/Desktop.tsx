import type { JSX } from 'solid-js';
// Import app manifest to register all apps before rendering
import './apps/app-manifest';
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
