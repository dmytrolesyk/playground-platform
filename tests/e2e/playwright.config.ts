import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  fullyParallel: false,
  // biome-ignore lint/complexity/useLiteralKeys: TS strict requires bracket notation for index signatures
  forbidOnly: !!process.env['CI'],
  // biome-ignore lint/complexity/useLiteralKeys: TS strict requires bracket notation for index signatures
  retries: process.env['CI'] ? 1 : 0,
  workers: 1,
  // biome-ignore lint/complexity/useLiteralKeys: TS strict requires bracket notation for index signatures
  reporter: process.env['CI'] ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:4321',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
      },
    },
    {
      name: 'mobile',
      use: {
        ...devices['Pixel 5'],
        viewport: { width: 375, height: 812 },
      },
    },
  ],
  webServer: {
    command: 'pnpm build && node dist/server/entry.mjs',
    url: 'http://localhost:4321',
    // biome-ignore lint/complexity/useLiteralKeys: TS strict requires bracket notation for index signatures
    reuseExistingServer: !process.env['CI'],
    timeout: 120_000,
    env: {
      HOST: '0.0.0.0',
      NODE_ENV: 'production',
    },
  },
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.01,
    },
  },
});
