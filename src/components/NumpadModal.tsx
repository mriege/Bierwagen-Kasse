import { useEffect, useState } from 'react';
import { Delete } from 'lucide-react';
import { formatEUR, parseEURToCents } from '../utils';
import { Sheet } from './Sheet';
import { useT } from '../i18n';

type Mode = 'cash' | 'tip';

type Props = {
  open: boolean;
  /** Bezugswert: bei mode=cash der "zu zahlen", bei mode=tip der Total ohne Trinkgeld */
  totalCents: number;
  initialCents: number | null;
  mode?: Mode;
  onConfirm: (cents: number) => void;
  onClose: () => void;
};

const formatInputDisplay = (input: string): string => {
  if (input === '') return '0,00';
  if (!input.includes(',')) return `${input},00`;
  const [whole, frac = ''] = input.split(',');
  return `${whole || '0'},${frac.padEnd(2, '0').slice(0, 2)}`;
};

export function NumpadModal({
  open,
  totalCents,
  mode = 'cash',
  onConfirm,
  onClose,
}: Props) {
  const t = useT();
  const [input, setInput] = useState('');

  useEffect(() => {
    if (!open) return;
    setInput('');
  }, [open]);

  const press = (key: string) => {
    setInput((prev) => {
      if (key === ',') {
        if (prev.includes(',')) return prev;
        if (prev === '') return '0,';
        return prev + ',';
      }
      if (prev.length >= 8) return prev;
      const commaIdx = prev.indexOf(',');
      if (commaIdx >= 0 && prev.length - commaIdx - 1 >= 2) return prev;
      if (prev === '0') return key;
      return prev + key;
    });
  };

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        // Enter auf einem fokussierten Button soll nur diesen Button auslösen.
        if (document.activeElement?.tagName === 'BUTTON') return;
        const c = parseEURToCents(input);
        if (c > 0) onConfirm(c);
      }
      if (e.key === 'Backspace') setInput((p) => p.slice(0, -1));
      if (/^[0-9]$/.test(e.key)) press(e.key);
      if (e.key === ',' || e.key === '.') press(',');
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, input, onConfirm]);

  const cents = parseEURToCents(input);
  const valid = cents > 0;
  // cash: change = given - total. tip: derived total = total + tip.
  const isCash = mode === 'cash';
  const change = cents - totalCents;
  const sufficient = cents >= totalCents;
  const newTotal = totalCents + cents;

  const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
  const inputColor = isCash ? 'text-accent-ink' : 'text-promo-ink';
  const resultLabel = isCash
    ? valid && cents === totalCents
      ? t('totalbar.exact')
      : valid && !sufficient
        ? t('totalbar.missing')
        : t('totalbar.change')
    : t('numpad.newTotal');
  const resultValue = isCash
    ? valid
      ? cents === totalCents
        ? '✓'
        : formatEUR(Math.abs(change))
      : '–'
    : valid
      ? formatEUR(newTotal)
      : formatEUR(totalCents);
  const resultColorClass = isCash
    ? !valid
      ? 'text-ink-mute'
      : !sufficient
        ? 'text-negative-ink'
        : 'text-positive-ink'
    : valid
      ? 'text-promo-ink'
      : 'text-ink-mute';

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={isCash ? t('cash.title') : t('numpad.tipTitle')}
      width="26rem"
    >
      <div className="mb-3 rounded-xl bg-canvas p-3">
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-ink-mute">
            {isCash ? t('totalbar.total') : t('numpad.baseTotal')}
          </span>
          <span className="text-base font-semibold tabular-nums text-ink">
            {formatEUR(totalCents)}
          </span>
        </div>
        <div className="mt-1 flex items-baseline justify-between">
          <span className={`text-sm font-medium ${inputColor}`}>
            {isCash ? t('numpad.input') : t('tip.label')}
          </span>
          <span
            className={`text-3xl font-bold tabular-nums ${inputColor}`}
            aria-live="polite"
          >
            {formatInputDisplay(input)} €
          </span>
        </div>
        <div className="mt-1 flex items-baseline justify-between">
          <span className="text-sm text-ink-mute">{resultLabel}</span>
          <span className={`text-2xl font-bold tabular-nums ${resultColorClass}`}>
            {resultValue}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {KEYS.map((k) => (
          <NumpadButton key={k} onClick={() => press(k)}>
            {k}
          </NumpadButton>
        ))}
        <NumpadButton onClick={() => press(',')} label={t('numpad.comma')}>
          ,
        </NumpadButton>
        <NumpadButton onClick={() => press('0')}>0</NumpadButton>
        <NumpadButton onClick={() => setInput((p) => p.slice(0, -1))} label={t('numpad.backspace')}>
          <Delete className="h-7 w-7" aria-hidden="true" />
        </NumpadButton>
      </div>

      <button
        onClick={() => {
          if (valid) onConfirm(cents);
        }}
        disabled={!valid}
        className="tap mt-3 w-full rounded-xl bg-accent py-3 text-lg font-bold text-on-accent active:bg-accent-press disabled:bg-raised disabled:text-ink-mute"
      >
        {t('numpad.apply')}
      </button>
    </Sheet>
  );
}

function NumpadButton({
  onClick,
  label,
  children,
}: {
  onClick: () => void;
  label?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="flex h-14 items-center justify-center rounded-xl bg-raised text-2xl font-semibold tabular-nums text-ink active:bg-pressed"
    >
      {children}
    </button>
  );
}
