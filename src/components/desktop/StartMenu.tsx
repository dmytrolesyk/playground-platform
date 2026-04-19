import { For, type JSX } from 'solid-js';
import { getStartMenuApps } from './apps/registry';
import { useDesktop } from './store/context';
import type { AppRegistryEntry } from './store/types';
import './styles/start-menu.css';

export function StartMenu(): JSX.Element {
  const [state, actions] = useDesktop();
  const apps = (): AppRegistryEntry[] => getStartMenuApps();

  const handleItemClick = (appId: string): void => {
    actions.openWindow(appId);
    actions.closeStartMenu();
  };

  return (
    <div class="start-menu" classList={{ 'start-menu--open': state.startMenuOpen }} role="menu">
      <div class="start-menu__sidebar">
        <span class="start-menu__sidebar-text">Windows 95</span>
      </div>
      <div class="start-menu__items">
        <For each={apps()}>
          {(app: AppRegistryEntry) => (
            <button
              type="button"
              class="start-menu__item"
              role="menuitem"
              onClick={() => handleItemClick(app.id)}
            >
              <img
                src={app.icon}
                alt=""
                width={16}
                height={16}
                style={{ 'image-rendering': 'pixelated' }}
                draggable={false}
              />
              <span>{app.title}</span>
            </button>
          )}
        </For>
      </div>
    </div>
  );
}
