/**
 * Named z-index layers for the desktop environment.
 *
 * Values match docs/design-tokens.json. Windows get incrementing z-index
 * starting at WINDOW_BASE; the counter never resets.
 *
 * CSS files consume these via custom properties defined in global.css.
 * TypeScript code imports this map directly.
 */
export const Z_INDEX = {
  /** Desktop icon grid (below windows) */
  DESKTOP_ICONS: 1,
  /** First window z-index; incremented per focus/open */
  WINDOW_BASE: 10,
  /** Icon currently being dragged */
  DRAGGING_ICON: 100,
  /** CRT vignette overlay (pointer-events: none) */
  CRT_VIGNETTE: 997,
  /** CRT glass reflection overlay (pointer-events: none) */
  CRT_GLASS: 998,
  /** CRT scanline overlay (pointer-events: none) */
  CRT_SCANLINES: 999,
  /** Taskbar — above CRT overlays and windows */
  TASKBAR: 1000,
  /** Start menu — above taskbar */
  START_MENU: 1001,
  /** Modal/dialog overlays — topmost */
  MODAL_OVERLAY: 1002,
} as const;
