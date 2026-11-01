import { Plus, Minus, Undo2 } from 'lucide-react';
import type { State } from '../types';
import { formatEUR } from '../utils';
import { useT } from '../i18n';

type Props = {
  state: State;
  onIncrement: (pfandTypeId: string) => void;
  onDecrement: (pfandTypeId: string) => void;
};

/**
 * Pfandrückgabe als kompakte Stepper. Bis zu zwei Kategorien teilen sich die
 * Breite, mehr scrollen seitlich, damit die Getränke oben Platz behalten.
 */
export function PfandReturns({ state, onIncrement, onDecrement }: Props) {
  const t = useT();
  if (state.pfandTypes.length === 0) return null;
  const scrolls = state.pfandTypes.length > 2;

  return (
    <section aria-label={t('pfand.return')}>
      <div className="mb-1 flex items-center gap-1 px-0.5 text-xs font-medium text-ink-mute">
        <Undo2 className="h-3.5 w-3.5" aria-hidden="true" /> {t('pfand.return')}
      </div>
      <div className={`flex gap-1.5 ${scrolls ? 'overflow-x-auto' : ''}`}>
        {state.pfandTypes.map((pfand) => {
          const qty =
            state.returns.find((l) => l.pfandTypeId === pfand.id)?.qty ?? 0;
          return (
            <div
              key={pfand.id}
              className={`flex items-center gap-0.5 rounded-xl bg-surface p-0.5 ${
                scrolls ? 'w-44 shrink-0' : 'min-w-0 flex-1'
              }`}
            >
              <button
                onClick={() => onDecrement(pfand.id)}
                disabled={qty === 0}
                className="tap flex shrink-0 items-center justify-center rounded-lg bg-raised text-ink active:bg-pressed disabled:opacity-40"
                aria-label={`${pfand.label}: ${t('order.minusOne')}`}
              >
                <Minus className="h-5 w-5" />
              </button>
              <div className="min-w-0 flex-1 text-center" aria-live="polite">
                <div className="truncate text-xs leading-tight text-ink-mute">
                  {pfand.label}
                </div>
                <div
                  className={`truncate text-sm font-semibold leading-tight tabular-nums ${
                    qty > 0 ? 'text-negative-ink' : 'text-ink-soft'
                  }`}
                >
                  {qty > 0
                    ? `${qty} · −${formatEUR(qty * pfand.amountCents)}`
                    : formatEUR(pfand.amountCents)}
                </div>
              </div>
              <button
                onClick={() => onIncrement(pfand.id)}
                className="tap flex shrink-0 items-center justify-center rounded-lg bg-raised text-ink active:bg-pressed"
                aria-label={`${pfand.label}: ${t('order.plusOne')}`}
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
