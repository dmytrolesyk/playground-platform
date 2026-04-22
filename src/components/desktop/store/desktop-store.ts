import { onCleanup } from 'solid-js';
import { createStore, produce } from 'solid-js/store';
import { APP_REGISTRY } from '../apps/registry';
import { Z_INDEX } from '../constants';
import type { DesktopActions, DesktopState, WindowState } from './types';

const CASCADE_BASE_X = 50;
const CASCADE_BASE_Y = 50;
const CASCADE_OFFSET = 30;
const CASCADE_MAX_STEPS = 8;

const MOBILE_BREAKPOINT = 768;

let windowCounter = 0;

function generateWindowId(appId: string): string {
  windowCounter += 1;
  return `${appId}-${windowCounter}`;
}

export function createDesktopStore(): [DesktopState, DesktopActions] {
  const mediaQuery =
    typeof window !== 'undefined'
      ? window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`)
      : undefined;

  const [state, setState] = createStore<DesktopState>({
    windows: {},
    windowOrder: [],
    nextZIndex: Z_INDEX.WINDOW_BASE,
    startMenuOpen: false,
    selectedDesktopIcon: null,
    isMobile: mediaQuery?.matches ?? false,
  });

  // Listen for viewport changes
  if (mediaQuery) {
    const handleChange = (e: MediaQueryListEvent): void => {
      setState('isMobile', e.matches);
    };
    mediaQuery.addEventListener('change', handleChange);
    onCleanup(() => mediaQuery.removeEventListener('change', handleChange));
  }

  const actions: DesktopActions = {
    openWindow(appId: string, extraProps?: Record<string, unknown>): void {
      const appEntry = APP_REGISTRY[appId];
      if (!appEntry) return;

      // Singleton check: if already open, focus existing
      if (appEntry.singleton) {
        const existingId = state.windowOrder.find((id) => {
          const win = state.windows[id];
          return win?.app === appId;
        });
        if (existingId) {
          if (extraProps) {
            setState('windows', existingId, 'appProps', (appProps) => ({
              ...(appProps ?? {}),
              ...extraProps,
            }));
          }
          actions.focusWindow(existingId);
          // Also restore if minimized
          const existing = state.windows[existingId];
          if (existing?.isMinimized) {
            setState('windows', existingId, 'isMinimized', false);
          }
          return;
        }
      }

      const id = generateWindowId(appId);
      const openCount = state.windowOrder.length;
      const cascadeStep = openCount % CASCADE_MAX_STEPS;

      const newWindow: WindowState = {
        id,
        app: appId,
        title: appEntry.title,
        icon: appEntry.icon,
        x: CASCADE_BASE_X + cascadeStep * CASCADE_OFFSET,
        y: CASCADE_BASE_Y + cascadeStep * CASCADE_OFFSET,
        width: appEntry.defaultSize.width,
        height: appEntry.defaultSize.height,
        zIndex: state.nextZIndex,
        isMinimized: false,
        isMaximized: appEntry.openMaximized === true,
        appProps: { ...appEntry.defaultProps, ...extraProps },
      };

      setState(
        produce((s) => {
          s.windows[id] = newWindow;
          s.windowOrder.push(id);
          s.nextZIndex += 1;
          s.startMenuOpen = false;
        }),
      );
    },

    closeWindow(id: string): void {
      setState(
        produce((s) => {
          delete s.windows[id];
          const idx = s.windowOrder.indexOf(id);
          if (idx !== -1) {
            s.windowOrder.splice(idx, 1);
          }
        }),
      );
    },

    focusWindow(id: string): void {
      if (!state.windows[id]) return;
      setState(
        produce((s) => {
          const win = s.windows[id];
          if (win) {
            win.zIndex = s.nextZIndex;
          }
          s.nextZIndex += 1;
          s.startMenuOpen = false;
        }),
      );
    },

    minimizeWindow(id: string): void {
      if (!state.windows[id]) return;
      setState('windows', id, 'isMinimized', (v) => !v);
    },

    maximizeWindow(id: string): void {
      const win = state.windows[id];
      if (!win) return;

      if (win.isMaximized) {
        // Restore from prevBounds
        const prev = win.prevBounds;
        if (prev) {
          setState(
            produce((s) => {
              const w = s.windows[id];
              if (w) {
                w.x = prev.x;
                w.y = prev.y;
                w.width = prev.width;
                w.height = prev.height;
                w.isMaximized = false;
                w.prevBounds = undefined;
              }
            }),
          );
        } else {
          setState('windows', id, 'isMaximized', false);
        }
      } else {
        // Save current bounds and maximize
        setState(
          produce((s) => {
            const w = s.windows[id];
            if (w) {
              w.prevBounds = { x: w.x, y: w.y, width: w.width, height: w.height };
              w.isMaximized = true;
            }
          }),
        );
      }
    },

    updateWindowPosition(id: string, x: number, y: number): void {
      if (!state.windows[id]) return;
      setState(
        produce((s) => {
          const win = s.windows[id];
          if (win) {
            win.x = x;
            win.y = y;
          }
        }),
      );
    },

    updateWindowSize(id: string, width: number, height: number): void {
      if (!state.windows[id]) return;
      setState(
        produce((s) => {
          const win = s.windows[id];
          if (win) {
            win.width = width;
            win.height = height;
          }
        }),
      );
    },

    toggleStartMenu(): void {
      setState('startMenuOpen', (v) => !v);
    },

    closeStartMenu(): void {
      setState('startMenuOpen', false);
    },

    selectDesktopIcon(id: string | null): void {
      setState('selectedDesktopIcon', id);
    },

    isTopWindow(id: string): boolean {
      return actions.getTopWindowId() === id;
    },

    getTopWindowId(): string | undefined {
      const order = state.windowOrder;
      if (order.length === 0) return undefined;
      let maxZ = -1;
      let topId: string | undefined;
      for (const wid of order) {
        const win = state.windows[wid];
        if (win && !win.isMinimized && win.zIndex > maxZ) {
          maxZ = win.zIndex;
          topId = wid;
        }
      }
      return topId;
    },
  };

  return [state, actions];
}
