import type { Component } from 'solid-js';

export interface WindowState {
  id: string;
  app: string;
  title: string;
  icon?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  isMinimized: boolean;
  isMaximized: boolean;
  prevBounds?: { x: number; y: number; width: number; height: number } | undefined;
  appProps?: Record<string, unknown>;
}

export interface AppRegistryEntry {
  id: string;
  title: string;
  icon: string;
  component: Component | ReturnType<typeof import('solid-js')['lazy']>;
  desktop: boolean;
  startMenu: boolean;
  startMenuCategory?: string;
  singleton: boolean;
  defaultSize: { width: number; height: number };
  defaultProps?: Record<string, unknown>;
}

export interface DesktopState {
  windows: Record<string, WindowState>;
  windowOrder: string[];
  nextZIndex: number;
  startMenuOpen: boolean;
  selectedDesktopIcon: string | null;
  isMobile: boolean;
}

export interface DesktopActions {
  openWindow: (appId: string, extraProps?: Record<string, unknown>) => void;
  closeWindow: (id: string) => void;
  focusWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  maximizeWindow: (id: string) => void;
  updateWindowPosition: (id: string, x: number, y: number) => void;
  updateWindowSize: (id: string, width: number, height: number) => void;
  toggleStartMenu: () => void;
  closeStartMenu: () => void;
  selectDesktopIcon: (id: string | null) => void;
}

export type DesktopStore = [DesktopState, DesktopActions];
