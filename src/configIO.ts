import type { Drink, PfandType, State } from './types';

export type ExportedConfig = {
  /** Format-Marker — verhindert Verwechslung mit der Bilanz-Datei. */
  format: 'bierwagen-kasse-config';
  version: 1;
  exportedAt: string;
  pfandTypes: PfandType[];
  drinks: Drink[];
};

export function buildExport(state: State): ExportedConfig {
  return {
    format: 'bierwagen-kasse-config',
    version: 1,
    exportedAt: new Date().toISOString(),
    pfandTypes: state.pfandTypes,
    drinks: state.drinks,
  };
}

export function downloadConfig(state: State): void {
  const data = buildExport(state);
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `bierwagen-konfig-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export type ParsedConfig =
  | { ok: true; pfandTypes: PfandType[]; drinks: Drink[] }
  | { ok: false; error: string };

export function parseConfig(text: string): ParsedConfig {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: 'Datei ist kein gültiges JSON.' };
  }
  if (!raw || typeof raw !== 'object') {
    return { ok: false, error: 'Ungültiges Datei-Format.' };
  }
  const data = raw as {
    format?: string;
    version?: number;
    pfandTypes?: unknown;
    drinks?: unknown;
    entries?: unknown[];
  };
  // Häufiger User-Fehler: Bilanz-JSON wurde in den Sortiment-Import geladen.
  // Lieber eine klare Anweisung als „pfandTypes fehlen".
  if (data.format === 'bierwagen-kasse-bilanz' || Array.isArray(data.entries)) {
    return {
      ok: false,
      error:
        'Diese Datei ist eine Tagesbilanz, kein Sortiment. Bitte den Button „Bilanz importieren" weiter unten nutzen.',
    };
  }
  if (data.version !== 1) {
    return { ok: false, error: `Unbekannte Version: ${String(data.version ?? '?')}` };
  }
  if (!Array.isArray(data.pfandTypes) || !Array.isArray(data.drinks)) {
    return {
      ok: false,
      error:
        'Diese Datei enthält weder Sortiment (drinks/pfandTypes) noch Bilanz. Falsche Datei?',
    };
  }

  const pfandTypes: PfandType[] = [];
  for (const p of data.pfandTypes) {
    if (
      !p ||
      typeof p.id !== 'string' ||
      typeof p.label !== 'string' ||
      typeof p.amountCents !== 'number' ||
      !Number.isFinite(p.amountCents)
    ) {
      return { ok: false, error: 'Ein Pfand-Eintrag hat ungültige Felder.' };
    }
    pfandTypes.push({
      id: p.id,
      label: p.label,
      amountCents: Math.round(p.amountCents),
    });
  }

  const drinks: Drink[] = [];
  const validPfandIds = new Set(pfandTypes.map((p) => p.id));
  for (const d of data.drinks) {
    if (
      !d ||
      typeof d.id !== 'string' ||
      typeof d.label !== 'string' ||
      typeof d.size !== 'string' ||
      typeof d.iconName !== 'string' ||
      typeof d.priceCents !== 'number' ||
      !Number.isFinite(d.priceCents)
    ) {
      return { ok: false, error: 'Ein Getränke-Eintrag hat ungültige Felder.' };
    }
    if (d.pfandTypeId !== null && typeof d.pfandTypeId !== 'string') {
      return { ok: false, error: 'pfandTypeId in einem Getränk ist ungültig.' };
    }
    let happyHour;
    if (d.happyHour !== undefined && d.happyHour !== null) {
      const hh = d.happyHour;
      if (
        typeof hh.startMinutes !== 'number' ||
        typeof hh.endMinutes !== 'number' ||
        typeof hh.priceCents !== 'number' ||
        hh.startMinutes < 0 ||
        hh.startMinutes > 1440 ||
        hh.endMinutes < 0 ||
        hh.endMinutes > 1440
      ) {
        return { ok: false, error: 'Happy-Hour eines Getränks ist ungültig.' };
      }
      happyHour = {
        startMinutes: Math.round(hh.startMinutes),
        endMinutes: Math.round(hh.endMinutes),
        priceCents: Math.round(hh.priceCents),
      };
    }
    let stockStart: number | null | undefined;
    if (d.stockStart !== undefined) {
      if (d.stockStart === null) {
        stockStart = null;
      } else if (typeof d.stockStart === 'number' && Number.isFinite(d.stockStart) && d.stockStart >= 0) {
        stockStart = Math.floor(d.stockStart);
      } else {
        return { ok: false, error: 'Bestand-Wert eines Getränks ist ungültig.' };
      }
    }
    drinks.push({
      id: d.id,
      label: d.label,
      size: d.size,
      iconName: d.iconName,
      priceCents: Math.round(d.priceCents),
      pfandTypeId:
        d.pfandTypeId && validPfandIds.has(d.pfandTypeId) ? d.pfandTypeId : null,
      ...(happyHour ? { happyHour } : {}),
      ...(stockStart !== undefined ? { stockStart } : {}),
    });
  }

  return { ok: true, pfandTypes, drinks };
}
