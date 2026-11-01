import { useState } from 'react';
import {
  AlertTriangle,
  Banknote,
  BookOpen,
  CreditCard,
  Download,
  Lock,
  Minus,
  Pencil,
  Plus,
  Printer,
  Save,
  Smartphone,
  Trash2,
} from 'lucide-react';
import {
  type BilanzEntry,
  type PaymentMethod,
  recomputeEntryTotal,
  summarize,
  aggregateByProduct,
  downloadBilanzCsv,
  printBilanz,
  visibleEntries,
} from '../bilanz';
import { formatEUR, centsToInputString, parseEURToCents } from '../utils';
import { useT } from '../i18n';

type Props = {
  entries: BilanzEntry[];
  cashStartCents: number;
  enabled: boolean;
  /** Nebenkasse: Die Bilanz wird auf der Hauptkasse geführt. */
  isJoiner: boolean;
  onEnable: () => void;
  onUpdate: (entry: BilanzEntry) => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
};

export function BilanzPanel({
  entries,
  cashStartCents,
  enabled,
  isJoiner,
  onEnable,
  onUpdate,
  onDelete,
  onClearAll,
}: Props) {
  const t = useT();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  if (isJoiner) {
    return (
      <EmptyState
        icon={<Lock className="h-8 w-8 text-ink-mute" aria-hidden="true" />}
        title={t('bilanz.joinerTitle')}
        body={t('bilanz.joinerBody')}
      />
    );
  }
  if (!enabled) {
    return (
      <EmptyState
        icon={<BookOpen className="h-8 w-8 text-ink-mute" aria-hidden="true" />}
        title={t('bilanz.disabledTitle')}
        body={t('bilanz.disabledBody')}
        action={
          <button
            onClick={onEnable}
            className="tap rounded-xl bg-accent px-5 font-bold text-on-accent active:bg-accent-press"
          >
            {t('bilanz.enable')}
          </button>
        }
      />
    );
  }

  const live = visibleEntries(entries);
  const sorted = [...live].sort((a, b) => b.timestamp - a.timestamp);
  const summary = summarize(entries, cashStartCents);
  const { products, returns: returnSummaries } = aggregateByProduct(entries);

  return (
    <div className="flex flex-col gap-3">
      <section className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <SummaryTile label={t('bilanz.start')} value={formatEUR(cashStartCents)} tone="text-ink-soft" />
        <SummaryTile label={t('bilanz.gross')} value={formatEUR(summary.grossCents)} tone="text-ink" />
        <SummaryTile label={t('bilanz.tipsTotal')} value={formatEUR(summary.tipCents)} tone="text-promo-ink" />
        <SummaryTile label={t('bilanz.expectedDrawer')} value={formatEUR(summary.expectedDrawerCents)} tone="text-positive-ink" />
      </section>

      {live.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => downloadBilanzCsv(entries, cashStartCents)}
            className="tap flex flex-1 basis-[9rem] items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-raised px-3 text-sm font-semibold text-ink active:bg-pressed"
          >
            <Download className="h-4 w-4" aria-hidden="true" /> {t('bilanz.export')}
          </button>
          <button
            onClick={() => printBilanz(entries, cashStartCents)}
            className="tap flex flex-1 basis-[9rem] items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-raised px-3 text-sm font-semibold text-ink active:bg-pressed"
          >
            <Printer className="h-4 w-4" aria-hidden="true" /> {t('bilanz.print')}
          </button>
          <button
            onClick={() => {
              if (confirmClear) {
                onClearAll();
                setConfirmClear(false);
              } else {
                setConfirmClear(true);
                window.setTimeout(() => setConfirmClear(false), 3000);
              }
            }}
            className={`tap flex flex-1 basis-[9rem] items-center justify-center gap-2 whitespace-nowrap rounded-xl px-3 text-sm font-semibold transition-colors ${
              confirmClear ? 'bg-negative text-on-solid' : 'bg-raised text-negative-ink active:bg-pressed'
            }`}
          >
            {confirmClear ? (
              <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            )}
            {confirmClear ? t('bilanz.deleteAllConfirm') : t('bilanz.deleteAll')}
          </button>
        </div>
      )}

      {products.length > 0 && (
        <section className="rounded-2xl bg-surface p-3">
          <h3 className="mb-1.5 text-sm font-medium text-ink-soft">{t('bilanz.byProduct')}</h3>
          <div className="flex flex-col">
            {products.map((p) => (
              <div key={`${p.label}|${p.size}`} className="flex items-baseline gap-2 py-1 text-sm">
                <span className="w-10 shrink-0 text-right font-bold tabular-nums text-ink">
                  {p.totalQty}×
                </span>
                <span className="min-w-0 flex-1 truncate font-medium text-ink">
                  {p.label}
                  {p.size && <span className="ml-1 font-normal text-ink-mute">{p.size}</span>}
                </span>
                <span className="shrink-0 tabular-nums text-ink-soft">
                  {formatEUR(p.totalRevenueCents)}
                </span>
                {p.totalPfandCents > 0 && (
                  <span className="shrink-0 text-xs tabular-nums text-ink-mute">
                    +{formatEUR(p.totalPfandCents)}
                  </span>
                )}
              </div>
            ))}
            {returnSummaries.map((r) => (
              <div key={`return-${r.label}`} className="flex items-baseline gap-2 py-1 text-sm text-negative-ink">
                <span className="w-10 shrink-0 text-right font-bold tabular-nums">−{r.totalQty}×</span>
                <span className="min-w-0 flex-1 truncate">
                  {r.label} {t('pfand.return')}
                </span>
                <span className="shrink-0 tabular-nums">−{formatEUR(r.totalAmountCents)}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {sorted.length === 0 ? (
        <div className="rounded-2xl bg-surface p-6 text-center text-sm text-ink-mute">
          {t('bilanz.empty')}
        </div>
      ) : (
        <section className="flex flex-col gap-2" aria-label={`${summary.count} ${t('bilanz.entries')}`}>
          {sorted.map((entry) =>
            editingId === entry.id ? (
              <EntryEditor
                key={entry.id}
                entry={entry}
                onSave={(updated) => {
                  onUpdate(updated);
                  setEditingId(null);
                }}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <EntryView
                key={entry.id}
                entry={entry}
                onEdit={() => setEditingId(entry.id)}
                onDelete={() => onDelete(entry.id)}
              />
            ),
          )}
        </section>
      )}
    </div>
  );
}

function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl bg-surface p-8 text-center">
      {icon}
      <div>
        <h2 className="text-lg font-semibold text-ink">{title}</h2>
        <p className="mx-auto mt-1 max-w-md text-sm text-ink-mute">{body}</p>
      </div>
      {action}
    </div>
  );
}

function SummaryTile({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="flex min-w-0 flex-col rounded-2xl bg-surface px-3 py-2">
      <div className="truncate text-xs text-ink-mute">{label}</div>
      <div className={`truncate text-xl font-bold tabular-nums ${tone}`}>{value}</div>
    </div>
  );
}

const fmtTime = (ts: number) =>
  new Intl.DateTimeFormat('de-DE', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
  }).format(new Date(ts));

function EntryView({
  entry,
  onEdit,
  onDelete,
}: {
  entry: BilanzEntry;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const t = useT();
  return (
    <div className="rounded-2xl bg-surface p-3">
      <div className="mb-1.5 flex items-start gap-1">
        <div className="min-w-0 flex-1">
          <div className="text-xl font-bold leading-tight tabular-nums text-ink">
            {formatEUR(entry.totalCents)}
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-ink-mute">
            <span className="tabular-nums">{fmtTime(entry.timestamp)}</span>
            <PaymentBadge method={entry.paymentMethod} />
            {entry.tipCents > 0 && (
              <span className="text-promo-ink">
                +{formatEUR(entry.tipCents)} {t('tip.label')}
              </span>
            )}
            {entry.deviceName && (
              <span className="inline-flex items-center gap-1">
                <Smartphone className="h-3 w-3" aria-hidden="true" />
                {entry.deviceName}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={onEdit}
          className="tap flex items-center justify-center rounded-lg text-ink-soft active:bg-raised"
          aria-label={t('bilanz.editEntry')}
        >
          <Pencil className="h-5 w-5" />
        </button>
        <button
          onClick={onDelete}
          className="tap flex items-center justify-center rounded-lg text-negative-ink active:bg-raised"
          aria-label={t('bilanz.deleteEntry')}
        >
          <Trash2 className="h-5 w-5" />
        </button>
      </div>
      <div className="space-y-0.5 text-sm">
        {entry.items.map((line, i) => (
          <div key={i} className="flex items-baseline justify-between gap-2 text-ink-soft">
            <span className="min-w-0 truncate">
              <span className="font-semibold tabular-nums text-ink">{line.qty}×</span>{' '}
              {line.drinkLabel}
              {line.drinkSize && <span className="text-ink-mute"> {line.drinkSize}</span>}
              {line.pfandLabel && <span className="text-ink-mute"> + {line.pfandLabel}</span>}
            </span>
            <span className="shrink-0 tabular-nums text-ink-mute">
              {formatEUR((line.unitPriceCents + line.pfandAmountCents) * line.qty)}
            </span>
          </div>
        ))}
        {entry.returns.map((r, i) => (
          <div key={`r-${i}`} className="flex items-baseline justify-between gap-2 text-negative-ink">
            <span className="min-w-0 truncate">
              − {r.qty}× {r.pfandLabel} {t('pfand.return')}
            </span>
            <span className="shrink-0 tabular-nums">
              −{formatEUR(r.pfandAmountCents * r.qty)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PaymentBadge({ method }: { method: PaymentMethod }) {
  const t = useT();
  if (method === 'cash')
    return (
      <span className="inline-flex items-center gap-1">
        <Banknote className="h-3 w-3" aria-hidden="true" /> {t('bilanz.paymentCash')}
      </span>
    );
  if (method === 'card')
    return (
      <span className="inline-flex items-center gap-1">
        <CreditCard className="h-3 w-3" aria-hidden="true" /> {t('bilanz.paymentCard')}
      </span>
    );
  return <span>{t('bilanz.paymentOther')}</span>;
}

function EntryEditor({
  entry,
  onSave,
  onCancel,
}: {
  entry: BilanzEntry;
  onSave: (entry: BilanzEntry) => void;
  onCancel: () => void;
}) {
  const t = useT();
  const [items, setItems] = useState(entry.items);
  const [returns, setReturns] = useState(entry.returns);
  const [tip, setTip] = useState(centsToInputString(entry.tipCents));
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    entry.paymentMethod,
  );

  const tipCents = parseEURToCents(tip);

  const updateItemQty = (idx: number, delta: number) => {
    setItems((prev) =>
      prev
        .map((it, i) =>
          i === idx ? { ...it, qty: Math.max(0, it.qty + delta) } : it,
        )
        .filter((it) => it.qty > 0),
    );
  };

  const updateReturnQty = (idx: number, delta: number) => {
    setReturns((prev) =>
      prev
        .map((r, i) =>
          i === idx ? { ...r, qty: Math.max(0, r.qty + delta) } : r,
        )
        .filter((r) => r.qty > 0),
    );
  };

  const save = () => {
    const updated = recomputeEntryTotal({
      ...entry,
      items,
      returns,
      tipCents,
      paymentMethod,
    });
    onSave(updated);
  };

  const stepper =
    'tap flex shrink-0 items-center justify-center rounded-lg bg-raised text-ink active:bg-pressed';

  return (
    <div className="rounded-2xl bg-surface p-3 ring-2 ring-accent-line">
      <div className="mb-2 text-sm font-medium text-accent-ink">
        {t('bilanz.editEntry')} · {fmtTime(entry.timestamp)}
      </div>

      <div className="mb-3 space-y-1.5">
        {items.map((line, i) => (
          <div key={i} className="flex items-center gap-1.5 rounded-xl bg-canvas p-1">
            <button onClick={() => updateItemQty(i, -1)} className={stepper} aria-label={`${line.drinkLabel}: ${t('order.minusOne')}`}>
              <Minus className="h-5 w-5" />
            </button>
            <span className="w-7 text-center font-bold tabular-nums text-ink">{line.qty}</span>
            <button onClick={() => updateItemQty(i, 1)} className={stepper} aria-label={`${line.drinkLabel}: ${t('order.plusOne')}`}>
              <Plus className="h-5 w-5" />
            </button>
            <div className="min-w-0 flex-1 truncate text-sm text-ink">
              {line.drinkLabel}
              {line.drinkSize && <span className="text-ink-mute"> {line.drinkSize}</span>}
              {line.pfandLabel && <span className="text-ink-mute"> + {line.pfandLabel}</span>}
            </div>
            <div className="pr-1 text-right text-sm tabular-nums text-ink-soft">
              {formatEUR((line.unitPriceCents + line.pfandAmountCents) * line.qty)}
            </div>
          </div>
        ))}
        {returns.map((r, i) => (
          <div key={`r-${i}`} className="flex items-center gap-1.5 rounded-xl bg-canvas p-1">
            <button onClick={() => updateReturnQty(i, -1)} className={stepper} aria-label={`${r.pfandLabel}: ${t('order.minusOne')}`}>
              <Minus className="h-5 w-5" />
            </button>
            <span className="w-7 text-center font-bold tabular-nums text-ink">{r.qty}</span>
            <button onClick={() => updateReturnQty(i, 1)} className={stepper} aria-label={`${r.pfandLabel}: ${t('order.plusOne')}`}>
              <Plus className="h-5 w-5" />
            </button>
            <div className="min-w-0 flex-1 truncate text-sm text-negative-ink">
              {r.pfandLabel} {t('pfand.return')}
            </div>
            <div className="pr-1 text-right text-sm tabular-nums text-negative-ink">
              −{formatEUR(r.pfandAmountCents * r.qty)}
            </div>
          </div>
        ))}
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-1.5 text-sm font-medium text-ink-soft">
          {t('tip.label')}
          <input
            type="text"
            inputMode="decimal"
            value={tip}
            onChange={(e) => setTip(e.target.value)}
            className="tap w-20 rounded-lg bg-raised px-2 text-right tabular-nums text-ink focus:outline-none focus:ring-2 focus:ring-accent-line"
          />
          <span className="text-ink-mute">€</span>
        </label>
        <label className="flex items-center gap-1.5 text-sm font-medium text-ink-soft">
          {t('bilanz.payment')}
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
            className="tap rounded-lg bg-raised px-2 text-ink focus:outline-none focus:ring-2 focus:ring-accent-line"
          >
            <option value="cash">{t('bilanz.paymentCash')}</option>
            <option value="card">{t('bilanz.paymentCard')}</option>
            <option value="other">{t('bilanz.paymentOther')}</option>
          </select>
        </label>
      </div>

      <div className="flex justify-end gap-2">
        <button onClick={onCancel} className="tap rounded-xl bg-raised px-4 text-sm font-semibold text-ink active:bg-pressed">
          {t('cash.cancel')}
        </button>
        <button onClick={save} className="tap flex items-center gap-2 rounded-xl bg-accent px-4 text-sm font-bold text-on-accent active:bg-accent-press">
          <Save className="h-4 w-4" aria-hidden="true" /> {t('common.save')}
        </button>
      </div>
    </div>
  );
}
