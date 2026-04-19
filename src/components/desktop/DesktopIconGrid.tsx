import { For, type JSX } from 'solid-js';
import { getDesktopApps } from './apps/registry';
import { DesktopIcon } from './DesktopIcon';
import './styles/desktop.css';

export function DesktopIconGrid(): JSX.Element {
  const apps = (): ReturnType<typeof getDesktopApps> => getDesktopApps();

  return (
    <div class="desktop-icon-grid">
      <For each={apps()}>
        {(app: ReturnType<typeof getDesktopApps>[number]) => (
          <DesktopIcon id={app.id} icon={app.icon} label={app.title} />
        )}
      </For>
    </div>
  );
}
