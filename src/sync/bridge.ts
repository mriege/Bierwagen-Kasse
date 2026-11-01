import * as Y from 'yjs';
import type { Drink, PfandType } from '../types';
import type { BilanzEntry } from '../bilanz';
import type { SharedSettings } from '../settings';
import {
  LOCAL_ORIGIN,
  REMOTE_ORIGIN,
  M_DRINKS,
  M_PFAND,
  M_BILANZ,
  M_SHARED,
} from './ydoc';

/* ===========================================================================
 * Strategie: Pro Eintrag (Drink, PfandType, BilanzEntry) wird der gesamte
 * Datensatz als JSON-String in einer Y.Map<id, string> abgelegt.
 *
 * Vorteile gegenüber feingranularen nested Y.Maps:
 *   - 80% weniger Code, leichter zu debuggen.
 *   - Einträge sind atomar — keine halb-aktualisierten Records sichtbar.
 *   - Bilanz-Items (verschachtelte Arrays) brauchen keine Y.Array<Y.Map>-Hölle.
 *
 * Wer gewinnt bei Konflikten?
 *   - Tagesbilanz: Vereinigung aller Geräte. IDs sind eindeutig, also gibt es
 *     keine Konflikte, und nichts darf verloren gehen.
 *   - Sortiment + geteilte Einstellungen: Der Master ist die Quelle der Wahrheit.
 *     Yjs allein entscheidet gleichzeitige Schreibvorgänge zufällig (nach
 *     Client-ID), siehe `captureAuthoritative` / `restoreAuthoritative`.
 *
 * Schreibzugriffe laufen als gezielte Operationen, nie als „Zustand abgleichen
 * und alles Unbekannte löschen". Ein veralteter React-Zustand könnte sonst
 * Einträge löschen, die er noch gar nicht kennt.
 * =========================================================================== */

/** Reihenfolge lebt separat: Eine Y.Map hat keine verlässliche Sortierung. */
const KEY_ORDER_DRINKS = 'order.drinks';
const KEY_ORDER_PFAND = 'order.pfand';

type WithId = { id: string };

function readOrder(ydoc: Y.Doc, key: string): string[] {
  const raw = ydoc.getMap<unknown>(M_SHARED).get(key);
  if (typeof raw !== 'string') return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

function writeOrder(ydoc: Y.Doc, key: string, ids: string[]): void {
  const ymap = ydoc.getMap<unknown>(M_SHARED);
  const json = JSON.stringify(ids);
  if (ymap.get(key) !== json) ymap.set(key, json);
}

function sortByOrder<T extends WithId>(items: T[], order: string[]): T[] {
  const rank = new Map(order.map((id, index) => [id, index]));
  return items
    .map((item, index) => ({ item, index }))
    .sort((a, b) => {
      const ra = rank.get(a.item.id) ?? Number.MAX_SAFE_INTEGER;
      const rb = rank.get(b.item.id) ?? Number.MAX_SAFE_INTEGER;
      return ra - rb || a.index - b.index;
    })
    .map((x) => x.item);
}

function readList<T extends WithId>(ydoc: Y.Doc, mapName: string, orderKey: string): T[] {
  const out: T[] = [];
  ydoc.getMap<string>(mapName).forEach((json) => {
    try {
      const parsed = JSON.parse(json) as T;
      if (parsed && typeof parsed.id === 'string') out.push(parsed);
    } catch {
      /* skip corrupt entries */
    }
  });
  return sortByOrder(out, readOrder(ydoc, orderKey));
}

/** Schreibt nur, was sich zwischen `prev` und `next` wirklich geändert hat. */
function applyListChange<T extends WithId>(
  ydoc: Y.Doc,
  mapName: string,
  orderKey: string,
  prev: T[],
  next: T[],
): void {
  const ymap = ydoc.getMap<string>(mapName);
  const nextIds = new Set(next.map((x) => x.id));
  const prevJson = new Map(prev.map((x) => [x.id, JSON.stringify(x)]));
  for (const item of prev) {
    if (!nextIds.has(item.id)) ymap.delete(item.id);
  }
  for (const item of next) {
    const json = JSON.stringify(item);
    if (prevJson.get(item.id) !== json) ymap.set(item.id, json);
  }
  writeOrder(ydoc, orderKey, next.map((x) => x.id));
}

// ============== SORTIMENT ==============

export const readDrinksFromYjs = (ydoc: Y.Doc): Drink[] =>
  readList<Drink>(ydoc, M_DRINKS, KEY_ORDER_DRINKS);

export const readPfandFromYjs = (ydoc: Y.Doc): PfandType[] =>
  readList<PfandType>(ydoc, M_PFAND, KEY_ORDER_PFAND);

/** Überträgt eine lokale Sortiments-Änderung als gezielte Operationen. */
export function applyConfigChange(
  ydoc: Y.Doc,
  prev: { drinks: Drink[]; pfandTypes: PfandType[] },
  next: { drinks: Drink[]; pfandTypes: PfandType[] },
): void {
  ydoc.transact(() => {
    applyListChange(ydoc, M_PFAND, KEY_ORDER_PFAND, prev.pfandTypes, next.pfandTypes);
    applyListChange(ydoc, M_DRINKS, KEY_ORDER_DRINKS, prev.drinks, next.drinks);
  }, LOCAL_ORIGIN);
}

/** Ältere Dokumente haben keine Reihenfolge: einmalig aus dem Ist-Stand anlegen. */
export function ensureConfigOrder(ydoc: Y.Doc): void {
  ydoc.transact(() => {
    if (readOrder(ydoc, KEY_ORDER_DRINKS).length === 0) {
      writeOrder(ydoc, KEY_ORDER_DRINKS, readDrinksFromYjs(ydoc).map((d) => d.id));
    }
    if (readOrder(ydoc, KEY_ORDER_PFAND).length === 0) {
      writeOrder(ydoc, KEY_ORDER_PFAND, readPfandFromYjs(ydoc).map((p) => p.id));
    }
  }, LOCAL_ORIGIN);
}

// ============== BILANZ ==============

export function readBilanzFromYjs(ydoc: Y.Doc): BilanzEntry[] {
  const ymap = ydoc.getMap<string>(M_BILANZ);
  const out: BilanzEntry[] = [];
  ymap.forEach((json) => {
    try {
      const parsed = JSON.parse(json) as BilanzEntry;
      if (
        parsed &&
        typeof parsed.id === 'string' &&
        typeof parsed.timestamp === 'number'
      ) {
        out.push(parsed);
      }
    } catch {
      /* skip */
    }
  });
  // Deterministische Reihenfolge, auch bei gleichem Zeitstempel zweier Geräte.
  out.sort((a, b) => a.timestamp - b.timestamp || a.id.localeCompare(b.id));
  return out;
}

/** Legt Einträge an oder ändert sie. Normalfall: Löschen = `deleted: true`. */
export function upsertBilanzEntries(ydoc: Y.Doc, entries: BilanzEntry[]): void {
  const ymap = ydoc.getMap<string>(M_BILANZ);
  ydoc.transact(() => {
    for (const entry of entries) {
      const json = JSON.stringify(entry);
      if (ymap.get(entry.id) !== json) ymap.set(entry.id, json);
    }
  }, LOCAL_ORIGIN);
}

/** Ersetzt die komplette Bilanz. Nur für den bestätigten Backup-Import. */
export function replaceBilanzInYjs(ydoc: Y.Doc, entries: BilanzEntry[]): void {
  const ymap = ydoc.getMap<string>(M_BILANZ);
  const incoming = new Set(entries.map((e) => e.id));
  ydoc.transact(() => {
    for (const key of Array.from(ymap.keys())) {
      if (!incoming.has(key)) ymap.delete(key);
    }
  }, LOCAL_ORIGIN);
  upsertBilanzEntries(ydoc, entries);
}

// ============== SHARED SETTINGS ==============
// Hier per-Feld in einer flachen Y.Map<string, primitive>, damit zwei Geräte
// unterschiedliche Felder gleichzeitig ändern können (LWW pro Feld).

const KEY_CASH = 'cashStartCents';
const KEY_FT = 'feature.trinkgeld';
const KEY_FB = 'feature.tagesbilanz';
const KEY_FS = 'feature.bestand';

export function writeSharedSettingsToYjs(
  ydoc: Y.Doc,
  shared: SharedSettings,
): void {
  const ymap = ydoc.getMap<unknown>(M_SHARED);
  ydoc.transact(() => {
    if (ymap.get(KEY_CASH) !== shared.cashStartCents) {
      ymap.set(KEY_CASH, shared.cashStartCents);
    }
    if (ymap.get(KEY_FT) !== shared.features.trinkgeld) {
      ymap.set(KEY_FT, shared.features.trinkgeld);
    }
    if (ymap.get(KEY_FB) !== shared.features.tagesbilanz) {
      ymap.set(KEY_FB, shared.features.tagesbilanz);
    }
    if (ymap.get(KEY_FS) !== shared.features.bestand) {
      ymap.set(KEY_FS, shared.features.bestand);
    }
  }, LOCAL_ORIGIN);
}

export function readSharedSettingsFromYjs(
  ydoc: Y.Doc,
): SharedSettings | null {
  const ymap = ydoc.getMap<unknown>(M_SHARED);
  if (!ymap.has(KEY_CASH) && !ymap.has(KEY_FT)) return null;
  const cash = ymap.get(KEY_CASH);
  const ft = ymap.get(KEY_FT);
  const fb = ymap.get(KEY_FB);
  const fs = ymap.get(KEY_FS);
  return {
    version: 1,
    features: {
      trinkgeld: typeof ft === 'boolean' ? ft : false,
      tagesbilanz: typeof fb === 'boolean' ? fb : false,
      bestand: typeof fs === 'boolean' ? fs : false,
    },
    cashStartCents: typeof cash === 'number' ? cash : 0,
  };
}

// ============== MASTER ALS QUELLE DER WAHRHEIT ==============

const AUTHORITATIVE_MAPS = [M_DRINKS, M_PFAND, M_SHARED];

export type AuthoritativeSnapshot = Map<string, Map<string, unknown>>;

/** Merkt sich Sortiment + geteilte Einstellungen, bevor Fremddaten einfließen. */
export function captureAuthoritative(ydoc: Y.Doc): AuthoritativeSnapshot {
  const snapshot: AuthoritativeSnapshot = new Map();
  for (const name of AUTHORITATIVE_MAPS) {
    const values = new Map<string, unknown>();
    ydoc.getMap<unknown>(name).forEach((value, key) => values.set(key, value));
    snapshot.set(name, values);
  }
  return snapshot;
}

/**
 * Stellt den gemerkten Stand wieder her. Yjs entscheidet gleichzeitige Werte
 * eines Schlüssels nach Client-ID, also zufällig. Ein neu hinzukommendes Gerät
 * könnte mit seinen Standardpreisen die Preise des Masters überschreiben und
 * gelöschte Getränke zurückbringen.
 *
 * Diese Schreibvorgänge passieren kausal NACH dem Empfangenen und gewinnen
 * deshalb auf allen Geräten. Die Tagesbilanz ist bewusst nicht betroffen.
 * Liefert true, wenn etwas korrigiert werden musste.
 */
export function restoreAuthoritative(
  ydoc: Y.Doc,
  snapshot: AuthoritativeSnapshot,
): boolean {
  let changed = false;
  ydoc.transact(() => {
    for (const [name, values] of snapshot) {
      const ymap = ydoc.getMap<unknown>(name);
      for (const key of Array.from(ymap.keys())) {
        if (!values.has(key)) {
          ymap.delete(key);
          changed = true;
        }
      }
      for (const [key, value] of values) {
        if (ymap.get(key) !== value) {
          ymap.set(key, value);
          changed = true;
        }
      }
    }
  }, REMOTE_ORIGIN);
  return changed;
}

// ============== UTILITY ==============

export function isYDocEmpty(ydoc: Y.Doc): boolean {
  return (
    ydoc.getMap(M_DRINKS).size === 0 &&
    ydoc.getMap(M_PFAND).size === 0 &&
    ydoc.getMap(M_BILANZ).size === 0 &&
    ydoc.getMap(M_SHARED).size === 0
  );
}

/** Erstbefüllung eines leeren Dokuments aus dem localStorage-Stand. */
export function seedYDoc(
  ydoc: Y.Doc,
  seed: {
    drinks: Drink[];
    pfandTypes: PfandType[];
    bilanz: BilanzEntry[];
    shared: SharedSettings;
  },
): void {
  applyConfigChange(
    ydoc,
    { drinks: [], pfandTypes: [] },
    { drinks: seed.drinks, pfandTypes: seed.pfandTypes },
  );
  upsertBilanzEntries(ydoc, seed.bilanz);
  writeSharedSettingsToYjs(ydoc, seed.shared);
}

// ============== OBSERVERS ==============

export type SyncHandlers = {
  onConfig: (config: { drinks: Drink[]; pfandTypes: PfandType[] }) => void;
  onBilanz: (entries: BilanzEntry[]) => void;
  onSharedSettings: (shared: SharedSettings) => void;
};

export type Disposer = () => void;

const isOrderKey = (key: string | null): boolean =>
  key === KEY_ORDER_DRINKS || key === KEY_ORDER_PFAND;

/**
 * Meldet Änderungen, die nicht von diesem Gerät selbst stammen. Pro Transaktion
 * höchstens ein Aufruf je Bereich, damit die UI keine Zwischenstände rendert.
 */
export function subscribeYjs(ydoc: Y.Doc, handlers: SyncHandlers): Disposer {
  const drinks = ydoc.getMap<string>(M_DRINKS);
  const pfand = ydoc.getMap<string>(M_PFAND);
  const bilanz = ydoc.getMap<string>(M_BILANZ);
  const shared = ydoc.getMap<unknown>(M_SHARED);

  const onTransaction = (tx: Y.Transaction) => {
    if (tx.origin === LOCAL_ORIGIN || tx.changed.size === 0) return;
    const changed = tx.changed as Map<unknown, Set<string | null>>;
    const keys = Array.from(changed.get(shared) ?? []);
    if (changed.has(drinks) || changed.has(pfand) || keys.some(isOrderKey)) {
      handlers.onConfig({
        drinks: readDrinksFromYjs(ydoc),
        pfandTypes: readPfandFromYjs(ydoc),
      });
    }
    if (changed.has(bilanz)) {
      handlers.onBilanz(readBilanzFromYjs(ydoc));
    }
    if (keys.some((key) => !isOrderKey(key))) {
      const settings = readSharedSettingsFromYjs(ydoc);
      if (settings) handlers.onSharedSettings(settings);
    }
  };

  ydoc.on('afterTransaction', onTransaction);
  return () => ydoc.off('afterTransaction', onTransaction);
}
