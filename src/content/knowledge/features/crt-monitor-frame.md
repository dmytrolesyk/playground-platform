---
title: "CRT Monitor Frame"
category: feature
summary: "The pure CSS CRT monitor effect — glass reflections, scanlines, vignette, and a chin with power button."
difficulty: advanced
relatedConcepts:
  - concepts/compositor-pattern
relatedFiles:
  - src/components/desktop/CrtMonitorFrame.tsx
  - src/components/desktop/styles/crt-frame.css
technologies:
  - solidjs
order: 4
dateAdded: 2026-04-20
---

## What It Does

The CRT monitor frame wraps the entire desktop in a skeuomorphic CRT monitor. It's purely decorative — a CSS-only effect with no impact on desktop functionality.

## Visual Effects

### Scanlines

Horizontal lines simulating a CRT's electron gun trace pattern:

```css
background: repeating-linear-gradient(
  transparent 0px,
  transparent 1px,
  rgba(0, 0, 0, 0.03) 1px,
  rgba(0, 0, 0, 0.03) 2px
);
```

### Vignette

Dark edges simulating the CRT's curved screen:

```css
box-shadow: inset 0 0 80px rgba(0, 0, 0, 0.3);
```

### Glass Reflection

A subtle diagonal highlight simulating light reflecting off the glass:

```css
background: linear-gradient(
  135deg,
  rgba(255, 255, 255, 0.05) 0%,
  transparent 50%
);
```

### Monitor Chin

The bezel below the screen with a power button and brightness controls. Pure CSS with pseudo-elements for button states.

## Architecture

`CrtMonitorFrame` is a SolidJS component that wraps `{props.children}`:

```tsx
function CrtMonitorFrame(props: { children: JSX.Element }) {
  return (
    <div class="crt-monitor">
      <div class="crt-monitor__screen">
        {props.children}
        <div class="crt-monitor__scanlines" />
        <div class="crt-monitor__vignette" />
        <div class="crt-monitor__glass" />
      </div>
      <div class="crt-monitor__chin">
        <button class="crt-monitor__power" />
      </div>
    </div>
  );
}
```

## Performance

All effects use `opacity`, `background`, and `box-shadow` — compositor-friendly properties that don't trigger layout. The overlays are positioned with `pointer-events: none` so they don't interfere with desktop interaction.
