import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

const appVersion = (
  JSON.parse(readFileSync('package.json', 'utf8')) as { version: string }
).version;

const SW_FILE = 'dist/app/sw.js';
const STATIC_PRECACHE = [
  '/app/manifest.webmanifest',
  '/app/icon.svg',
  '/app/icon-192.png',
  '/app/apple-touch-icon.png',
];

/**
 * Trägt alle Build-Dateien in den Service Worker ein. Ein neuer Build ergibt einen
 * neuen Cache-Namen, damit Browser das Update erkennen und Altes aufräumen.
 */
function serviceWorkerPrecache(): Plugin {
  let assets: string[] = [];
  return {
    name: 'sw-precache',
    apply: 'build',
    generateBundle(_, bundle) {
      assets = Object.keys(bundle)
        .filter((file) => file.startsWith('assets/'))
        .map((file) => `/${file}`);
    },
    closeBundle() {
      // Leere Einstiegs-Chunks stehen im Bundle, landen aber nicht auf der Platte.
      // Eine einzige fehlende Datei würde die ganze SW-Installation scheitern lassen.
      const precache = [...STATIC_PRECACHE, ...assets].filter((file) =>
        existsSync(`dist${file}`),
      );
      const hash = createHash('sha256')
        .update(precache.join())
        .digest('hex')
        .slice(0, 12);
      const source = readFileSync(SW_FILE, 'utf8')
        .replace('__BUILD_HASH__', hash)
        .replace('/*__PRECACHE__*/ []', JSON.stringify(precache));
      writeFileSync(SW_FILE, source);
    },
  };
}

export default defineConfig({
  plugins: [react(), serviceWorkerPrecache()],
  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
  },
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        app: 'app/index.html',
      },
    },
  },
});
