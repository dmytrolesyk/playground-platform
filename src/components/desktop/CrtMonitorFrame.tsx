import type { JSX } from 'solid-js';
import './styles/crt-monitor.css';

interface CrtMonitorFrameProps {
  children: JSX.Element;
}

export function CrtMonitorFrame(props: CrtMonitorFrameProps): JSX.Element {
  return (
    <div class="crt-monitor">
      <div class="crt-body">
        <div class="crt-body__vent" />
        <div class="crt-bezel">
          <div class="crt-screen">{props.children}</div>
          <div class="crt-glass" />
          <div class="crt-scanlines" />
          <div class="crt-vignette" />
        </div>
        <div class="crt-chin">
          <div class="crt-chin__buttons">
            <div class="crt-chin__btn" />
            <div class="crt-chin__btn" />
            <div class="crt-chin__btn" />
            <div class="crt-chin__btn" />
            <div class="crt-chin__btn" />
          </div>
          <div class="crt-chin__badge">
            <span class="crt-chin__badge-text">DL</span>
          </div>
          <div class="crt-chin__power">
            <div class="crt-chin__led" />
            <button type="button" class="crt-chin__power-btn" aria-label="Power (decorative)">
              <span class="crt-chin__power-icon" />
            </button>
          </div>
        </div>
      </div>
      <div class="crt-stand__neck" />
      <div class="crt-stand__base" />
    </div>
  );
}
