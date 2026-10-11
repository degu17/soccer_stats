import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// base: './' + single-file output so dist/index.html works when opened directly from disk.
export default defineConfig({
  base: './',
  plugins: [preact(), viteSingleFile()],
  build: { assetsInlineLimit: 0 },
});
