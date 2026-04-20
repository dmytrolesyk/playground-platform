import { For, type JSX, Suspense } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import { resolveAppComponent } from './apps/registry';
import { useDesktop } from './store/context';
import type { WindowState } from './store/types';
import { Window } from './Window';

function LoadingFallback(): JSX.Element {
  return (
    <div
      style={{
        display: 'flex',
        'align-items': 'center',
        'justify-content': 'center',
        padding: '24px',
      }}
    >
      Loading...
    </div>
  );
}

export function WindowManager(): JSX.Element {
  const [state] = useDesktop();

  const openWindows = (): WindowState[] => {
    return state.windowOrder
      .map((id) => state.windows[id])
      .filter((w): w is WindowState => w !== undefined);
  };

  return (
    <div
      class="window-layer"
      style={{ position: 'absolute', inset: '0', 'pointer-events': 'none' }}
    >
      <For each={openWindows()}>
        {(win: WindowState) => {
          const AppComponent = resolveAppComponent(win.app);
          return (
            <Window window={win}>
              <Suspense fallback={<LoadingFallback />}>
                {AppComponent ? (
                  <Dynamic component={AppComponent} {...(win.appProps ?? {})} />
                ) : (
                  <div>App not found: {win.app}</div>
                )}
              </Suspense>
            </Window>
          );
        }}
      </For>
    </div>
  );
}
