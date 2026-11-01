// Abnahmetest: echte App-UI, echtes WebRTC, mehrere isolierte Browser und Engines.
// Aufruf: npm run test:e2e  (einmalig vorher: npx playwright install)
// Einzelnes Szenario: node e2e/sync.mjs dist "Drei Geräte"
import { serve, launch, chromium, firefox, webkit, device, sleep, waitFor, defaultConfig, report, INIT } from './lib.mjs';

const ROOT = process.argv[2];
const ONLY = process.argv[3]; // optional: nur Szenarien, deren Name das enthält
const PORT = 4310;
const BASE = `http://127.0.0.1:${PORT}`;
const server = await serve(ROOT, PORT);
const browser = await launch();
const results = [];
const rec = (name, ok, detail = '') => { results.push({ name, ok, detail }); console.log(`[${ok ? 'ok' : 'FEHLER'}] ${name} ${detail}`); };

const settings = (features = {}, name) => ({
  version: 1, language: 'de', theme: 'dark', sound: false, keepAwake: false, cashStartCents: 0, displayMode: false,
  deviceId: crypto.randomUUID(), deviceName: name ?? 'Kasse-' + Math.random().toString(36).slice(2, 5),
  features: { trinkgeld: false, tagesbilanz: false, bestand: false, ...features },
});
const btn = (d, name) => d.page.getByRole('button', { name, exact: true }).first();
const nav = (d, name) => btn(d, name).click();
const toDevices = (d) => nav(d, 'Geräte');

const copyCode = async (d) => {
  await d.page.waitForSelector('canvas', { timeout: 12000 });
  await btn(d, 'Code kopieren').click();
  await sleep(50);
  return d.page.evaluate(() => window.__copied);
};
/** Über die Kamera-Attrappe (BarcodeDetector) einlesen. */
const scan = (d, code) => d.page.evaluate((v) => { window.__qr = v; }, code);
/** Über das Einfügen-Feld im Scanner einlesen. Funktioniert ohne Kamera. */
const paste = async (d, code) => {
  const area = d.page.locator('dialog textarea');
  if (!(await area.isVisible().catch(() => false))) {
    await d.page.getByText('Code einfügen statt scannen').click();
  }
  await area.fill(code);
  await btn(d, 'Code übernehmen').click();
};
const connected = (d, n) => d.page.locator(`header >> text=/^${n} verbunden$/`).count();

async function pair(master, joiner, { feed = scan, startLabel = 'Als Hauptkasse starten', delayMs = 0, expected = 1, joinLabel = 'Mit Hauptkasse verbinden' } = {}) {
  await toDevices(master); await toDevices(joiner);
  await btn(master, startLabel).click();
  const offer = await copyCode(master);
  await btn(joiner, joinLabel).click();
  await sleep(100);
  await feed(joiner, offer);
  const answer = await copyCode(joiner);
  if (delayMs) await sleep(delayMs);
  await btn(master, 'Antwort-Code scannen').click();
  await sleep(100);
  await feed(master, answer);
  return Boolean(await waitFor(() => connected(joiner, 1), 25000)) && Boolean(await waitFor(() => connected(master, expected), 10000));
}

const tile = (d, label) => d.page.getByRole('button', { name: new RegExp(`^${label},`) }).first();
const tileLabel = (d, label) => tile(d, label).getAttribute('aria-label').catch(() => null);
const hasTile = (d, label) => tile(d, label).count();

const bilanzCount = async (d) => {
  await nav(d, 'Bilanz');
  await sleep(200);
  const region = d.page.getByRole('region', { name: /Einträge/ });
  if (!(await region.count())) return 0;
  const label = await region.getAttribute('aria-label');
  return Number(label.split(' ')[0]);
};
const backupCount = (d) => d.page.evaluate(() => {
  const list = JSON.parse(localStorage.getItem('bierwagen-kasse:bilanz:v1') ?? '[]');
  return list.filter((e) => !e.deleted).length;
});
const sell = (d, n, label = 'Pils') => d.page.evaluate(async ({ n, label }) => {
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const o = { bubbles: true, clientX: 5, clientY: 5, pointerType: 'touch', isPrimary: true };
  for (let i = 0; i < n; i++) {
    const t = document.querySelector(`button[aria-label^="${label},"]`);
    t.dispatchEvent(new PointerEvent('pointerdown', o));
    t.dispatchEvent(new PointerEvent('pointerup', o));
    await wait(5);
    [...document.querySelectorAll('button')].find((b) => b.textContent.includes('Kassieren')).click();
    await wait(10 + Math.random() * 15);
  }
}, { n, label });
const close = async (...ds) => { for (const d of ds) await d.ctx.close().catch(() => {}); };

const run = async (name, fn) => {
  if (ONLY && !name.includes(ONLY)) return;
  try { await fn(); } catch (e) { rec(name, false, 'Abbruch: ' + String(e).slice(0, 500)); }
};

// ------------------------------------------------------------------------------
await run('Master gewinnt', async () => {
  let lost = 0, back = 0, wiped = 0, failed = 0; const N = 12;
  for (let i = 0; i < N; i++) {
    const cfg = defaultConfig();
    cfg.drinks = cfg.drinks.filter((d) => d.id !== 'd-radler').map((d) => (d.id === 'd-pils' ? { ...d, priceCents: 500 } : d));
    const a = await device(browser, BASE, 'master', { config: cfg, settings: settings() });
    const b = await device(browser, BASE, 'joiner', { settings: settings() });
    await tile(b, 'Spezi').click(); await tile(b, 'Spezi').click();
    if (!(await pair(a, b))) failed++;
    await sleep(500);
    await nav(a, 'Kasse'); await nav(b, 'Kasse');
    for (const d of [a, b]) {
      if (!(await tileLabel(d, 'Pils'))?.includes('5,00')) lost++;
      if (await hasTile(d, 'Radler')) back++;
    }
    if (!(await b.page.locator('main aside').first().innerText()).includes('Spezi')) wiped++;
    await close(a, b);
  }
  rec(`Koppeln klappt (${N} Läufe)`, failed === 0, `${failed} fehlgeschlagen`);
  rec(`Master-Preis bleibt auf beiden Geräten (${N} Läufe)`, lost === 0, `falsch in ${lost} Fällen`);
  rec(`Gelöschtes Getränk bleibt gelöscht (${N} Läufe)`, back === 0, `wieder da in ${back} Fällen`);
  rec(`Laufende Bestellung übersteht das Koppeln (${N} Läufe)`, wiped === 0, `gelöscht in ${wiped} Fällen`);
});

await run('Drei Geräte', async () => {
  const a = await device(browser, BASE, 'A', { settings: settings({}, 'Theke') });
  const b = await device(browser, BASE, 'B', { settings: settings({}, 'Stand') });
  const c = await device(browser, BASE, 'C', { settings: settings({}, 'Zelt') });
  rec('Erstes Koppeln', await pair(a, b));
  await sleep(300);
  // Erster Einstellungs-Wechsel nach dem Koppeln
  await nav(a, 'Optionen');
  await a.page.getByRole('switch', { name: 'Tagesbilanz' }).click();
  await sleep(700);
  const flag = await b.page.evaluate(() => JSON.parse(localStorage.getItem('bierwagen-kasse:settings:v1')).features.tagesbilanz);
  rec('Erster Einstellungs-Wechsel erreicht den Partner', flag === true, `Partner: ${flag}`);
  // Weiteres Gerät bei bestehender Verbindung
  rec('Drittes Gerät koppelt bei bestehender Verbindung', await pair(a, c, { startLabel: 'Weitere Kasse verbinden', expected: 2 }));
  await sleep(500);
  await nav(a, 'Kasse'); await nav(b, 'Kasse'); await nav(c, 'Kasse');
  await sell(c, 1);
  await sleep(900);
  rec('Verkauf an Kasse C erreicht alle', (await backupCount(a)) === 1 && (await backupCount(b)) === 1, `A=${await backupCount(a)} B=${await backupCount(b)}`);
  // Preisänderung am Master bei laufender Bestellung auf B
  await tile(b, 'Spezi').click();
  await nav(a, 'Sortiment');
  await a.page.getByRole('textbox', { name: 'Preis', exact: true }).first().fill('5,50');
  await a.page.getByRole('button', { name: 'Speichern', exact: true }).and(a.page.locator(':enabled')).first().click();
  await sleep(500);
  const priceB = await tileLabel(b, 'Pils');
  const orderB = await b.page.locator('main aside').first().innerText();
  rec('Preisänderung erreicht Partner, Bestellung bleibt', priceB?.includes('5,50') && orderB.includes('Spezi'), priceB ?? '');
  await nav(b, 'Sortiment');
  const shown = await b.page.getByRole('textbox', { name: 'Preis', exact: true }).first().inputValue();
  rec('Sortiment-Zeile zeigt den neuen Preis statt des alten', shown === '5,50', shown);
  rec('Nebenkasse kann Sortiment nicht ändern', await b.page.getByRole('textbox', { name: 'Preis', exact: true }).first().isDisabled());
  await nav(a, 'Kasse'); await nav(b, 'Kasse');
  // Last: drei Kassen gleichzeitig
  await Promise.all([sell(a, 40), sell(b, 40), sell(c, 40)]);
  await sleep(3000);
  const counts = [await backupCount(a), await backupCount(b), await backupCount(c)];
  rec('Lasttest: 120 Verkäufe auf drei Kassen, alle vollständig', counts.every((x) => x === 121), counts.join(' / '));
  await close(a, b, c);
});

await run('Verbindungsverlust', async () => {
  const features = { tagesbilanz: true };
  const a = await device(browser, BASE, 'A', { settings: settings(features, 'Theke') });
  const b = await device(browser, BASE, 'B', { settings: settings(features, 'Stand') });
  await pair(a, b);
  await sleep(300);
  await nav(a, 'Kasse'); await nav(b, 'Kasse');
  await sell(a, 1); await sell(b, 1);
  await sleep(300);
  // A wird neu geladen: Verbindung weg, kein Signaling
  await a.page.reload(); await a.page.waitForSelector('main'); await sleep(400);
  const bannerB = await waitFor(() => b.page.getByText('Keine Verbindung zu Theke').count(), 8000);
  rec('Nebenkasse meldet den Verlust dauerhaft sichtbar', Boolean(bannerB));
  const bannerA = await a.page.getByText('Keine Verbindung zu Stand').count();
  rec('Hauptkasse erinnert sich nach Neustart an verlorene Kasse', bannerA > 0);
  await sell(b, 2); await sell(a, 3); // getrennt weiter verkaufen
  await btn(b, 'Neu verbinden').click();
  await btn(a, 'Neu verbinden').click();
  await btn(a, 'Code zum Verbinden zeigen').click();
  const offer = await copyCode(a);
  await btn(b, 'Code der Hauptkasse scannen').click();
  await sleep(100);
  await scan(b, offer);
  const answer = await copyCode(b);
  await btn(a, 'Antwort-Code scannen').click();
  await sleep(100);
  await scan(a, answer);
  rec('Neu verbinden aus dem Verlust heraus klappt', Boolean(await waitFor(() => connected(b, 1), 20000)));
  await sleep(800);
  const total = await bilanzCount(a);
  rec('Getrennte Verkäufe werden zusammengeführt (2+2+3=7)', total === 7, `Hauptkasse zählt ${total}`);
  rec('Hinweis verschwindet nach dem Neu-Verbinden', (await b.page.getByText('Keine Verbindung zu').count()) === 0);
  await close(a, b);
});

await run('Pausen', async () => {
  const features = { tagesbilanz: true };
  const a = await device(browser, BASE, 'A', { settings: settings(features, 'Theke') });
  const b = await device(browser, BASE, 'B', { settings: settings(features, 'Stand') });
  await pair(a, b);
  await sleep(300);
  await nav(a, 'Kasse');
  const pause = b.page.evaluate(() => { const t = Date.now(); while (Date.now() - t < 30000) {} });
  await sleep(14000);
  const unstable = await a.page.getByText('Verbindung instabil').count();
  rec('Nach 14 s Stille: als instabil markiert, nicht getrennt', unstable > 0);
  await pause;
  await sleep(1500);
  rec('Verbindung übersteht 30 s Pause des Partners', (await connected(a, 1)) > 0 && (await connected(b, 1)) > 0);
  await sell(a, 1);
  await sleep(1500);
  rec('Nach der Pause kommen Daten wieder an', (await backupCount(b)) === 1, `B=${await backupCount(b)}`);
  await close(a, b);
});

await run('Bewusst trennen', async () => {
  const a = await device(browser, BASE, 'A', { settings: settings({}, 'Theke') });
  const b = await device(browser, BASE, 'B', { settings: settings({}, 'Stand') });
  await pair(a, b);
  await sleep(300);
  await a.page.getByRole('button', { name: /Stand: Trennen/ }).click();
  await a.page.getByRole('button', { name: /Stand: Trennen/ }).click();
  await sleep(1000);
  rec('Trennen durch die Hauptkasse löst keinen Verlust-Alarm aus',
    (await b.page.getByText('Keine Verbindung zu').count()) === 0 && (await a.page.getByText('Keine Verbindung zu').count()) === 0);
  rec('Getrenntes Gerät kann direkt neu koppeln', (await btn(b, 'Mit Hauptkasse verbinden').count()) > 0);
  await close(a, b);
});

await run('Große Bilanz', async () => {
  const entries = Array.from({ length: 900 }, (_, i) => ({
    id: `e-${i}`, timestamp: 1700000000000 + i * 1000,
    items: [
      { drinkLabel: 'Pils', drinkSize: '0,5 L', qty: 2, unitPriceCents: 450, pfandLabel: 'Glas', pfandAmountCents: 100 },
      { drinkLabel: 'Radler', drinkSize: '0,5 L', qty: 1, unitPriceCents: 430, pfandLabel: 'Glas', pfandAmountCents: 100 },
    ],
    returns: [{ pfandLabel: 'Glas', qty: 1, pfandAmountCents: 100 }],
    drinksSubtotalCents: 1330, pfandOutCents: 300, pfandReturnCents: 100, tipCents: 0, totalCents: 1530,
    paymentMethod: 'cash', deviceId: 'dev-b', deviceName: 'Hilfsstand',
  }));
  const size = JSON.stringify(entries).length;
  const features = { tagesbilanz: true };
  const a = await device(browser, BASE, 'A', { settings: settings(features) });
  const b = await device(browser, BASE, 'B', { settings: settings(features), bilanz: entries });
  await pair(a, b);
  await sleep(2000);
  const n = await bilanzCount(a);
  rec(`Große Bilanz (900 Einträge, ${Math.round(size / 1024)} KB) wird übertragen`, n === 900, `Hauptkasse zählt ${n}`);
  await close(a, b);
});

await run('Reihenfolge', async () => {
  const cfg = defaultConfig();
  cfg.drinks = [...cfg.drinks].reverse();
  const a = await device(browser, BASE, 'A', { config: cfg, settings: settings() });
  const b = await device(browser, BASE, 'B', { settings: settings() });
  await pair(a, b);
  await sleep(500);
  await nav(a, 'Kasse'); await nav(b, 'Kasse');
  const order = (d) => d.page.evaluate(() => [...document.querySelectorAll('main section button[aria-label*="€"]')].map((x) => x.getAttribute('aria-label').split(',')[0]).join(','));
  const oa = await order(a); const ob = await order(b);
  rec('Beide Geräte zeigen dieselbe Reihenfolge', oa === ob && oa.startsWith('Wasser'), oa === ob ? oa : `A: ${oa} | B: ${ob}`);
  await b.page.reload(); await b.page.waitForSelector('main'); await sleep(500);
  const ob2 = await order(b);
  rec('Reihenfolge bleibt nach Neuladen', oa === ob2, ob2);
  await close(a, b);
});

await run('Später Scan', async () => {
  const a = await device(browser, BASE, 'A', { settings: settings() });
  const b = await device(browser, BASE, 'B', { settings: settings() });
  rec('Antwort-Code wird erst nach 60 s gescannt', await pair(a, b, { delayMs: 60000 }));
  await close(a, b);
});

await run('Display', async () => {
  const a = await device(browser, BASE, 'A', { settings: settings({}, 'Theke') });
  const b = await device(browser, BASE, 'B', { settings: settings({}, 'Stand') });
  const d1 = await device(browser, BASE, 'D1', { settings: settings({}, 'Display 1') });
  const d2 = await device(browser, BASE, 'D2', { settings: settings({}, 'Display 2') });
  await pair(a, b);
  await sleep(300);
  const addDisplay = async (d, expected) => {
    await toDevices(d);
    await btn(d, 'Als Display nutzen').click();
    await sleep(300);
    const label = expected === 2 ? 'Display verbinden' : 'Weiteres Display verbinden';
    await btn(a, label).click();
    const offer = await copyCode(a);
    await btn(d, 'Kassen-QR scannen').click();
    await sleep(100);
    await scan(d, offer);
    const answer = await copyCode(d);
    await btn(a, 'Antwort-Code scannen').click();
    await sleep(100);
    await scan(a, answer);
    return Boolean(await waitFor(() => connected(a, expected), 20000));
  };
  rec('Display koppelt, während eine Kasse verbunden ist', await addDisplay(d1, 2));
  rec('Zweites Display koppelt ebenfalls', await addDisplay(d2, 3));
  await nav(a, 'Kasse');
  await tile(a, 'Pils').click();
  await sleep(500);
  const shown = await d1.page.locator('main').innerText();
  const shown2 = await d2.page.locator('main').innerText();
  rec('Beide Displays zeigen die Bestellung', shown.includes('Pils') && shown2.includes('Pils') && shown.includes('5,50'), shown.split('\n').slice(0, 3).join(' | '));
  await close(a, b, d1, d2);
});

await run('Kassieren', async () => {
  const a = await device(browser, BASE, 'A', { settings: settings({ tagesbilanz: true }) });
  await tile(a, 'Pils').click();
  await tile(a, 'Pils').click();
  await btn(a, 'Kassieren').click();
  await sleep(100);
  rec('Kassieren leert die Bestellung und zeigt die Summe', (await a.page.getByText('Kassiert: 11,00 €').count()) > 0);
  await btn(a, 'Rückgängig').click();
  await sleep(100);
  const label = await tileLabel(a, 'Pils');
  rec('Rückgängig stellt die Bestellung wieder her', label?.includes('2 in der Bestellung'), label ?? '');
  const n = await bilanzCount(a);
  rec('Rückgängig nimmt den Bilanz-Eintrag zurück', n === 0, `${n} Einträge`);
  await nav(a, 'Kasse');
  await btn(a, 'Leeren').click();
  await sleep(100);
  rec('Leeren entfernt die Bestellung', !(await tileLabel(a, 'Pils'))?.includes('in der Bestellung'));
  const n2 = await bilanzCount(a);
  rec('Leeren erfasst keinen Verkauf', n2 === 0, `${n2} Einträge`);
  // Tastatur: Fokus + Enter darf nicht tot sein
  await nav(a, 'Kasse');
  await tile(a, 'Weizen').focus();
  await a.page.keyboard.press('Enter');
  await sleep(100);
  rec('Getränk lässt sich per Tastatur hinzufügen', (await tileLabel(a, 'Weizen'))?.includes('1 in der Bestellung'), await tileLabel(a, 'Weizen'));
  await close(a);
});

await run('Reset', async () => {
  const a = await device(browser, BASE, 'A', { settings: settings() });
  await nav(a, 'Optionen');
  const reset = a.page.getByRole('button', { name: 'Alles zurücksetzen', exact: true });
  await reset.click();
  await a.page.getByRole('button', { name: 'Wirklich alles löschen?' }).click();
  await a.page.waitForLoadState('load');
  await sleep(800);
  await a.page.waitForSelector('main');
  await toDevices(a);
  await sleep(300);
  rec('Nach „Alles zurücksetzen" ist Sync sofort wieder verfügbar', (await btn(a, 'Als Hauptkasse starten').count()) > 0);
  await close(a);
});

await run('Offline', async () => {
  const ctx = await browser.newContext({ viewport: { width: 1180, height: 760 } });
  const page = await ctx.newPage();
  await page.goto(BASE + '/app/');
  await page.waitForSelector('main');
  await page.evaluate(() => Promise.race([navigator.serviceWorker.ready, new Promise((_, rej) => setTimeout(() => rej(new Error('SW-Installation hängt')), 15000))]));
  await sleep(1000);
  await ctx.setOffline(true);
  let ok = true, detail = '';
  try {
    await page.reload({ timeout: 8000 });
    await page.waitForSelector('main', { timeout: 6000 });
  } catch (e) { ok = false; detail = String(e).slice(0, 120); }
  rec('App startet offline nach genau einem Online-Besuch', ok, detail);
  if (ok) {
    await page.getByRole('button', { name: 'Geräte', exact: true }).first().click();
    const syncOk = await waitFor(() => page.getByRole('button', { name: 'Als Hauptkasse starten' }).count(), 4000);
    rec('Geräte-Tab funktioniert offline', Boolean(syncOk));
  }
  await ctx.close();
});

await run('Nur lokal', async () => {
  // Mit mDNS-Verschleierung wie im Normalbetrieb. Echtes Offline lässt sich hier nicht
  // prüfen: Playwrights setOffline blockiert auch nacktes WebRTC, mit und ohne STUN.
  const local = await chromium.launch({ args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] });
  const a = await device(local, BASE, 'A', { settings: settings({ tagesbilanz: true }, 'Theke') });
  const b = await device(local, BASE, 'B', { settings: settings({ tagesbilanz: true }, 'Stand') });
  rec('Koppeln mit mDNS-Adressen, ohne STUN', await pair(a, b, { feed: paste }));
  const servers = [...(await a.page.evaluate(() => window.__iceServers)), ...(await b.page.evaluate(() => window.__iceServers))];
  rec('Kein externer ICE-Server konfiguriert', servers.length === 0, JSON.stringify(servers));
  await nav(a, 'Kasse'); await nav(b, 'Kasse');
  await sell(b, 1); await sell(a, 1);
  await sleep(1500);
  const counts = [await backupCount(a), await backupCount(b)];
  rec('Verkäufe kommen an', counts[0] === 2 && counts[1] === 2, counts.join(' / '));
  await nav(a, 'Geräte');
  await btn(a, 'Weitere Kasse verbinden').click();
  await a.page.waitForSelector('canvas', { timeout: 12000 });
  await sleep(200);
  const modules = await a.page.evaluate(() => document.querySelector('canvas').dataset.modules);
  console.log(`QR-Code ohne STUN: ${modules} Module`);
  await close(a, b);
  await local.close();
});

await run('Browser-Mix', async () => {
  const fx = await firefox.launch({ firefoxUserPrefs: { 'media.navigator.streams.fake': true, 'media.navigator.permission.disabled': true } });
  const wk = await webkit.launch();
  for (const [name, other] of [['Firefox', fx], ['WebKit/Safari-Engine', wk]]) {
    for (const [mName, jName, mB, jB] of [['Chromium', name, browser, other], [name, 'Chromium', other, browser]]) {
      const features = { tagesbilanz: true };
      const a = await device(mB, BASE, 'A', { settings: settings(features, 'Theke') });
      const b = await device(jB, BASE, 'B', { settings: settings(features, 'Stand') });
      const ok = await pair(a, b, { feed: paste });
      rec(`${mName} (Haupt) ↔ ${jName}: Koppeln per Code einfügen`, ok);
      if (ok) {
        await sleep(400);
        await nav(a, 'Kasse'); await nav(b, 'Kasse');
        await sell(b, 2); await sell(a, 1);
        await sleep(1500);
        const counts = [await backupCount(a), await backupCount(b)];
        rec(`${mName} ↔ ${jName}: Verkäufe kommen an`, counts[0] === 3 && counts[1] === 3, counts.join(' / '));
      }
      await close(a, b);
    }
  }
  // Später Scan: Chromium und WebKit warten beliebig lange. Firefox gibt den
  // Antwort-Code nach rund 25 s auf (bekannte Grenze, siehe Dokumentation).
  for (const [name, other, delayMs] of [['Firefox', fx, 20000], ['WebKit/Safari-Engine', wk, 45000]]) {
    const a = await device(browser, BASE, 'A', { settings: settings() });
    const b = await device(other, BASE, 'B', { settings: settings() });
    rec(`${name}: Antwort-Code wird nach ${delayMs / 1000} s gescannt`, await pair(a, b, { feed: paste, delayMs }));
    await close(a, b);
  }
  await fx.close(); await wk.close();
});

const bad = report(results);
await browser.close();
server.close();
process.exit(bad ? 1 : 0);
