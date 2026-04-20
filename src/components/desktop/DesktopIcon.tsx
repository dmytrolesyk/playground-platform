import type { JSX } from 'solid-js';
import { useDesktop } from './store/context';

interface DesktopIconProps {
  id: string;
  icon: string;
  label: string;
  x: number;
  y: number;
  onDrag: (x: number, y: number) => void;
}

export function DesktopIcon(props: DesktopIconProps): JSX.Element {
  const [state, actions] = useDesktop();

  let isDragging = false;
  let hasMoved = false;
  let dragOffsetX = 0;
  let dragOffsetY = 0;
  let elementRef: HTMLButtonElement | undefined;

  const isSelected = (): boolean => state.selectedDesktopIcon === props.id;

  const handlePointerDown = (e: PointerEvent): void => {
    if (state.isMobile) return;
    if (e.button !== 0) return;

    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);
    isDragging = true;
    hasMoved = false;
    dragOffsetX = e.clientX - props.x;
    dragOffsetY = e.clientY - props.y;

    actions.selectDesktopIcon(props.id);
  };

  const handlePointerMove = (e: PointerEvent): void => {
    if (!isDragging) return;

    const newX = e.clientX - dragOffsetX;
    const newY = e.clientY - dragOffsetY;

    if (!hasMoved && (Math.abs(newX - props.x) > 4 || Math.abs(newY - props.y) > 4)) {
      hasMoved = true;
      if (elementRef) {
        elementRef.style.willChange = 'transform';
        elementRef.style.zIndex = '100';
      }
    }

    if (hasMoved && elementRef) {
      // Move directly via transform — no signal/re-render overhead
      elementRef.style.transform = `translate(${newX}px, ${newY}px)`;
    }
  };

  const handlePointerUp = (e: PointerEvent): void => {
    if (!isDragging) return;
    isDragging = false;

    const target = e.currentTarget as HTMLElement;
    target.releasePointerCapture(e.pointerId);

    if (hasMoved && elementRef) {
      // Read final position from the transform we've been setting
      const finalX = e.clientX - dragOffsetX;
      const finalY = e.clientY - dragOffsetY;
      elementRef.style.willChange = 'auto';
      elementRef.style.zIndex = '';
      // Commit final position to state (single update)
      props.onDrag(finalX, finalY);
    }
  };

  const handleClick = (): void => {
    if (hasMoved) return;
    if (state.isMobile) {
      actions.openWindow(props.id);
    } else {
      actions.selectDesktopIcon(props.id);
    }
  };

  const handleDoubleClick = (): void => {
    if (hasMoved) return;
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
      ref={elementRef}
      type="button"
      class="desktop-icon"
      classList={{ 'desktop-icon--selected': isSelected() }}
      style={{
        position: state.isMobile ? 'static' : 'absolute',
        transform: state.isMobile ? 'none' : `translate(${props.x}px, ${props.y}px)`,
        'touch-action': 'none',
      }}
      onClick={handleClick}
      onDblClick={handleDoubleClick}
      onKeyDown={handleKeyDown}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      aria-label={`Open ${props.label}`}
    >
      <img
        src={props.icon}
        alt=""
        width={48}
        height={48}
        draggable={false}
        class="desktop-icon__img"
      />
      <span class="desktop-icon__label">{props.label}</span>
    </button>
  );
}
