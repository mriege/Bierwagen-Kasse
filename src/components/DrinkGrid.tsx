import type { Drink, OrderLine, PfandType } from '../types';
import type { BilanzEntry } from '../bilanz';
import { DrinkButton } from './DrinkButton';
import { computeStockAfterBilanz } from '../stock';
import { useT } from '../i18n';

type Props = {
  drinks: Drink[];
  pfandTypes: PfandType[];
  order: OrderLine[];
  nowMinutes: number;
  stornoMode: boolean;
  bestandEnabled: boolean;
  bilanzEntries: BilanzEntry[];
  onAdd: (drinkId: string, count: number) => void;
  onRemove: (drinkId: string, count: number) => void;
  onLongPressStart: () => void;
};

export function DrinkGrid({
  drinks,
  pfandTypes,
  order,
  nowMinutes,
  stornoMode,
  bestandEnabled,
  bilanzEntries,
  onAdd,
  onRemove,
  onLongPressStart,
}: Props) {
  const t = useT();
  if (drinks.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-center text-ink-mute">
        <div>
          <div className="text-xl font-semibold">{t('config.noDrinks')}</div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="grid h-full content-start gap-2 p-2 pb-4 lg:gap-3 lg:p-3"
      style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}
    >
      {drinks.map((drink) => {
        const pfand = drink.pfandTypeId
          ? (pfandTypes.find((p) => p.id === drink.pfandTypeId) ?? null)
          : null;
        const qty = order.find((l) => l.drinkId === drink.id)?.qty ?? 0;
        const remainingStock =
          bestandEnabled && drink.stockStart != null
            ? computeStockAfterBilanz(drink, bilanzEntries)
            : null;
        return (
          <DrinkButton
            key={drink.id}
            drink={drink}
            pfand={pfand}
            qty={qty}
            nowMinutes={nowMinutes}
            stornoMode={stornoMode}
            remainingStock={remainingStock}
            onAdd={(n) => onAdd(drink.id, n)}
            onRemove={(n) => onRemove(drink.id, n)}
            onLongPressStart={onLongPressStart}
          />
        );
      })}
    </div>
  );
}
