// Beide Platzhalter füllt der Build (siehe vite.config.ts).
const CACHE = 'bierwagen-kasse-__BUILD_HASH__';
const APP_ROOT = '/app/';
const PRECACHE = /*__PRECACHE__*/ [];

// Alles sofort laden, nicht erst bei Bedarf: Auf dem Festplatz ist oft kein Netz
// mehr da, und eine einzige fehlende Datei hieße weißer Bildschirm.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll([APP_ROOT, ...PRECACHE]))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
      ),
      self.clients.claim(),
    ]),
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Die App startet aus dem Cache, damit schlechtes Netz sie nicht aufhält.
  // Updates laufen über den Browser-Check der sw.js und greifen beim nächsten Start.
  if (request.mode === 'navigate') {
    event.respondWith(
      caches.match(APP_ROOT).then((cached) => cached || fetch(request)),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request)),
  );
});
