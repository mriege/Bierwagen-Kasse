import { Plus, Minus, Trash2, Sparkles } from 'lucide-react';
import type { State } from '../types';
import { formatEUR } from '../utils';
import { effectivePriceCents, isDrinkOnHappyHour } from '../effectivePrice';
import { useT } from '../i18n';

type Props = {
  state: State;
  nowMinutes: number;
  onIncrement: (drinkId: string) => void;
  onDecrement: (drinkId: string) => void;
};

export function OrderSummary({ state, nowMinutes, onIncrement, onDecrement }: Props) {
  const t = useT();
  if (state.order.length === 0) {
    return (
      <div className="flex h-full min-h-[5rem] items-center justify-center p-4 text-center">
        <div>
          <div className="text-base font-semibold text-ink-soft">{t('order.empty')}</div>
          <div className="mt-0.5 text-sm text-ink-mute">{t('order.emptyHint')}</div>
        </div>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-1.5">
      {state.order.map((line) => {
        const drink = state.drinks.find((d) => d.id === line.drinkId);
        if (!drink) return null;
        const pfand = drink.pfandTypeId
          ? state.pfandTypes.find((p) => p.id === drink.pfandTypeId)
          : null;
        const onHappy = isDrinkOnHappyHour(drink, nowMinutes);
        const unitPrice = effectivePriceCents(drink, nowMinutes);
        const lineSum = unitPrice * line.qty;
        const linePfand = pfand ? pfand.amountCents * line.qty : 0;
        const isLast = line.qty === 1;

        return (
          <li
            key={line.drinkId}
            className="flex items-center gap-1.5 rounded-xl bg-surface p-1.5 text-ink"
          >
            <button
              onClick={() => onDecrement(line.drinkId)}
              className="tap flex shrink-0 items-center justify-center rounded-lg bg-raised active:bg-pressed"
              aria-label={`${drink.label}: ${isLast ? t('order.removePosition') : t('order.minusOne')}`}
            >
              {isLast ? <Trash2 className="h-5 w-5" /> : <Minus className="h-5 w-5" />}
            </button>
            <div className="w-7 shrink-0 text-center text-xl font-bold tabular-nums">
              {line.qty}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1 text-[0.9375rem] font-semibold leading-tight">
                <span className="truncate">{drink.label}</span>
                {drink.size && (
                  <span className="shrink-0 font-normal text-ink-mute">{drink.size}</span>
                )}
                {onHappy && (
                  <Sparkles className="h-3.5 w-3.5 shrink-0 text-promo-ink" aria-hidden="true" />
                )}
              </div>
              <div className="truncate text-xs text-ink-mute tabular-nums">
                <span className={onHappy ? 'text-promo-ink' : ''}>{formatEUR(unitPrice)}</span>{' '}
                {t('order.unitLabel')}
                {pfand && ` · + ${pfand.label}`}
              </div>
            </div>
            <div className="shrink-0 text-right tabular-nums">
              <div className="text-[0.9375rem] font-bold leading-tight">{formatEUR(lineSum)}</div>
              {pfand && (
                <div className="text-xs text-ink-mute">+{formatEUR(linePfand)}</div>
              )}
            </div>
            <button
              onClick={() => onIncrement(line.drinkId)}
              className="tap flex shrink-0 items-center justify-center rounded-lg bg-raised active:bg-pressed"
              aria-label={`${drink.label}: ${t('order.plusOne')}`}
            >
              <Plus className="h-5 w-5" />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
