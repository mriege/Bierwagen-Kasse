import { generateId } from './utils';

export type PaymentMethod = 'cash' | 'card' | 'other';

export type BilanzLine = {
  drinkLabel: string;
  drinkSize: string;
  qty: number;
  unitPriceCents: number;
  pfandLabel: string | null;
  pfandAmountCents: number;
};

export type BilanzReturn = {
  pfandLabel: string;
  qty: number;
  pfandAmountCents: number;
};

export type BilanzEntry = {
  id: string;
  timestamp: number;
  items: BilanzLine[];
  returns: BilanzReturn[];
  drinksSubtotalCents: number;
  pfandOutCents: number;
  pfandReturnCents: number;
  tipCents: number;
  totalCents: number;
  paymentMethod: PaymentMethod;
  /**
   * Tombstone-Flag für Sync. Geräte sehen tombstoned-Einträge nicht mehr
   * in der UI, der Eintrag wird aber im Yjs-Doc behalten, damit Delete-Operationen
   * über Peers propagiert werden (Delete-wins). Nicht gesetzt = sichtbar.
   */
  deleted?: boolean;
  /** ID des Geräts, das den Eintrag erfasst hat (stabil pro Gerät). */
  deviceId?: string;
  /** Anzeige-Name des Geräts zum Erfassungs-Zeitpunkt (Snapshot, ändert sich nicht
   *  wenn das Gerät später umbenannt wird — historische Korrektheit). */
  deviceName?: string;
};

/** Sichtbare Einträge (ohne Tombstones) — überall dort verwenden, wo der User die Bilanz sieht. */
export const visibleEntries = (entries: BilanzEntry[]): BilanzEntry[] =>
  entries.filter((e) => e.deleted !== true);

const KEY = 'bierwagen-kasse:bilanz:v1';

const isAvailable = (): boolean => {
  try {
    return typeof window !== 'undefined' && !!window.localStorage;
  } catch {
    return false;
  }
};

export function loadBilanz(): BilanzEntry[] {
  if (!isAvailable()) return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidEntry);
  } catch {
    return [];
  }
}

export function saveBilanz(entries: BilanzEntry[]): void {
  if (!isAvailable()) return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(entries));
  } catch {
    /* ignore */
  }
}

export function clearBilanz(): void {
  if (!isAvailable()) return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

function isValidEntry(e: unknown): e is BilanzEntry {
  if (!e || typeof e !== 'object') return false;
  const x = e as Partial<BilanzEntry>;
  return (
    typeof x.id === 'string' &&
    typeof x.timestamp === 'number' &&
    Array.isArray(x.items) &&
    Array.isArray(x.returns) &&
    typeof x.totalCents === 'number' &&
    (x.deleted === undefined || typeof x.deleted === 'boolean')
  );
}

export function makeEntryFromOrder(input: {
  items: BilanzLine[];
  returns: BilanzReturn[];
  drinksSubtotalCents: number;
  pfandOutCents: number;
  pfandReturnCents: number;
  tipCents: number;
  paymentMethod: PaymentMethod;
  /** Optional: Erfassungs-Gerät — wird in BilanzModal + CSV gezeigt. */
  deviceId?: string;
  deviceName?: string;
}): BilanzEntry {
  const totalCents =
    input.drinksSubtotalCents +
    input.pfandOutCents -
    input.pfandReturnCents +
    input.tipCents;
  return {
    id: generateId(),
    timestamp: Date.now(),
    items: input.items,
    returns: input.returns,
    drinksSubtotalCents: input.drinksSubtotalCents,
    pfandOutCents: input.pfandOutCents,
    pfandReturnCents: input.pfandReturnCents,
    tipCents: input.tipCents,
    totalCents,
    paymentMethod: input.paymentMethod,
    deviceId: input.deviceId,
    deviceName: input.deviceName,
  };
}

export function recomputeEntryTotal(entry: BilanzEntry): BilanzEntry {
  const drinksSubtotalCents = entry.items.reduce(
    (s, l) => s + l.unitPriceCents * l.qty,
    0,
  );
  const pfandOutCents = entry.items.reduce(
    (s, l) => s + l.pfandAmountCents * l.qty,
    0,
  );
  const pfandReturnCents = entry.returns.reduce(
    (s, l) => s + l.pfandAmountCents * l.qty,
    0,
  );
  return {
    ...entry,
    drinksSubtotalCents,
    pfandOutCents,
    pfandReturnCents,
    totalCents:
      drinksSubtotalCents + pfandOutCents - pfandReturnCents + entry.tipCents,
  };
}

export type ProductSummary = {
  label: string;
  size: string;
  totalQty: number;
  totalRevenueCents: number;
  totalPfandCents: number;
};

export type ReturnSummary = {
  label: string;
  totalQty: number;
  totalAmountCents: number;
};

export function aggregateByProduct(entries: BilanzEntry[]): {
  products: ProductSummary[];
  returns: ReturnSummary[];
} {
  const productMap = new Map<string, ProductSummary>();
  const live = visibleEntries(entries);
  for (const e of live) {
    for (const item of e.items) {
      const key = `${item.drinkLabel}${item.drinkSize}`;
      const existing = productMap.get(key);
      if (existing) {
        existing.totalQty += item.qty;
        existing.totalRevenueCents += item.unitPriceCents * item.qty;
        existing.totalPfandCents += item.pfandAmountCents * item.qty;
      } else {
        productMap.set(key, {
          label: item.drinkLabel,
          size: item.drinkSize,
          totalQty: item.qty,
          totalRevenueCents: item.unitPriceCents * item.qty,
          totalPfandCents: item.pfandAmountCents * item.qty,
        });
      }
    }
  }

  const returnMap = new Map<string, ReturnSummary>();
  for (const e of live) {
    for (const r of e.returns) {
      const existing = returnMap.get(r.pfandLabel);
      if (existing) {
        existing.totalQty += r.qty;
        existing.totalAmountCents += r.pfandAmountCents * r.qty;
      } else {
        returnMap.set(r.pfandLabel, {
          label: r.pfandLabel,
          totalQty: r.qty,
          totalAmountCents: r.pfandAmountCents * r.qty,
        });
      }
    }
  }

  return {
    products: Array.from(productMap.values()).sort((a, b) => b.totalQty - a.totalQty),
    returns: Array.from(returnMap.values()).sort((a, b) => b.totalQty - a.totalQty),
  };
}

const csvFmt = (cents: number) => (cents / 100).toFixed(2).replace('.', ',');

export const csvEscape = (raw: string): string => {
  // Tabellenprogramme führen Zellen mit = + - @ als Formel aus. Bezeichnungen
  // kommen auch von anderen Geräten, deshalb als Text kennzeichnen.
  const s = /^[=+\-@\t]/.test(raw) ? `'${raw}` : raw;
  // Felder mit ; , " oder Newline müssen in "" gequotet werden, " wird verdoppelt
  if (/[;,"\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
};

const fmtDate = (ts: number): string =>
  new Intl.DateTimeFormat('de-DE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
    .format(new Date(ts))
    .replace(/\./g, '-')
    .split('-')
    .reverse()
    .join('-');

const fmtTime = (ts: number): string =>
  new Intl.DateTimeFormat('de-DE', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(ts));

const paymentLabel = (m: PaymentMethod): string =>
  m === 'cash' ? 'Bar' : m === 'card' ? 'Karte' : 'Sonstiges';

/** Detail-CSV: eine Zeile pro Drink-Position bzw. Pfand-Rückgabe */
export function buildBilanzCsv(
  entries: BilanzEntry[],
  cashStartCents: number,
): string {
  const headers = [
    'Datum',
    'Zeit',
    'Bestell-ID',
    'Pos',
    'Typ',
    'Anzahl',
    'Bezeichnung',
    'Größe',
    'Einzelpreis',
    'Pfand-Einzeln',
    'Zwischensumme',
    'Trinkgeld',
    'Zahlart',
    'Bestellung-Total',
    'Gerät',
  ];

  const rows: string[] = [headers.join(';')];

  // Sortiert chronologisch — tombstoned Entries werden ignoriert
  const sorted = visibleEntries(entries).sort((a, b) => a.timestamp - b.timestamp);

  for (const e of sorted) {
    const date = fmtDate(e.timestamp);
    const time = fmtTime(e.timestamp);
    const pay = paymentLabel(e.paymentMethod);
    const device = csvEscape(e.deviceName ?? '');
    let posIdx = 1;
    for (const item of e.items) {
      rows.push(
        [
          date,
          time,
          e.id,
          String(posIdx++),
          'Verkauf',
          String(item.qty),
          csvEscape(item.drinkLabel),
          csvEscape(item.drinkSize),
          csvFmt(item.unitPriceCents),
          csvFmt(item.pfandAmountCents),
          csvFmt((item.unitPriceCents + item.pfandAmountCents) * item.qty),
          // Trinkgeld nur in der ERSTEN Position der Bestellung anzeigen
          posIdx === 2 ? csvFmt(e.tipCents) : csvFmt(0),
          posIdx === 2 ? pay : '',
          posIdx === 2 ? csvFmt(e.totalCents) : '',
          posIdx === 2 ? device : '',
        ].join(';'),
      );
    }
    for (const r of e.returns) {
      rows.push(
        [
          date,
          time,
          e.id,
          String(posIdx++),
          'Pfand-Rückgabe',
          String(r.qty),
          csvEscape(r.pfandLabel),
          '',
          '0,00',
          `-${csvFmt(r.pfandAmountCents)}`,
          `-${csvFmt(r.pfandAmountCents * r.qty)}`,
          '0,00',
          '',
          '',
          '',
        ].join(';'),
      );
    }
  }

  // Footer mit Summary
  const summary = summarize(sorted, cashStartCents);
  rows.push('');
  rows.push(['Anfangsbestand Kasse', csvFmt(cashStartCents)].join(';'));
  rows.push(['Brutto-Umsatz', csvFmt(summary.grossCents)].join(';'));
  rows.push(['Trinkgeld gesamt', csvFmt(summary.tipCents)].join(';'));
  rows.push(['Bar-Einnahmen', csvFmt(summary.cashCents)].join(';'));
  rows.push(['Soll in Kasse', csvFmt(summary.expectedDrawerCents)].join(';'));
  rows.push(['Bestellungen gesamt', String(summary.count)].join(';'));

  // BOM für Excel-Kompatibilität (UTF-8 mit Umlauten)
  return '﻿' + rows.join('\r\n');
}

export function downloadBilanzCsv(
  entries: BilanzEntry[],
  cashStartCents: number,
): void {
  if (typeof window === 'undefined') return;
  const csv = buildBilanzCsv(entries, cashStartCents);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const ts = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `tagesbilanz-${ts}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* ===========================================================================
 * JSON-EXPORT / IMPORT (für Backups + Wiederherstellung)
 * =========================================================================== */

export type BilanzExport = {
  format: 'bierwagen-kasse-bilanz';
  version: 1;
  exportedAt: number;
  cashStartCents: number;
  entries: BilanzEntry[];
};

export function buildBilanzJson(
  entries: BilanzEntry[],
  cashStartCents: number,
): string {
  const payload: BilanzExport = {
    format: 'bierwagen-kasse-bilanz',
    version: 1,
    exportedAt: Date.now(),
    cashStartCents,
    entries,
  };
  return JSON.stringify(payload, null, 2);
}

export function downloadBilanzJson(
  entries: BilanzEntry[],
  cashStartCents: number,
): void {
  if (typeof window === 'undefined') return;
  const json = buildBilanzJson(entries, cashStartCents);
  const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const ts = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `tagesbilanz-${ts}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export type ParseBilanzResult =
  | { ok: true; entries: BilanzEntry[]; cashStartCents: number | null }
  | { ok: false; error: string };

export function parseBilanzJson(text: string): ParseBilanzResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'Ungültiges JSON',
    };
  }
  if (!parsed || typeof parsed !== 'object') {
    return { ok: false, error: 'JSON ist kein Objekt' };
  }
  const obj = parsed as {
    format?: string;
    version?: number;
    cashStartCents?: number;
    entries?: unknown[];
    pfandTypes?: unknown;
    drinks?: unknown;
  };
  // Häufiger User-Fehler: Sortiments-Konfig wurde in den Bilanz-Import geladen.
  if (
    obj.format === 'bierwagen-kasse-config' ||
    Array.isArray(obj.pfandTypes) ||
    Array.isArray(obj.drinks)
  ) {
    return {
      ok: false,
      error:
        'Diese Datei ist ein Sortiment, keine Tagesbilanz. Bitte den Button „Sortiment importieren" weiter oben nutzen.',
    };
  }
  if (obj.format !== 'bierwagen-kasse-bilanz') {
    return {
      ok: false,
      error:
        'Datei ist keine Tagesbilanz-Datei (Format-Marker fehlt oder falsch).',
    };
  }
  if (obj.version !== 1) {
    return { ok: false, error: `Version ${obj.version} wird nicht unterstützt` };
  }
  if (!Array.isArray(obj.entries)) {
    return { ok: false, error: 'Feld "entries" fehlt oder ist kein Array' };
  }
  const valid = (obj.entries as unknown[]).filter(isValidEntry) as BilanzEntry[];
  return {
    ok: true,
    entries: valid,
    cashStartCents:
      typeof obj.cashStartCents === 'number' ? obj.cashStartCents : null,
  };
}

/* ===========================================================================
 * PRINT (HTML-View, druckfreundlich)
 * =========================================================================== */

const escHtml = (s: string): string =>
  s.replace(/[&<>"']/g, (c) =>
    c === '&'
      ? '&amp;'
      : c === '<'
        ? '&lt;'
        : c === '>'
          ? '&gt;'
          : c === '"'
            ? '&quot;'
            : '&#39;',
  );

const eur = (cents: number): string =>
  new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(cents / 100);

const fmtFullDateTime = (ts: number): string =>
  new Intl.DateTimeFormat('de-DE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(ts));

export function buildBilanzPrintHtml(
  entries: BilanzEntry[],
  cashStartCents: number,
): string {
  const live = visibleEntries(entries).sort((a, b) => a.timestamp - b.timestamp);
  const summary = summarize(entries, cashStartCents);
  const { products, returns } = aggregateByProduct(entries);

  const firstTs = live[0]?.timestamp;
  const lastTs = live[live.length - 1]?.timestamp;
  const dateRange =
    firstTs && lastTs
      ? firstTs === lastTs
        ? fmtFullDateTime(firstTs)
        : `${fmtFullDateTime(firstTs)} – ${fmtFullDateTime(lastTs)}`
      : '–';

  const exportedAt = fmtFullDateTime(Date.now());

  const productRows = products
    .map(
      (p) => `
    <tr>
      <td class="num">${p.totalQty}×</td>
      <td>${escHtml(p.label)}${p.size ? ` <span class="muted">${escHtml(p.size)}</span>` : ''}</td>
      <td class="num right">${eur(p.totalRevenueCents)}</td>
      <td class="num right">${p.totalPfandCents > 0 ? eur(p.totalPfandCents) : '–'}</td>
    </tr>`,
    )
    .join('');

  const returnRows = returns
    .map(
      (r) => `
    <tr class="ret">
      <td class="num">−${r.totalQty}×</td>
      <td>${escHtml(r.label)} (Pfand-Rückgabe)</td>
      <td class="num right">−${eur(r.totalAmountCents)}</td>
      <td></td>
    </tr>`,
    )
    .join('');

  const entryBlocks = live
    .map((e) => {
      const time = fmtFullDateTime(e.timestamp);
      const lines = e.items
        .map(
          (l) => `
        <div class="entry-line">
          <span class="num">${l.qty}× </span>${escHtml(l.drinkLabel)}${
            l.drinkSize ? ` <span class="muted">${escHtml(l.drinkSize)}</span>` : ''
          }${l.pfandLabel ? ` <span class="muted">+ ${escHtml(l.pfandLabel)}</span>` : ''}
          <span class="num right">${eur((l.unitPriceCents + l.pfandAmountCents) * l.qty)}</span>
        </div>`,
        )
        .join('');
      const rets = e.returns
        .map(
          (r) => `
        <div class="entry-line ret">
          <span class="num">−${r.qty}× </span>${escHtml(r.pfandLabel)} (Pfand zurück)
          <span class="num right">−${eur(r.pfandAmountCents * r.qty)}</span>
        </div>`,
        )
        .join('');
      const tipLine =
        e.tipCents > 0
          ? `<div class="entry-line tip">+ Trinkgeld <span class="num right">${eur(e.tipCents)}</span></div>`
          : '';
      const dev = e.deviceName
        ? ` <span class="badge">${escHtml(e.deviceName)}</span>`
        : '';
      return `
    <article class="entry">
      <header class="entry-head">
        <span>${escHtml(time)}${dev}</span>
        <span class="num right">${eur(e.totalCents)}</span>
      </header>
      <div class="entry-meta">
        ${escHtml(paymentLabel(e.paymentMethod))} · ID ${escHtml(e.id.slice(0, 8))}
      </div>
      ${lines}${rets}${tipLine}
    </article>`;
    })
    .join('');

  return `<!doctype html>
<html lang="de">
  <head>
    <meta charset="utf-8" />
    <title>Tagesbilanz ${escHtml(new Date().toISOString().slice(0, 10))}</title>
    <style>
      @page { size: A4; margin: 1.4cm; }
      * { box-sizing: border-box; }
      body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
        font-size: 10.5pt;
        color: #18181b;
        margin: 0;
      }
      h1 { font-size: 18pt; margin: 0 0 0.2cm; }
      h2 {
        font-size: 11pt;
        margin: 0.5cm 0 0.2cm;
        padding-bottom: 0.1cm;
        border-bottom: 1pt solid #d4d4d8;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: #52525b;
      }
      .muted { color: #71717a; font-size: 9pt; font-weight: normal; }
      .num { font-variant-numeric: tabular-nums; }
      .right { text-align: right; }
      .meta {
        color: #52525b;
        font-size: 9pt;
        margin-bottom: 0.4cm;
        padding-bottom: 0.2cm;
        border-bottom: 0.5pt solid #e4e4e7;
      }
      .summary {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 0.2cm;
        margin-bottom: 0.5cm;
      }
      .tile {
        padding: 0.25cm 0.3cm;
        border: 0.5pt solid #d4d4d8;
        border-radius: 4pt;
      }
      .tile-label { font-size: 8pt; color: #71717a; text-transform: uppercase; letter-spacing: 0.04em; }
      .tile-value { font-size: 13pt; font-weight: bold; margin-top: 0.05cm; }
      .tile-value.big { color: #047857; }
      table { width: 100%; border-collapse: collapse; margin-bottom: 0.3cm; }
      th, td {
        padding: 0.1cm 0.15cm;
        text-align: left;
        border-bottom: 0.25pt solid #e4e4e7;
        vertical-align: top;
      }
      th { font-weight: bold; font-size: 9pt; background: #fafafa; }
      tr.ret td { color: #b91c1c; }
      .entry {
        margin-bottom: 0.3cm;
        padding: 0.2cm 0.3cm;
        border-left: 2.5pt solid #f59e0b;
        background: #fafafa;
        page-break-inside: avoid;
        border-radius: 0 3pt 3pt 0;
      }
      .entry-head {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        font-weight: bold;
      }
      .entry-meta { font-size: 8.5pt; color: #71717a; margin: 0.05cm 0 0.15cm; }
      .entry-line {
        display: flex;
        justify-content: space-between;
        font-size: 9.5pt;
        padding: 0.05cm 0;
      }
      .entry-line.ret { color: #b91c1c; }
      .entry-line.tip { color: #be185d; font-weight: bold; }
      .badge {
        display: inline-block;
        margin-left: 0.3cm;
        padding: 0.05cm 0.2cm;
        font-size: 8.5pt;
        font-weight: normal;
        background: #d1fae5;
        color: #065f46;
        border-radius: 3pt;
        vertical-align: middle;
      }
      .footer {
        margin-top: 0.6cm;
        padding-top: 0.2cm;
        border-top: 0.5pt solid #e4e4e7;
        font-size: 8pt;
        color: #a1a1aa;
        text-align: center;
      }
      .actions { margin: 0.4cm 0; }
      button.print-btn {
        padding: 0.3cm 0.6cm;
        background: #f59e0b;
        border: none;
        border-radius: 4pt;
        font-size: 11pt;
        font-weight: bold;
        cursor: pointer;
      }
      @media print {
        .actions { display: none !important; }
        body { font-size: 10pt; }
        .entry { background: transparent; }
      }
    </style>
  </head>
  <body>
    <div class="actions">
      <button class="print-btn" type="button" onclick="window.print()">Drucken</button>
    </div>
    <h1>Tagesbilanz</h1>
    <div class="meta">
      Zeitraum: <strong>${escHtml(dateRange)}</strong> ·
      ${summary.count} ${summary.count === 1 ? 'Bestellung' : 'Bestellungen'} ·
      Erstellt: ${escHtml(exportedAt)}
    </div>

    <h2>Zusammenfassung</h2>
    <div class="summary">
      <div class="tile">
        <div class="tile-label">Anfangsbestand</div>
        <div class="tile-value">${eur(cashStartCents)}</div>
      </div>
      <div class="tile">
        <div class="tile-label">Brutto-Umsatz</div>
        <div class="tile-value">${eur(summary.grossCents)}</div>
      </div>
      <div class="tile">
        <div class="tile-label">Trinkgeld</div>
        <div class="tile-value">${eur(summary.tipCents)}</div>
      </div>
      <div class="tile">
        <div class="tile-label">Soll in Kasse</div>
        <div class="tile-value big">${eur(summary.expectedDrawerCents)}</div>
      </div>
    </div>

    ${
      products.length > 0
        ? `
    <h2>Pro Produkt</h2>
    <table>
      <thead>
        <tr>
          <th class="num">Anz</th>
          <th>Bezeichnung</th>
          <th class="right">Umsatz</th>
          <th class="right">Pfand</th>
        </tr>
      </thead>
      <tbody>${productRows}${returnRows}</tbody>
    </table>`
        : ''
    }

    ${
      live.length > 0
        ? `
    <h2>Bestellungen (chronologisch)</h2>
    ${entryBlocks}`
        : '<p class="muted">Keine sichtbaren Bestellungen im Bilanz-Zeitraum.</p>'
    }

    <div class="footer">
      Bierwagen Kasse · bierwagen-kasse.de · Erstellt am ${escHtml(exportedAt)}
    </div>
  </body>
</html>`;
}

/** Öffnet ein neues Fenster mit der Print-View und triggert window.print() automatisch. */
export function printBilanz(
  entries: BilanzEntry[],
  cashStartCents: number,
): void {
  if (typeof window === 'undefined') return;
  const html = buildBilanzPrintHtml(entries, cashStartCents);
  // Wir verwenden ein Blob + neues Tab statt window.open('') + document.write,
  // weil document.write in modernen Browsern (Safari, iOS) zunehmend
  // restriktiver ist und auch deshalb für PWA-Kontexte verlässlicher.
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const w = window.open(url, '_blank', 'noopener,noreferrer');
  if (!w) {
    // Popup-Blocker — Fallback: Download als HTML, User druckt manuell.
    const a = document.createElement('a');
    const ts = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `tagesbilanz-${ts}.html`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }
  // URL nach 60s revoken — länger als ein User für den Druckdialog braucht.
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export function summarize(entries: BilanzEntry[], cashStartCents: number) {
  const live = visibleEntries(entries);
  const grossCents = live.reduce((s, e) => s + e.totalCents, 0);
  const tipCents = live.reduce((s, e) => s + e.tipCents, 0);
  const cashEntries = live.filter((e) => e.paymentMethod === 'cash');
  const cashCents = cashEntries.reduce((s, e) => s + e.totalCents, 0);
  const expectedDrawerCents = cashStartCents + cashCents;
  return {
    grossCents,
    tipCents,
    cashCents,
    expectedDrawerCents,
    count: live.length,
  };
}
