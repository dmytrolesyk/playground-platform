import { describe, expect, it } from 'vitest';
import '../apps/app-manifest';
import { createDesktopStore } from './desktop-store';

describe('createDesktopStore', () => {
  it('updates singleton app props when reopening an existing window', () => {
    const [state, actions] = createDesktopStore();

    actions.openWindow('library', { initialUrl: '/learn/architecture/overview' });
    const [libraryWindowId] = state.windowOrder;

    expect(libraryWindowId).toBeDefined();
    expect(state.windows[libraryWindowId ?? '']?.appProps).toEqual({
      initialUrl: '/learn/architecture/overview',
    });

    actions.openWindow('library', { initialUrl: '/learn/concepts/islands-architecture' });

    expect(state.windowOrder).toEqual([libraryWindowId]);
    expect(state.windows[libraryWindowId ?? '']?.appProps).toEqual({
      initialUrl: '/learn/concepts/islands-architecture',
    });
  });
});
