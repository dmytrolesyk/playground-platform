import { createContext, type JSX, useContext } from 'solid-js';
import { createDesktopStore } from './desktop-store';
import type { DesktopActions, DesktopState } from './types';

const DesktopContext = createContext<[DesktopState, DesktopActions]>();

export function DesktopProvider(props: { children: JSX.Element }): JSX.Element {
  const store = createDesktopStore();
  return <DesktopContext.Provider value={store}>{props.children}</DesktopContext.Provider>;
}

export function useDesktop(): [DesktopState, DesktopActions] {
  const ctx = useContext(DesktopContext);
  if (!ctx) {
    throw new Error('useDesktop must be used within a DesktopProvider');
  }
  return ctx;
}
