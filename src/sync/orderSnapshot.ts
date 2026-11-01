import type { Drink, PfandType, State } from '../types';
import type { Totals } from '../totals';
import { effectivePriceCents, isDrinkOnHappyHour } from '../effectivePrice';

/**
 * Snapshot der aktuellen Bestellung — wird vom Kassen-Gerät an verbundene
 * Kundendisplays geschickt. Vollständig denormalisiert (Labels statt IDs),
 * damit das Display kein Sortiment kennen muss.
 */
export type OrderItemSnapshot = {
  drinkLabel: string;
  drinkSize: string;
  qty: number;
  /** Aktueller Preis (Happy-Hour-aware). */
  unitPriceCents: number;
  /** Original-Preis falls Happy-Hour läuft, sonst gleich unitPriceCents. */
  regularUnitPriceCents: number;
  pfandLabel: string | null;
  pfandAmountCents: number;
  onHappyHour: boolean;
};

export type OrderReturnSnapshot = {
  pfandLabel: string;
  qty: number;
  pfandAmountCents: number;
};

export type OrderSnapshot = {
  /** Anzeige-Name des Kassen-Geräts (z.B. "Theke"). */
  cashierName: string;
  items: OrderItemSnapshot[];
  returns: OrderReturnSnapshot[];
  drinksSubtotalCents: number;
  pfandOutCents: number;
  pfandReturnCents: number;
  /** Total ohne Trinkgeld. */
  baseTotalCents: number;
  tipCents: number;
  /** Total inkl. Trinkgeld. */
  totalCents: number;
  /** Bargeld vom Kunden, falls eingegeben. */
  cashGivenCents: number | null;
  /** Wechselgeld (positiv = Kunde bekommt zurück, negativ = es fehlt). */
  changeCents: number | null;
  /** Sequenz-Nummer für Stale-Detection (monoton steigend pro Kassen-Gerät). */
  seq: number;
  /** Unix-ms-Timestamp der Erfassung. */
  ts: number;
};

/**
 * Erzeugt einen Snapshot aus dem aktuellen Reducer-State + UI-State.
 * Wird vom Kassen-Gerät bei jeder Order-Änderung gerufen und an Display-Peers
 * verschickt.
 */
export function buildOrderSnapshot(input: {
  state: State;
  drinks: Drink[];
  pfandTypes: PfandType[];
  totals: Totals;
  nowMinutes: number;
  cashGivenCents: number | null;
  tipCents: number;
  cashierName: string;
  seq: number;
}): OrderSnapshot {
  const items: OrderItemSnapshot[] = input.state.order.map((line) => {
    const drink = input.drinks.find((d) => d.id === line.drinkId);
    const pfand = drink?.pfandTypeId
      ? input.pfandTypes.find((p) => p.id === drink.pfandTypeId)
      : null;
    const onHH = drink ? isDrinkOnHappyHour(drink, input.nowMinutes) : false;
    const unitPrice = drink ? effectivePriceCents(drink, input.nowMinutes) : 0;
    return {
      drinkLabel: drink?.label ?? '?',
      drinkSize: drink?.size ?? '',
      qty: line.qty,
      unitPriceCents: unitPrice,
      regularUnitPriceCents: drink?.priceCents ?? unitPrice,
      pfandLabel: pfand?.label ?? null,
      pfandAmountCents: pfand?.amountCents ?? 0,
      onHappyHour: onHH,
    };
  });

  const returns: OrderReturnSnapshot[] = input.state.returns.map((line) => {
    const pfand = input.pfandTypes.find((p) => p.id === line.pfandTypeId);
    return {
      pfandLabel: pfand?.label ?? '?',
      qty: line.qty,
      pfandAmountCents: pfand?.amountCents ?? 0,
    };
  });

  // computeTotals() liefert totalCents bereits inkl. Trinkgeld — daher hier
  // direkt durchreichen, NICHT noch einmal +tipCents addieren.
  const totalCents = input.totals.totalCents;
  const changeCents =
    input.cashGivenCents !== null ? input.cashGivenCents - totalCents : null;

  return {
    cashierName: input.cashierName,
    items,
    returns,
    drinksSubtotalCents: input.totals.drinksSubtotalCents,
    pfandOutCents: input.totals.pfandOutCents,
    pfandReturnCents: input.totals.pfandReturnCents,
    baseTotalCents: input.totals.baseTotalCents,
    tipCents: input.tipCents,
    totalCents,
    cashGivenCents: input.cashGivenCents,
    changeCents,
    seq: input.seq,
    ts: Date.now(),
  };
}

/** Validates ein eingehendes Snapshot-Objekt (nach JSON.parse). */
export function isValidSnapshot(x: unknown): x is OrderSnapshot {
  if (!x || typeof x !== 'object') return false;
  const s = x as Partial<OrderSnapshot>;
  return (
    typeof s.cashierName === 'string' &&
    Array.isArray(s.items) &&
    Array.isArray(s.returns) &&
    typeof s.totalCents === 'number' &&
    typeof s.seq === 'number'
  );
}
