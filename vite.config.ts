import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { PYODIDE_VERSION } from './src/python/version.ts';

export default defineConfig({
  // Relative base so the site works under https://<user>.github.io/<repo>/
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: false,
      includeAssets: ['favicon.svg', 'icons/*.png'],
      manifest: {
        name: 'Epoch',
        short_name: 'Epoch',
        description: 'Daily bite-sized lessons from Python basics to AI engineering.',
        start_url: './',
        scope: './',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#f6f4ef',
        theme_color: '#f6f4ef',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}'],
        navigateFallback: 'index.html',
        // Control the page on first visit, so Python downloaded in that
        // first session is already cached for offline use.
        clientsClaim: true,
        skipWaiting: true,
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        runtimeCaching: [
          {
            // Pyodide core, stdlib and the numpy wheel: cached the first time
            // Python is needed, then served offline.
            urlPattern: ({ url }) =>
              url.origin === 'https://cdn.jsdelivr.net' &&
              url.pathname.startsWith(`/pyodide/v${PYODIDE_VERSION}/`),
            handler: 'CacheFirst',
            options: {
              cacheName: `pyodide-${PYODIDE_VERSION}`,
              cacheableResponse: { statuses: [0, 200] },
              expiration: { maxEntries: 80 },
            },
          },
        ],
      },
    }),
  ],
  test: {
    include: ['tests/**/*.test.ts'],
  },
} as any);
