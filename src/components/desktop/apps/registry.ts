import type { Component } from 'solid-js';
import type { AppRegistryEntry } from '../store/types';

export const APP_REGISTRY: Record<string, AppRegistryEntry> = {};

export function registerApp(entry: AppRegistryEntry): void {
  APP_REGISTRY[entry.id] = entry;
}

export function getDesktopApps(): AppRegistryEntry[] {
  return Object.values(APP_REGISTRY).filter((app) => app.desktop);
}

export function getStartMenuApps(): AppRegistryEntry[] {
  return Object.values(APP_REGISTRY).filter((app) => app.startMenu);
}

export function getStartMenuCategories(): Record<string, AppRegistryEntry[]> {
  const categories: Record<string, AppRegistryEntry[]> = {};
  for (const app of getStartMenuApps()) {
    const category = app.startMenuCategory ?? 'Programs';
    if (!categories[category]) {
      categories[category] = [];
    }
    categories[category].push(app);
  }
  return categories;
}

export function resolveAppComponent(appId: string): Component | undefined {
  return APP_REGISTRY[appId]?.component as Component | undefined;
}
