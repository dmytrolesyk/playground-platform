import { PlaceholderApp } from './PlaceholderApp';
import { registerApp } from './registry';

// Register MVP apps with placeholder components
registerApp({
  id: 'browser',
  title: 'View CV',
  icon: '/icons/browser_icon.png',
  component: PlaceholderApp,
  desktop: true,
  startMenu: true,
  startMenuCategory: 'Programs',
  singleton: true,
  defaultSize: { width: 640, height: 480 },
  defaultProps: { name: 'CV Browser' },
});

registerApp({
  id: 'explorer',
  title: 'Export CV',
  icon: '/icons/folder_icon.png',
  component: PlaceholderApp,
  desktop: true,
  startMenu: true,
  startMenuCategory: 'Programs',
  singleton: true,
  defaultSize: { width: 500, height: 350 },
  defaultProps: { name: 'Explorer' },
});

registerApp({
  id: 'email',
  title: 'Contact Me',
  icon: '/icons/email_icon.png',
  component: PlaceholderApp,
  desktop: true,
  startMenu: true,
  startMenuCategory: 'Programs',
  singleton: true,
  defaultSize: { width: 550, height: 400 },
  defaultProps: { name: 'Email' },
});
