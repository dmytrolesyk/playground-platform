import { BrowserApp } from './BrowserApp';
import { EmailApp } from './EmailApp';
import { ExplorerApp } from './ExplorerApp';
import { registerApp } from './registry';

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

registerApp({
  id: 'email',
  title: 'Contact Me',
  icon: '/icons/email_icon.png',
  component: EmailApp,
  desktop: true,
  startMenu: true,
  startMenuCategory: 'Programs',
  singleton: true,
  defaultSize: { width: 550, height: 400 },
});
