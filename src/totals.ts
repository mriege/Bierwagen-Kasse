import type { State } from './types';
import { effectivePriceCents } from './effectivePrice';

export type Totals = {
  drinksSubtotalCents: number;
  pfandOutCents: number;
  pfandReturnCents: number;
  /** Total ohne Trinkgeld (für Bargeld-Rundung etc.) */
  baseTotalCents: number;
  /** Total inkl. Trinkgeld */
  totalCents: number;
  tipCents: number;
};

export function computeTotals(
  state: State,
  nowMinutes: number,
  tipCents: number = 0,
): Totals {
  let drinksSubtotalCents = 0;
  let pfandOutCents = 0;

  for (const line of state.order) {
    const drink = state.drinks.find((d) => d.id === line.drinkId);
    if (!drink) continue;
    drinksSubtotalCents += effectivePriceCents(drink, nowMinutes) * line.qty;
    if (drink.pfandTypeId) {
      const pfand = state.pfandTypes.find((p) => p.id === drink.pfandTypeId);
      if (pfand) pfandOutCents += pfand.amountCents * line.qty;
    }
  }

  let pfandReturnCents = 0;
  for (const line of state.returns) {
    const pfand = state.pfandTypes.find((p) => p.id === line.pfandTypeId);
    if (!pfand) continue;
    pfandReturnCents += pfand.amountCents * line.qty;
  }

  const baseTotalCents =
    drinksSubtotalCents + pfandOutCents - pfandReturnCents;
  return {
    drinksSubtotalCents,
    pfandOutCents,
    pfandReturnCents,
    baseTotalCents,
    tipCents,
    totalCents: baseTotalCents + tipCents,
  };
}
