// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  // other config options...
  vite: {
    ssr: {
      noExternal: ['tinybase'],
    },
  },
});
