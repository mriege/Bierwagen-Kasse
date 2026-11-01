import type { Drink } from './types';
import type { BilanzEntry } from './bilanz';

/**
 * Anzeigewert für das Tile-Badge:
 *   stockStart − Σ qty (alle abgeschlossenen Bilanz-Einträge)
 *
 * Die laufende Bestellung wird **nicht** abgezogen — sie wandert erst beim
 * Klick auf „Neue Bestellung" in die Bilanz und reduziert dann den Bestand.
 *
 * Rückgabe:
 *   - null  → Stock-Tracking deaktiviert oder kein Anfangsbestand gesetzt
 *   - Zahl  → verbleibender Bestand nach Bilanz (≥ 0)
 */
export function computeStockAfterBilanz(
  drink: Drink,
  bilanzEntries: BilanzEntry[],
): number | null {
  if (drink.stockStart == null) return null;
  let inBilanz = 0;
  for (const e of bilanzEntries) {
    // Tombstoned Einträge zählen NICHT — der Bestand wird zurückgegeben.
    if (e.deleted === true) continue;
    for (const item of e.items) {
      if (item.drinkLabel === drink.label && item.drinkSize === drink.size) {
        inBilanz += item.qty;
      }
    }
  }
  return Math.max(0, drink.stockStart - inBilanz);
}
