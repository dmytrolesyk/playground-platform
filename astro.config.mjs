// @ts-check
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import solidJs from '@astrojs/solid-js';

// https://astro.build/config
export default defineConfig({
  adapter: node({ mode: 'standalone' }),
  integrations: [solidJs()],
});
