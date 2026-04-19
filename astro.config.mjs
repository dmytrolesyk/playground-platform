// @ts-check

import node from '@astrojs/node';
import solidJs from '@astrojs/solid-js';
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  adapter: node({ mode: 'standalone' }),
  integrations: [solidJs()],
});
