import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, devices } from '@playwright/test';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
// biome-ignore lint/complexity/useLiteralKeys: explicit env lookup by string key
const e2ePort: string = process.env['PLAYWRIGHT_PORT'] ?? '4321';
const baseURL: string = `http://localhost:${e2ePort}`;

export default defineConfig({
  testDir: '.',
  fullyParallel: false,
  // biome-ignore lint/complexity/useLiteralKeys: explicit env lookup by string key
  forbidOnly: !!process.env['CI'],
  // biome-ignore lint/complexity/useLiteralKeys: explicit env lookup by string key
  retries: process.env['CI'] ? 1 : 0,
  workers: 1,
  // biome-ignore lint/complexity/useLiteralKeys: explicit env lookup by string key
  reporter: process.env['CI'] ? 'github' : 'list',
  use: {
    baseURL,
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
    cwd: repoRoot,
    command: 'pnpm build && node dist/server/entry.mjs',
    url: baseURL,
    // biome-ignore lint/complexity/useLiteralKeys: explicit env lookup by string key
    reuseExistingServer: !process.env['CI'],
    timeout: 120_000,
    env: {
      HOST: '0.0.0.0',
      NODE_ENV: 'production',
      PORT: e2ePort,
    },
  },
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.01,
    },
  },
});
