import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'node:fs';

import { cloudflare } from "@cloudflare/vite-plugin";

const packageMetadata = JSON.parse(
  readFileSync(new URL('./package.json', import.meta.url), 'utf8'),
) as { version: string };

export default defineConfig({
  plugins: [react(), cloudflare()],
  define: {
    __APP_VERSION__: JSON.stringify(packageMetadata.version),
  },
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.ts'],
  },
});