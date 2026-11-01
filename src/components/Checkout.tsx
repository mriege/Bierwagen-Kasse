import { useState } from 'react';
import { Calculator, Check, ChevronUp, HandCoins, X } from 'lucide-react';
import type { Totals } from '../totals';
import { formatEUR } from '../utils';
import { FitText } from './FitText';
import { NumpadModal } from './NumpadModal';
import { useT } from '../i18n';

const COMMON_BILLS_CENTS = [500, 1000, 2000, 5000, 10000, 20000];
const MAX_SUGGESTIONS = 2;

function suggestAmounts(totalCents: number): number[] {
  if (totalCents <= 0) return [];
  const set = new Set<number>();
  if (totalCents % 100 !== 0) {
    set.add(Math.ceil(totalCents / 100) * 100);
  }
  const next5 = Math.ceil(totalCents / 500) * 500;
  if (next5 > totalCents) set.add(next5);
  for (const b of COMMON_BILLS_CENTS) {
    if (b > totalCents) set.add(b);
  }
  // Fallback für große Totals (>200 €): nächste 50er/100er/500er-Stufe
  if (set.size === 0) {
    const next50 = Math.ceil(totalCents / 5000) * 5000;
    if (next50 > totalCents) set.add(next50);
    const next100 = Math.ceil(totalCents / 10000) * 10000;
    if (next100 > totalCents) set.add(next100);
    const next500 = Math.ceil(totalCents / 50000) * 50000;
    if (next500 > totalCents) set.add(next500);
  }
  return Array.from(set)
    .sort((a, b) => a - b)
    .slice(0, MAX_SUGGESTIONS);
}

/** Aufrund-Ziele für Trinkgeld: nächster Euro / 5er / 10er, dedupliziert. */
function suggestTipTargets(baseTotalCents: number): number[] {
  if (baseTotalCents <= 0) return [];
  const set = new Set<number>();
  if (baseTotalCents % 100 !== 0) {
    set.add(Math.ceil(baseTotalCents / 100) * 100);
  }
  const next5 = Math.ceil(baseTotalCents / 500) * 500;
  if (next5 > baseTotalCents) set.add(next5);
  const next10 = Math.ceil(baseTotalCents / 1000) * 1000;
  if (next10 > baseTotalCents) set.add(next10);
  return Array.from(set)
    .sort((a, b) => a - b)
    .slice(0, 3);
}

/** Glatte Beträge kurz („20 €"), krumme vollständig („16,30 €"). */
const formatChip = (cents: number): string =>
  cents % 100 === 0
    ? `${(cents / 100).toLocaleString('de-DE')} €`
    : formatEUR(cents);

const CHIP = 'tap flex min-w-0 flex-1 items-center justify-center gap-1 overflow-hidden whitespace-nowrap rounded-xl px-1 text-[0.9375rem] font-semibold tabular-nums transition-colors';
const CHIP_IDLE = 'bg-surface text-ink active:bg-raised';
const CHIP_ON = 'bg-accent text-on-accent';

type CashProps = {
  totalCents: number;
  cashGivenCents: number | null;
  onCashGivenChange: (cents: number | null) => void;
};

function CashChips({ totalCents, cashGivenCents, onCashGivenChange }: CashProps) {
  const t = useT();
  const [keypadOpen, setKeypadOpen] = useState(false);
  const suggestions = suggestAmounts(totalCents);
  const exactSelected = cashGivenCents === totalCents;
  const customSelected =
    cashGivenCents !== null && !exactSelected && !suggestions.includes(cashGivenCents);

  return (
    <div role="group" aria-label={t('totalbar.cash')} className="flex gap-1.5">
      <button
        onClick={() => onCashGivenChange(exactSelected ? null : totalCents)}
        aria-pressed={exactSelected}
        aria-label={`${t('totalbar.exact')}, ${formatEUR(totalCents)}`}
        className={`${CHIP} flex-[1.5] ${exactSelected ? CHIP_ON : CHIP_IDLE}`}
      >
        <Check className="hidden h-4 w-4 shrink-0 min-[400px]:block" aria-hidden="true" />
        <span className="truncate">{formatChip(totalCents)}</span>
      </button>
      {suggestions.map((cents) => {
        const selected = cashGivenCents === cents;
        return (
          <button
            key={cents}
            onClick={() => onCashGivenChange(selected ? null : cents)}
            aria-pressed={selected}
            className={`${CHIP} ${selected ? CHIP_ON : CHIP_IDLE}`}
          >
            {formatChip(cents)}
          </button>
        );
      })}
      <button
        onClick={() => setKeypadOpen(true)}
        aria-pressed={customSelected}
        aria-label={t('cash.customAmount')}
        className={`${CHIP} ${customSelected ? CHIP_ON : CHIP_IDLE}`}
      >
        {customSelected ? formatChip(cashGivenCents!) : <Calculator className="h-5 w-5" />}
      </button>
      <NumpadModal
        open={keypadOpen}
        totalCents={totalCents}
        initialCents={cashGivenCents}
        onConfirm={(cents) => {
          onCashGivenChange(cents);
          setKeypadOpen(false);
        }}
        onClose={() => setKeypadOpen(false)}
      />
    </div>
  );
}

type TipProps = {
  baseTotalCents: number;
  tipCents: number;
  onTipChange: (cents: number) => void;
};

function TipChips({ baseTotalCents, tipCents, onTipChange }: TipProps) {
  const t = useT();
  const [keypadOpen, setKeypadOpen] = useState(false);
  const targets = suggestTipTargets(baseTotalCents);
  const customSelected =
    tipCents > 0 && !targets.some((target) => target - baseTotalCents === tipCents);

  return (
    <div role="group" aria-label={t('tip.label')} className="flex items-center gap-1.5">
      <HandCoins className="h-5 w-5 shrink-0 text-promo-ink" aria-label={t('tip.label')} />
      {targets.map((target) => {
        const tip = target - baseTotalCents;
        const selected = tipCents === tip;
        return (
          <button
            key={target}
            onClick={() => onTipChange(selected ? 0 : tip)}
            aria-pressed={selected}
            aria-label={`${t('tip.roundTo')} ${formatChip(target)}, ${t('tip.label')} ${formatEUR(tip)}`}
            className={`tap flex min-w-0 flex-1 items-center justify-center gap-1 whitespace-nowrap rounded-xl px-1 text-sm font-semibold tabular-nums transition-colors ${
              selected ? 'bg-promo text-on-solid' : 'bg-surface text-promo-ink active:bg-raised'
            }`}
          >
            {formatChip(target)}
          </button>
        );
      })}
      <button
        onClick={() => setKeypadOpen(true)}
        aria-pressed={customSelected}
        aria-label={t('tip.custom')}
        className={`tap flex shrink-0 items-center justify-center rounded-xl px-2 text-sm font-semibold tabular-nums transition-colors ${
          customSelected ? 'bg-promo text-on-solid' : 'bg-surface text-promo-ink active:bg-raised'
        }`}
      >
        {customSelected ? `+${formatEUR(tipCents)}` : <Calculator className="h-5 w-5" />}
      </button>
      {tipCents > 0 && (
        <button
          onClick={() => onTipChange(0)}
          className="tap flex shrink-0 items-center justify-center rounded-xl text-ink-mute active:bg-raised"
          aria-label={t('tip.clear')}
        >
          <X className="h-5 w-5" />
        </button>
      )}
      <NumpadModal
        open={keypadOpen}
        mode="tip"
        totalCents={baseTotalCents}
        initialCents={tipCents > 0 ? tipCents : null}
        onConfirm={(cents) => {
          onTipChange(cents);
          setKeypadOpen(false);
        }}
        onClose={() => setKeypadOpen(false)}
      />
    </div>
  );
}

/** Aufschlüsselung der Summe. Im breiten Layout dauerhaft, am Handy im Sheet. */
export function TotalsBreakdown({ totals, tipCents }: { totals: Totals; tipCents: number }) {
  const t = useT();
  const Row = ({ label, value, tone = 'text-ink-soft' }: { label: string; value: string; tone?: string }) => (
    <div className="flex items-baseline justify-between gap-3 text-sm">
      <dt className="text-ink-mute">{label}</dt>
      <dd className={`font-medium tabular-nums ${tone}`}>{value}</dd>
    </div>
  );
  return (
    <dl className="flex flex-col gap-0.5">
      <Row label={t('totalbar.drinks')} value={formatEUR(totals.drinksSubtotalCents)} />
      {totals.pfandOutCents > 0 && (
        <Row label={t('totalbar.pfand')} value={formatEUR(totals.pfandOutCents)} />
      )}
      {totals.pfandReturnCents > 0 && (
        <Row
          label={t('totalbar.return')}
          value={`−${formatEUR(totals.pfandReturnCents)}`}
          tone="text-negative-ink"
        />
      )}
      {tipCents > 0 && (
        <Row label={t('totalbar.tip')} value={formatEUR(tipCents)} tone="text-promo-ink" />
      )}
    </dl>
  );
}

type Props = {
  totals: Totals;
  itemCount: number;
  hasOrder: boolean;
  cashGivenCents: number | null;
  onCashGivenChange: (cents: number | null) => void;
  tipEnabled: boolean;
  tipCents: number;
  onTipChange: (cents: number) => void;
  onComplete: () => void;
  /** Öffnet am Handy die Bestellung. Im breiten Layout steht sie schon daneben. */
  onOpenOrder: () => void;
  /** Wird bei jedem Verkauf erhöht und startet die Bestätigungs-Animation. */
  saleCount: number;
};

/**
 * Der Kern der Kasse: Betrag ablesen, Bargeld antippen, Wechselgeld ablesen, fertig.
 * Die wichtigste Aktion liegt in Daumennähe direkt neben dem Betrag, um den es geht.
 */
export function Checkout({
  totals,
  itemCount,
  hasOrder,
  cashGivenCents,
  onCashGivenChange,
  tipEnabled,
  tipCents,
  onTipChange,
  onComplete,
  onOpenOrder,
  saleCount,
}: Props) {
  const t = useT();
  const total = totals.totalCents;
  const isNegative = total < 0;
  const changeCents = cashGivenCents !== null ? cashGivenCents - total : null;
  const exact = changeCents === 0;
  const insufficient = changeCents !== null && changeCents < 0;

  const itemsLabel =
    itemCount === 0
      ? t('sale.noItems')
      : itemCount === 1
        ? t('sale.itemsOne')
        : t('sale.itemsMany').replace('{n}', String(itemCount));

  return (
    <div className="flex flex-col gap-1.5">
      {total > 0 && (
        <CashChips
          totalCents={total}
          cashGivenCents={cashGivenCents}
          onCashGivenChange={onCashGivenChange}
        />
      )}
      {tipEnabled && totals.baseTotalCents > 0 && (
        <TipChips
          baseTotalCents={totals.baseTotalCents}
          tipCents={tipCents}
          onTipChange={onTipChange}
        />
      )}

      <div className="flex items-stretch gap-1.5">
        {/* Signatur der App: Beim Kassieren füllt sich der Betrag wie ein Glas. */}
        <button
          onClick={onOpenOrder}
          className={`relative min-w-0 flex-1 overflow-hidden rounded-xl px-3 py-1.5 text-left regular:pointer-events-none ${
            isNegative ? 'bg-negative-soft' : 'bg-surface active:bg-raised'
          }`}
          aria-label={`${t('order.title')}, ${itemsLabel}. ${t('totalbar.total')} ${formatEUR(total)}`}
        >
          {saleCount > 0 && (
            <span
              key={saleCount}
              className="animate-pour pointer-events-none absolute inset-0 origin-bottom bg-accent/30"
              aria-hidden="true"
            />
          )}
          <span className="relative flex items-center gap-1 text-xs font-medium text-ink-mute">
            <span className="min-w-0 truncate">
              {isNegative ? t('sale.payout') : t('totalbar.total')}
              <span className="regular:hidden"> · {itemsLabel}</span>
            </span>
            <ChevronUp className="h-3.5 w-3.5 shrink-0 regular:hidden" aria-hidden="true" />
          </span>
          <FitText
            className={`relative font-bold tabular-nums ${
              isNegative ? 'text-negative-ink' : total === 0 ? 'text-ink-mute' : 'text-ink'
            }`}
            maxSizePx={34}
            minSizePx={18}
            paddingPx={2}
          >
            {formatEUR(total)}
          </FitText>
        </button>

        {changeCents !== null && (
          <div
            className={`flex min-w-0 shrink-0 flex-col justify-center rounded-xl px-3 py-1.5 ${
              insufficient ? 'bg-negative-soft' : 'bg-positive-soft'
            }`}
            aria-live="polite"
          >
            <span className="text-xs font-medium text-ink-soft">
              {exact
                ? t('totalbar.exact')
                : insufficient
                  ? t('totalbar.missing')
                  : t('totalbar.change')}
            </span>
            <span
              className={`text-xl font-bold leading-tight tabular-nums ${
                insufficient ? 'text-negative-ink' : 'text-positive-ink'
              }`}
            >
              {exact ? '✓' : formatEUR(Math.abs(changeCents))}
            </span>
          </div>
        )}

        <button
          onClick={onComplete}
          disabled={!hasOrder}
          className="flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-accent px-4 text-base font-bold text-on-accent active:bg-accent-press disabled:bg-raised disabled:text-ink-mute"
        >
          <Check className="h-5 w-5" strokeWidth={2.6} aria-hidden="true" />
          {t('sale.complete')}
        </button>
      </div>
    </div>
  );
}
