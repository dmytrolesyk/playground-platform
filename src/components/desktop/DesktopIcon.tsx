import type { JSX } from 'solid-js';
import { useDesktop } from './store/context';

interface DesktopIconProps {
  id: string;
  icon: string;
  label: string;
}

export function DesktopIcon(props: DesktopIconProps): JSX.Element {
  const [state, actions] = useDesktop();

  const isSelected = (): boolean => state.selectedDesktopIcon === props.id;

  const handleClick = (): void => {
    actions.selectDesktopIcon(props.id);
  };

  const handleDoubleClick = (): void => {
    actions.openWindow(props.id);
  };

  const handleKeyDown = (e: KeyboardEvent): void => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      actions.openWindow(props.id);
    }
  };

  return (
    <button
      type="button"
      class="desktop-icon"
      classList={{ 'desktop-icon--selected': isSelected() }}
      onClick={handleClick}
      onDblClick={handleDoubleClick}
      onKeyDown={handleKeyDown}
      aria-label={`Open ${props.label}`}
    >
      <img
        src={props.icon}
        alt=""
        width={32}
        height={32}
        draggable={false}
        class="desktop-icon__img"
      />
      <span class="desktop-icon__label">{props.label}</span>
    </button>
  );
}
