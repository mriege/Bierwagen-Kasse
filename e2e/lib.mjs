// Gemeinsamer Test-Aufbau: echte App-UI, echtes WebRTC, mehrere isolierte Browser-Kontexte.
// Nur die Kamera wird ersetzt: BarcodeDetector liefert den vom Test bereitgestellten QR-Inhalt,
// die Clipboard-API fängt den "Code kopieren"-Wert ab.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

// PLAYWRIGHT_FROM erlaubt eine andere Playwright-Installation (Pfad zu deren package.json).
const require = createRequire(process.env.PLAYWRIGHT_FROM ?? import.meta.url);
export const { chromium, firefox, webkit } = require('playwright');

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css',
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.png': 'image/png',
  '.webmanifest': 'application/manifest+json',
};

export function serve(root, port) {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://x');
    let file = path.join(root, decodeURIComponent(url.pathname));
    if (url.pathname.endsWith('/')) file = path.join(file, 'index.html');
    if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      if (url.pathname.startsWith('/app')) file = path.join(root, 'app/index.html');
      else { res.writeHead(404); res.end(); return; }
    }
    res.writeHead(200, { 'content-type': MIME[path.extname(file)] ?? 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((r) => server.listen(port, '127.0.0.1', () => r(server)));
}

export const INIT = () => {
  window.__qr = null;
  window.__copied = null;
  // Prüft, dass die App keine externen ICE-Server konfiguriert.
  window.__iceServers = [];
  const NativeConnection = window.RTCPeerConnection;
  if (NativeConnection) {
    window.RTCPeerConnection = function (config) {
      window.__iceServers.push(...(config?.iceServers ?? []));
      return new NativeConnection(config);
    };
    window.RTCPeerConnection.prototype = NativeConnection.prototype;
  }
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText: async (t) => { window.__copied = t; }, readText: async () => window.__copied ?? '' },
  });
  window.BarcodeDetector = class {
    async detect() {
      const v = window.__qr;
      if (v) { window.__qr = null; return [{ rawValue: v }]; }
      return [];
    }
  };
};

export async function launch(browserType = chromium) {
  return browserType.launch({
    args: [
      '--disable-features=WebRtcHideLocalIpsWithMdns',
      '--use-fake-ui-for-media-stream',
      '--use-fake-device-for-media-stream',
    ],
  });
}

/** seed: { config?, bilanz?, settings? } landet vor App-Start in localStorage. */
export async function device(browser, base, name, seed = {}) {
  const ctx = await browser.newContext({
    viewport: { width: 1180, height: 760 },
    serviceWorkers: 'block',
  });
  await ctx.addInitScript(INIT);
  const errors = [];
  if (Object.keys(seed).length) {
    await ctx.addInitScript((s) => {
      if (sessionStorage.getItem('__seeded')) return;
      sessionStorage.setItem('__seeded', '1');
      if (s.config) localStorage.setItem('bierwagen-kasse:config:v1', JSON.stringify(s.config));
      if (s.bilanz) localStorage.setItem('bierwagen-kasse:bilanz:v1', JSON.stringify(s.bilanz));
      if (s.settings) localStorage.setItem('bierwagen-kasse:settings:v1', JSON.stringify(s.settings));
    }, seed);
  }
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(base + '/app/');
  await page.waitForSelector('main');
  await page.waitForTimeout(250); // IndexedDB-Hydration
  return { name, ctx, page, errors };
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function openSyncTab(d) {
  await d.page.getByRole('button', { name: 'Konfiguration', exact: true }).click();
  await d.page.getByRole('button', { name: 'Geräte', exact: true }).click();
  await d.page.waitForTimeout(150);
}

export async function waitFor(fn, timeoutMs = 12000, stepMs = 100) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    const v = await fn();
    if (v) return v;
    await sleep(stepMs);
  }
  return null;
}

export const defaultConfig = (over = {}) => ({
  version: 1,
  pfandTypes: [
    { id: 'pfand-glas', label: 'Glas', amountCents: 100 },
    { id: 'pfand-mass', label: 'Maßkrug', amountCents: 500 },
  ],
  drinks: [
    { id: 'd-pils', iconName: 'Beer', label: 'Pils', size: '0,5 L', priceCents: 450, pfandTypeId: 'pfand-glas' },
    { id: 'd-helles', iconName: 'Beer', label: 'Helles', size: '0,5 L', priceCents: 450, pfandTypeId: 'pfand-glas' },
    { id: 'd-weizen', iconName: 'Wheat', label: 'Weizen', size: '0,5 L', priceCents: 480, pfandTypeId: 'pfand-glas' },
    { id: 'd-radler', iconName: 'Citrus', label: 'Radler', size: '0,5 L', priceCents: 430, pfandTypeId: 'pfand-glas' },
    { id: 'd-mass', iconName: 'Beer', label: 'Maß Helles', size: '1,0 L', priceCents: 1100, pfandTypeId: 'pfand-mass' },
    { id: 'd-spezi', iconName: 'CupSoda', label: 'Spezi', size: '0,5 L', priceCents: 380, pfandTypeId: 'pfand-glas' },
    { id: 'd-wasser', iconName: 'Droplet', label: 'Wasser', size: '0,5 L', priceCents: 300, pfandTypeId: 'pfand-glas' },
  ],
  ...over,
});

export const report = (results) => {
  console.log('\n=== Ergebnis ===');
  for (const r of results) console.log(`${r.ok ? 'OK    ' : 'FEHLER'}  ${r.name}${r.detail ? '  →  ' + r.detail : ''}`);
  const bad = results.filter((r) => !r.ok).length;
  console.log(`\n${results.length - bad}/${results.length} bestanden`);
  return bad;
};
