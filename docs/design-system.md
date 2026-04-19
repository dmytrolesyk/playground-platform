# Windows 95/98 Retro Design System

> Visual reference for the retro CV project. Token values live in `design-tokens.json`.
> 98.css handles component-level aesthetics (buttons, windows, inputs, fonts).
> Custom CSS handles only layout (desktop grid, taskbar positioning, window transforms).

---

## 1. Color Palette

All colors are solid, web-safe values from the Windows 9x system palette.

| Role | Token | Value | Notes |
|---|---|---|---|
| Desktop background | `colors.desktop` | `#008080` | Classic teal. Full-viewport. |
| Window/surface background | `colors.surface` | `#c0c0c0` | Classic silver. Applied by 98.css. |
| Active title bar | `colors.titleBarActive` | `#000080` | Navy blue. Applied by 98.css. |
| Inactive title bar | `colors.titleBarInactive` | `#808080` | Dark gray. Applied by 98.css. |
| Title bar / inverse text | `colors.textInverse` | `#ffffff` | White on dark backgrounds. |
| Default text | `colors.textDefault` | `#000000` | Black on silver/white backgrounds. |
| Button highlight (top/left) | `colors.highlightOuter` | `#ffffff` | 3D outset effect. Handled by 98.css. |
| Button shadow (bottom/right) | `colors.shadowInner` | `#808080` | 3D outset effect. Handled by 98.css. |
| Button outer shadow | `colors.shadowOuter` | `#0a0a0a` | Near-black. Handled by 98.css. |
| Icon selection background | `colors.iconSelectBg` | `#000080` | Solid blue rect behind selected icon label. |
| Icon selection text | `colors.iconSelectText` | `#ffffff` | White text on blue selection. |
| Hyperlink | `colors.linkText` | `#0000ff` | Inside the CV browser window. |

## 2. Typography

98.css imports and applies **Pixelated MS Sans Serif** automatically. Do not load additional fonts.

- **Font stack:** `"Pixelated MS Sans Serif", "MS Sans Serif", Arial, sans-serif`
- **UI elements:** 11–12px. Applied by 98.css.
- **Anti-aliasing:** 98.css disables font smoothing for authenticity. No additional CSS needed.
- **CV content inside the browser window:** Can use slightly larger sizes (13–14px) for readability, since it's "web page content" inside the fake browser — not OS chrome.

## 3. What 98.css Handles (Do Not Reimplement)

98.css provides semantic classes that style standard HTML elements as Win98 components:

| Element | How to Use | What You Get |
|---|---|---|
| Buttons | `<button>` | 3D outset look, inset on `:active` |
| Windows | `<div class="window">` | Window frame with borders |
| Title bars | `<div class="title-bar">` | Blue/gray bar with title text |
| Title text | `<div class="title-bar-text">` | White text in title bar |
| Title controls | `<div class="title-bar-controls">` | Min/max/close button area |
| Window body | `<div class="window-body">` | Content area with inset border |
| Text inputs | `<input type="text">` | Inset 3D text field |
| Textareas | `<textarea>` | Inset 3D text area |
| Select | `<select>` | 3D dropdown |
| Tabs | `<menu role="tablist">` | Tab bar with raised tab look |
| Trees | `<ul role="tree">` | Tree view with expand/collapse |
| Progress bars | `<div role="progressbar">` | Chunky blue progress fill |
| Font | Auto-applied | Pixelated MS Sans Serif, anti-aliasing disabled |

**Do not write custom CSS for any of these.** If a 98.css class exists for it, use it.

## 4. Custom CSS — Layout Only

Custom CSS is needed only for structural positioning that 98.css doesn't provide:

### Desktop

- Full viewport: `width: 100vw; height: 100vh; overflow: hidden;`
- Background: `background-color: #008080;`
- Position context for windows: `position: relative;`

### Desktop Icons

- Grid layout: vertical column on the left side of the screen.
- Icon image: `32×32px` pixel-art PNGs from `src/assets/icons/`.
- Label: white text (`#ffffff`) below the icon, max-width `72px`, centered, text-overflow ellipsis.
- **Selected state:** Solid blue background (`#000080`) behind label, white text. Dotted focus ring on keyboard focus.
- **Unselected state:** White text with 1px dark text shadow for readability on teal.

### Taskbar

- Fixed bottom: `position: fixed; bottom: 0; left: 0; width: 100%; height: 28px;`
- Uses 98.css outset border on the container.
- **Start button:** Outset `<button>` with bold "Start" text + small icon.
- **Task buttons:** One per open window. Focused window's button appears inset (pressed). Others appear outset.
- **System tray:** Right-aligned clock displaying `HH:MM AM/PM`.
- **z-index:** `1000` (always above all windows).

### Window Positioning

- Absolute positioning within the desktop container.
- Position via `transform: translate(x, y)` — not `left`/`top` — for GPU-accelerated drag performance.
- `will-change: transform` during active drag.
- **z-index:** Starts at `10`, increments on focus. See `zIndex` tokens.

### Start Menu

- Positioned above the Start button.
- **z-index:** `1001` (above taskbar).
- Uses 98.css window styling with menu items.
- Grouped by `startMenuCategory`: Programs, Games, Settings (from app registry).

## 5. Z-Index Layering

| Layer | z-index | Contains |
|---|---|---|
| Desktop icons | `1` | Icon grid |
| Windows | `10+` (incrementing) | All open windows. Topmost = highest z. |
| Taskbar | `1000` | Start button, task buttons, system tray |
| Start menu | `1001` | Menu popup |
| Dialog overlays | `1002` | MessageBox dialogs (game over, email sent, etc.) |

## 6. Cursors (Optional)

Replace standard cursors with pixelated equivalents. Files served from `public/cursors/`.

```css
body {
  cursor: url('/cursors/default.cur'), default;
}
a, button {
  cursor: url('/cursors/pointer.cur'), pointer;
}
.loading {
  cursor: url('/cursors/wait.cur'), wait;
}
```

Falls back to browser defaults if `.cur` files are not present. Cursor files are a polish item — not required for MVP.

## 7. Mobile (< 768px)

Below the `breakpoints.mobile` threshold (`768px`):

- Desktop icons: centered grid (2–3 columns), larger touch targets.
- Windows: `position: fixed; inset: 0;` (full-screen, one at a time).
- Taskbar: simplified — start button + active app name only.
- No drag behavior.
- No overlapping windows.
- Single tap opens an app (no double-click).

The retro aesthetic is preserved — 98.css buttons and windows look fine at any width.

## 8. Game Visuals

Games use the **Win95 16-color palette** (see `gamePalette` in design-tokens.json).

- Canvas rendering with `imageSmoothingEnabled = false` (blocky pixels).
- Large grid cells (≥15×15px) — no sub-pixel rendering.
- No gradients, no glow, no transparency.
- Score/status displayed in 98.css status bar below the game canvas.
- Game-over uses a 98.css-styled MessageBox dialog inside the window.
