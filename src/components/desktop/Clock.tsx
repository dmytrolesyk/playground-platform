import { createSignal, type JSX, onCleanup } from 'solid-js';

export function Clock(): JSX.Element {
  const formatTime = (): string => {
    const now = new Date();
    return now.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const [time, setTime] = createSignal(formatTime());

  const interval = setInterval(() => {
    setTime(formatTime());
  }, 60_000);

  onCleanup(() => clearInterval(interval));

  return (
    <div class="clock" style={{ 'font-size': '11px', padding: '0 8px', 'white-space': 'nowrap' }}>
      {time()}
    </div>
  );
}
