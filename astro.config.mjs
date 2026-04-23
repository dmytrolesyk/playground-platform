// @ts-check

import node from '@astrojs/node';
import solidJs from '@astrojs/solid-js';
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  adapter: node({ mode: 'standalone' }),
  integrations: [solidJs()],
  vite: {
    build: {
      // The single-island desktop app intentionally ships a larger client bundle.
      // Raise the warning threshold so build output stays signal-heavy.
      chunkSizeWarningLimit: 1000,
    },
  },
});
