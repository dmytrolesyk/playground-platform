import { lazy } from 'solid-js';
import { BrowserApp } from './BrowserApp';
import { ContactApp } from './ContactApp';
import { EmailApp } from './EmailApp';
import { ExplorerApp } from './ExplorerApp';
import { registerApp } from './registry';

const TerminalApp = lazy(() => import('./TerminalApp').then((m) => ({ default: m.TerminalApp })));
const SnakeGame = lazy(() => import('./games/Snake').then((m) => ({ default: m.SnakeGame })));
const LibraryApp = lazy(() =>
  import('./library/LibraryApp').then((m) => ({ default: m.LibraryApp })),
);

// Register MVP apps
registerApp({
  id: 'browser',
  title: 'View CV',
  icon: '/icons/browser_icon.png',
  component: BrowserApp,
  desktop: true,
  startMenu: true,
  startMenuCategory: 'Programs',
  singleton: true,
  defaultSize: { width: 640, height: 480 },
});

registerApp({
  id: 'explorer',
  title: 'Export CV',
  icon: '/icons/folder_icon.png',
  component: ExplorerApp,
  desktop: true,
  startMenu: true,
  startMenuCategory: 'Programs',
  singleton: true,
  defaultSize: { width: 500, height: 350 },
});

// Email app — opened from ContactApp, not shown on desktop/start menu directly
registerApp({
  id: 'email',
  title: 'Send Email',
  icon: '/icons/email_icon.png',
  component: EmailApp,
  desktop: false,
  startMenu: false,
  singleton: true,
  defaultSize: { width: 550, height: 400 },
});

// Contact chooser — shown on desktop/start menu
registerApp({
  id: 'contact',
  title: 'Contact Me',
  icon: '/icons/email_icon.png',
  component: ContactApp,
  desktop: true,
  startMenu: true,
  startMenuCategory: 'Programs',
  singleton: true,
  defaultSize: { width: 300, height: 180 },
});

registerApp({
  id: 'terminal',
  title: 'Terminal',
  icon: '/icons/terminal_icon.png',
  component: TerminalApp,
  desktop: true,
  startMenu: true,
  startMenuCategory: 'Programs',
  singleton: true,
  defaultSize: { width: 640, height: 400 },
});

registerApp({
  id: 'snake',
  title: 'Snake',
  icon: '/icons/snake_icon.png',
  component: SnakeGame,
  desktop: true,
  startMenu: true,
  startMenuCategory: 'Games',
  singleton: true,
  defaultSize: { width: 405, height: 460 },
});

registerApp({
  id: 'library',
  title: 'Knowledge Base',
  icon: '/icons/library_icon.png',
  component: LibraryApp,
  desktop: true,
  startMenu: true,
  startMenuCategory: 'Programs',
  singleton: true,
  defaultSize: { width: 700, height: 500 },
});
