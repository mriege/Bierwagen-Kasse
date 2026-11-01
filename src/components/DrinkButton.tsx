import { useEffect, useRef, useState } from 'react';
import { X, Sparkles } from 'lucide-react';
import type { Drink, PfandType } from '../types';
import { getIcon } from '../icons';
import { formatEUR } from '../utils';
import { effectivePriceCents, isDrinkOnHappyHour } from '../effectivePrice';
import { useT } from '../i18n';

type Props = {
  drink: Drink;
  pfand: PfandType | null;
  qty: number;
  nowMinutes: number;
  stornoMode: boolean;
  /** wenn null = Stock-Feature aus oder unbegrenzt */
  remainingStock: number | null;
  onAdd: (count: number) => void;
  onRemove: (count: number) => void;
  onLongPressStart: () => void;
};

const LONG_PRESS_MS = 420;
const SCROLL_THRESHOLD_PX = 10;

export function DrinkButton({
  drink,
  pfand,
  qty,
  nowMinutes,
  stornoMode,
  remainingStock,
  onAdd,
  onRemove,
  onLongPressStart,
}: Props) {
  const t = useT();
  const [showMulti, setShowMulti] = useState(false);
  // Anzeige: was im "Keller" ist (= stockStart - bilanz). Lock: rechnet die laufende
  // Bestellung mit ein, damit nicht über den Bestand hinaus verkauft werden kann.
  const availableForAdd =
    remainingStock !== null ? Math.max(0, remainingStock - qty) : Infinity;
  const isOutOfStock = remainingStock !== null && availableForAdd <= 0;
  const timerRef = useRef<number | null>(null);
  const longPressedRef = useRef(false);
  const startCoordsRef = useRef<{ x: number; y: number } | null>(null);
  const movedRef = useRef(false);

  const Icon = getIcon(drink.iconName);
  const onHappy = isDrinkOnHappyHour(drink, nowMinutes);
  const priceCents = effectivePriceCents(drink, nowMinutes);

  useEffect(() => {
    if (!showMulti) return;
    const handler = () => setShowMulti(false);
    const id = window.setTimeout(() => {
      window.addEventListener('pointerdown', handler);
    }, 0);
    return () => {
      window.clearTimeout(id);
      window.removeEventListener('pointerdown', handler);
    };
  }, [showMulti]);

  const clearTimer = () => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const activate = () => {
    if (stornoMode) {
      if (qty > 0) onRemove(1);
    } else if (!isOutOfStock) {
      onAdd(1);
    }
  };

  const openMulti = () => {
    setShowMulti(true);
    onLongPressStart();
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate(15);
      } catch {
        /* noop */
      }
    }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    longPressedRef.current = false;
    movedRef.current = false;
    startCoordsRef.current = { x: e.clientX, y: e.clientY };
    if (stornoMode || isOutOfStock) return;
    clearTimer();
    timerRef.current = window.setTimeout(() => {
      longPressedRef.current = true;
      timerRef.current = null;
      openMulti();
    }, LONG_PRESS_MS);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!startCoordsRef.current || movedRef.current) return;
    const dx = e.clientX - startCoordsRef.current.x;
    const dy = e.clientY - startCoordsRef.current.y;
    if (
      Math.abs(dx) > SCROLL_THRESHOLD_PX ||
      Math.abs(dy) > SCROLL_THRESHOLD_PX
    ) {
      movedRef.current = true;
      clearTimer();
    }
  };

  const handlePointerUp = () => {
    clearTimer();
    const moved = movedRef.current;
    startCoordsRef.current = null;
    if (longPressedRef.current || moved) return;
    activate();
  };

  const handlePointerCancel = () => {
    clearTimer();
    movedRef.current = true;
    startCoordsRef.current = null;
  };

  const label = [
    drink.label,
    drink.size,
    formatEUR(priceCents),
    pfand ? `+ ${pfand.label} ${formatEUR(pfand.amountCents)}` : null,
    qty > 0 ? t('drink.a11yInOrder').replace('{n}', String(qty)) : null,
    isOutOfStock ? t('drink.outOfStock') : null,
  ]
    .filter(Boolean)
    .join(', ');

  const tone = stornoMode
    ? qty > 0
      ? 'bg-negative-soft ring-2 ring-negative-ink active:bg-negative-soft'
      : 'bg-surface opacity-50'
    : isOutOfStock
      ? 'bg-surface opacity-50'
      : qty > 0
        ? 'bg-surface ring-2 ring-accent-line active:bg-raised'
        : 'bg-surface active:bg-raised';

  return (
    <div className="relative min-w-0">
      <button
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerCancel}
        onPointerCancel={handlePointerCancel}
        // Tastatur und Screenreader lösen nur `click` aus (detail === 0).
        onClick={(e) => {
          if (e.detail === 0) activate();
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          if (!stornoMode && !isOutOfStock && !longPressedRef.current) openMulti();
        }}
        aria-label={label}
        aria-disabled={isOutOfStock || (stornoMode && qty === 0)}
        className={`relative flex h-full min-h-[6.25rem] w-full min-w-0 flex-col items-center justify-center gap-0.5 overflow-hidden rounded-2xl px-2 py-2.5 text-ink transition-transform active:scale-[0.97] regular:min-h-[7.25rem] ${tone}`}
      >
        {qty > 0 && (
          <div className="absolute right-1.5 top-1.5 flex h-7 min-w-[1.75rem] items-center justify-center rounded-full bg-accent px-1.5 text-sm font-bold tabular-nums text-on-accent">
            {qty > 99 ? '99+' : qty}
          </div>
        )}
        {onHappy && (
          <div className="absolute left-1.5 top-1.5 flex items-center gap-1 rounded-full bg-promo-soft px-1.5 py-0.5 text-xs font-semibold text-promo-ink">
            <Sparkles className="h-3 w-3" aria-hidden="true" /> HH
          </div>
        )}
        <Icon
          className="hidden h-7 w-7 shrink-0 text-accent-ink lg:block"
          strokeWidth={1.8}
          aria-hidden="true"
        />
        <div
          className={`w-full truncate text-center text-[1.0625rem] font-semibold leading-tight ${
            qty > 0 || onHappy ? 'px-7' : ''
          }`}
        >
          {drink.label}
        </div>
        {drink.size && (
          <div className="w-full truncate text-center text-xs leading-none text-ink-mute">
            {drink.size}
          </div>
        )}
        <div className="mt-0.5 flex items-baseline gap-1.5">
          <div
            className={`text-[1.375rem] font-bold leading-tight tabular-nums ${
              onHappy ? 'text-promo-ink' : ''
            }`}
          >
            {formatEUR(priceCents)}
          </div>
          {onHappy && (
            <div className="text-xs tabular-nums text-ink-mute line-through">
              {formatEUR(drink.priceCents)}
            </div>
          )}
        </div>
        {pfand && (
          <div className="w-full truncate text-center text-xs text-ink-mute">
            + {pfand.label} {formatEUR(pfand.amountCents)}
          </div>
        )}
        {remainingStock !== null && (
          <div
            className={`w-full truncate text-center text-xs font-medium tabular-nums ${
              isOutOfStock
                ? 'text-negative-ink'
                : availableForAdd <= 5
                  ? 'text-accent-ink'
                  : 'text-ink-mute'
            }`}
          >
            {isOutOfStock
              ? t('drink.outOfStock')
              : `${remainingStock} ${t('drink.stockLeft')}`}
          </div>
        )}
      </button>
      {showMulti && (
        <div
          className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-1.5 rounded-2xl bg-raised ring-2 ring-accent-line"
          onPointerDown={(e) => e.stopPropagation()}
          role="group"
          aria-label={t('drink.addMany').replace('{name}', drink.label)}
        >
          <div className="w-full truncate px-2 text-center text-xs font-medium text-ink-soft">
            {drink.label}
          </div>
          <div className="flex gap-1.5">
            {[5, 10].map((n) => (
              <button
                key={n}
                onClick={() => {
                  onAdd(n);
                  setShowMulti(false);
                }}
                className="tap flex items-center justify-center rounded-xl bg-accent px-2 text-base font-bold tabular-nums text-on-accent active:bg-accent-press"
              >
                +{n}
              </button>
            ))}
            <button
              onClick={() => setShowMulti(false)}
              className="tap flex items-center justify-center rounded-xl bg-pressed text-ink"
              aria-label={t('common.cancel')}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
