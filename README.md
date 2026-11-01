# Bierwagen Kasse

Schlanke, mobile-first Web-App für Bierwagen, Festivals oder Vereinsfeste. Servicekräfte buchen Getränke, geben Pfand aus und nehmen es zurück — ohne Einarbeitung, alles auf einem Bildschirm sichtbar.

🌐 **Live:** <https://bierwagen-kasse.de>
📦 **Repo:** <https://github.com/Webexperte-Berlin/bierwagen-kasse>
📝 **Lizenz:** MIT — frei nutzbar, forkbar, eigene Server-Hosting OK

Das Projekt besteht aus zwei Routen im selben Build:

- **`/`** — SEO-optimierte Landing-Page (statisches HTML+CSS, kein JS nötig)
- **`/app/`** — die eigentliche Kassen-App (React-SPA, PWA, offline-fähig)

## Features

- **Bestellaufnahme** mit großen Touch-Buttons (Icon · Bezeichnung · Größe · Preis)
- **Live-Bestellliste** mit +/− pro Position und automatisch berechnetem Pfand
- **Pfandrückgabe** als eigener Bereich, Beträge sichtbar in Rot abgezogen
- **Permanent sichtbare Summen** (Getränke, +Pfand, −Rückgabe, Zu zahlen)
- **Negative Endbeträge** (Kunde bekommt Geld zurück) korrekt dargestellt
- **Konfiguration** für Getränke und Pfand-Kategorien (CRUD, Icon-Auswahl)
- **Kassieren mit Rückgängig:** „Kassieren" schließt die Bestellung ab und erfasst sie in der Tagesbilanz, „Leeren" verwirft sie; „Alles zurücksetzen" stellt auch die Default-Konfig wieder her
- **Mehrere Geräte:** Hauptkasse, Nebenkassen und Kundendisplays koppeln sich per QR-Code direkt miteinander, ohne Server

## Tech

- React 18 + Vite + TypeScript
- Tailwind CSS mit semantischen Farb-Tokens (`src/index.css`)
- lucide-react
- Yjs (CRDT) + WebRTC für den Sync zwischen Geräten
- Vitest für die Sync-Logik: `npm test`
- Playwright für den echten Mehrgeräte-Ablauf über Chromium, Firefox und WebKit: `npm run test:e2e` (einmalig vorher `npx playwright install`)

Sortiment, Tagesbilanz und geteilte Einstellungen liegen in einem Yjs-Dokument, das per IndexedDB auf dem Gerät gespeichert wird; `localStorage` dient als Backup und für gerätelokale Einstellungen. Es gibt kein Backend.

### Sync-Grundregeln

- **Schreiben nur als gezielte Operation** (`src/sync/bridge.ts`). Nie „Zustand abgleichen und Unbekanntes löschen": Ein veralteter React-Zustand löscht sonst fremde Einträge.
- **Tagesbilanz ist eine Vereinigung, beim Sortiment gewinnt die Hauptkasse.** Yjs entscheidet gleichzeitige Werte nach Client-ID, also zufällig. Deshalb stellt die Hauptkasse ihren Stand nach jedem eingehenden Update wieder her (`restoreAuthoritative`).
- **Abgleich per State-Vector**, beim Verbinden und alle rund 30 Sekunden. Abweichungen reparieren sich so selbst.
- **Nachrichten über 16 KiB werden zerlegt** (`src/sync/wire.ts`), weil Browser größere SCTP-Nachrichten ablehnen.
- **Keine externen Dienste, auch kein STUN oder TURN.** `RTC_CONFIG` in `src/sync/webrtc.ts` bleibt leer, die Geräte müssen im selben Netz sein. Das Datenschutz-Versprechen hängt daran.
- **Ohne Signaling-Server gibt es kein automatisches Wiederverbinden.** Deshalb gibt die Session eine Verbindung erst nach 45 s Stille auf, und der Verlust bleibt sichtbar, bis neu gekoppelt wurde.

Änderungen am QR-Format oder Drahtprotokoll brauchen eine neue Versionsnummer in `src/sync/qrPairing.ts`.

Alle Beträge werden intern in **Cent** als Integer geführt; nur die Anzeige formatiert sie über `Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' })`. So gibt es keine Float-Rundungsfehler.

## Installation

```bash
npm install
npm run dev
```

Dev-Server:
- Landing-Page: <http://localhost:5173/>
- App: <http://localhost:5173/app/>

## Build

```bash
npm run build
npm run preview
```

`npm run build` legt einen kompletten statischen Build unter `dist/` ab.
`npm run preview` startet einen lokalen Server auf <http://localhost:4173>, der den Build genau so ausliefert, wie es ein Webserver tun würde — gut zum Verifizieren vor dem Upload.

## Deployment auf einen Webserver

Die App ist ein **rein statischer Build** — keine Node-Runtime, keine Datenbank, kein Backend. Du brauchst nur einen Webserver, der HTML/JS/CSS ausliefern kann (Apache, nginx, Caddy, oder ein klassischer Webhoster mit FTP).

### 1. Build erzeugen

```bash
npm install
npm run build
```

Alternativ als ZIP zum Upload:

```bash
npm run build:zip
# erzeugt: bierwagen-kasse.zip mit dem kompletten Inhalt von dist/
```

### 2. Inhalt von `dist/` auf den Server hochladen

Das **gesamte Verzeichnis-Inneres** von `dist/` muss ins Web-Root deines Hosts:

```
dist/
├── index.html
├── icon.svg
├── manifest.webmanifest
├── sw.js
├── .htaccess              ← Apache-Config (siehe unten)
└── assets/
    ├── index-[hash].js
    └── index-[hash].css
```

**Wichtig:** `.htaccess` wird beim Upload via FTP in vielen Clients standardmäßig **nicht** angezeigt — Hidden-Files sichtbar machen oder explizit auswählen.

### 3. Server-Konfiguration

#### Apache (Shared-Hosting, .htaccess)

Liegt schon als [public/.htaccess](public/.htaccess) im Repo, wird automatisch nach `dist/` kopiert. Sie regelt:

- **Cache-Header**: hashed JS/CSS bekommen 1 Jahr immutable, `index.html` und `sw.js` werden **nicht** gecacht (sonst sehen User keine Updates)
- **gzip-Kompression**
- **MIME-Type** für `.webmanifest`
- **Security-Header** (X-Content-Type-Options, X-Frame-Options, Referrer-Policy)
- **SPA-Fallback** (für eventuelle zukünftige Routes)

Falls dein Hoster HTTPS noch nicht erzwingt, den HTTPS-Block in der `.htaccess` einkommentieren.

#### nginx (eigener Server / VPS)

Als Vorlage liegt [nginx.conf.example](nginx.conf.example) im Repo. Anpassen (Domain, Pfad, SSL-Zertifikat) und in `/etc/nginx/sites-available/` ablegen.

```bash
sudo cp nginx.conf.example /etc/nginx/sites-available/bierwagen-kasse
# Domain und Pfad in der Datei anpassen
sudo ln -s /etc/nginx/sites-available/bierwagen-kasse /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

#### Static-Hosting (Netlify / Vercel / Cloudflare Pages / GitHub Pages)

Build-Command: `npm run build` · Publish-Directory: `dist` · Node-Version: ≥ 18.

### 4. HTTPS aktivieren

Für die PWA-Installation und den Service Worker (Offline-Modus) **muss die App über HTTPS ausgeliefert werden**. Auf `localhost` geht es ohne, online nicht.

- **Shared-Hosting**: meist per Klick im Hoster-Panel (Let's Encrypt) aktivierbar.
- **eigener Server**: Let's Encrypt via certbot — `sudo certbot --nginx -d kasse.example.de`.

### 5. Sub-Verzeichnis (z. B. `example.de/kasse/`)

Wenn die App **nicht** auf der Root-Domain liegt, vor dem Build in `vite.config.ts` setzen:

```ts
export default defineConfig({
  plugins: [react()],
  base: '/kasse/',
});
```

Außerdem in `public/manifest.webmanifest` die `start_url` und `scope` anpassen:

```json
"start_url": "/kasse/",
"scope": "/kasse/"
```

Und in `src/main.tsx` den Service-Worker-Pfad anpassen:

```ts
navigator.serviceWorker.register('/kasse/sw.js')
```

Anschließend `npm run build` neu ausführen.

### 6. Updates ausspielen

Bei einem neuen Build: einfach den Inhalt von `dist/` erneut hochladen. Der Build trägt alle Dateien samt Hash in den Service Worker ein: Browser erkennen das Update beim Öffnen, laden es im Hintergrund und nutzen es beim nächsten Start. Alte Dateien in `assets/` zunächst auf dem Server lassen, damit noch laufende Geräte sie finden.

## Bedienung

1. Tab **Sortiment** öffnen, Pfand-Kategorien und Getränke an deinen Bedarf anpassen.
2. Zurück zur **Kasse**: Tap auf ein Getränk fügt 1× zur Bestellung hinzu, Pfand wird automatisch kalkuliert. Langes Drücken bietet +5 und +10.
3. Korrekturen über die +/− Buttons in der Bestellung (am Handy: Tipp auf den Betrag öffnet sie).
4. Pfandrückgabe per Stepper: Die Beträge werden vom Endbetrag abgezogen.
5. **„Zu zahlen"** steht groß neben „Kassieren", auch als „Auszahlen", falls der Kunde Geld zurückbekommt.
6. **Kassieren** schließt die Bestellung ab und bietet kurz „Rückgängig" an. **Leeren** verwirft sie, ohne etwas zu erfassen.
7. **Alles zurücksetzen** (Tab Optionen, mit Bestätigungsschritt) setzt auch das Sortiment auf den Default-Stand zurück.

## Layout

Das Layout richtet sich nach dem verfügbaren Platz (Tailwind-Screen `regular`):

- **Schmal (Handy, Tablet hochkant):** Tab-Leiste unten, Getränke oben, darunter Pfand, Bargeld, Betrag und „Kassieren" in Daumennähe. Die Bestellung öffnet sich als Sheet.
- **Breit (Tablet quer, Handy quer, Desktop):** Tab-Leiste oben, links Getränke, rechts die komplette Bestellung bis zum Kassieren.

Tap-Targets ≥ 44 px, Text-Kontrast ≥ 4,5:1 in Hell und Dunkel, Bernstein nur für Hauptaktion und Auswahl, Rot für Rückgabe und Löschen.

## Projektstruktur

```
index.html          Landing-Page (statisch, SEO-optimiert)
app/
  index.html        App-Entry (React)
public/
  icon.svg          Logo (auf Landing referenziert)
  .htaccess         Apache-Routing + Caching
  app/
    icon-*.png      PWA-Icons
    manifest.webmanifest  PWA-Manifest (scope: /app/)
    sw.js           Service Worker; der Build trägt die Dateiliste ein
src/
  App.tsx            App-Shell, Tabs, Kassieren/Rückgängig, Yjs-Bootstrap
  main.tsx           React-Entry, Theme, Textgröße, SW-Registrierung
  reducer.ts         Zentraler Reducer (Bestellung/Rückgabe/Sortiment)
  totals.ts          Summen-Berechnung
  defaults.ts        Default-Datensätze (Getränke + Pfand)
  types.ts           Domain-Typen
  utils.ts           EUR-Formatierung, Cent-Parser, Zeit-Helfer
  hooks.ts           Uhrzeit-Takt, Media-Query, Wake-Lock
  effectivePrice.ts  Happy-Hour-Preisberechnung
  bilanz.ts          Tagesbilanz: Auswertung, Export, Import
  configIO.ts        JSON-Export/-Import + Validierung
  configStorage.ts   localStorage-Backup für das Sortiment
  settings.ts        Einstellungen, Theme
  sound.ts           Web-Audio-Beep
  icons.ts           Curated Lucide-Icons
  i18n/              Übersetzungen (de, en, fr, it)
  sync/
    webrtc.ts        SyncSession: Pairing, Heartbeat, Abgleich, Diagnose
    bridge.ts        Lesen/Schreiben im Yjs-Dokument, Vorrang der Hauptkasse
    ydoc.ts          Yjs-Dokument + IndexedDB
    qrPairing.ts     Kompaktes QR-Format
    wire.ts          Drahtformat + Fragmentierung
    lastSession.ts   Bekannte Geräte für „Neu verbinden"
    orderSnapshot.ts Bestelldaten fürs Kundendisplay
    errors.ts        Fehlercodes
    sync.test.ts     Regressionstests
  components/
    AppNav.tsx          Tab-Leisten (unten/oben)
    Sheet.tsx           Sheet auf Basis von <dialog>
    DrinkGrid.tsx       Touch-Grid für Bestellung
    DrinkButton.tsx     Einzel-Tile mit Long-Press, Storno, Bestand
    OrderSummary.tsx    Bestellung mit +/−
    PfandReturns.tsx    Pfandrückgabe-Stepper
    Checkout.tsx        Bargeld, Trinkgeld, Betrag, Kassieren
    NumpadModal.tsx     Betrag eingeben
    BilanzPanel.tsx     Tab Bilanz
    ConfigPanel.tsx     Tab Sortiment + Backup/Reset
    SettingsPanel.tsx   Tab Optionen
    SyncPanel.tsx       Tab Geräte
    SyncIndicators.tsx  Status-Chip + Verlust-Hinweis
    QrCanvas.tsx        QR-Darstellung
    QrScanner.tsx       Kamera-Scanner + Einfügen
    PairingGuide.tsx    Anleitung Koppeln
    CustomerDisplay.tsx Kundendisplay-Modus
    DsgvoModal.tsx      Datenschutz-Quickinfo
    ImpressumModal.tsx  Impressum nach § 5 DDG
    DatenschutzModal.tsx Volle Datenschutzerklärung
```
