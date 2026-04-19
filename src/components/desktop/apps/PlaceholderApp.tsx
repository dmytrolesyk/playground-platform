import type { JSX } from 'solid-js';

export function PlaceholderApp(props: { name?: string }): JSX.Element {
  return (
    <div style={{ padding: '16px' }}>
      <p>{props.name ?? 'App'} — Coming soon</p>
    </div>
  );
}
