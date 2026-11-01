import { useEffect, useRef, useState } from 'react';
import {
  Plus,
  Trash2,
  Save,
  RefreshCw,
  Sparkles,
  Download,
  Upload,
  AlertCircle,
  AlertTriangle,
  Database,
  Package,
  BookOpen,
} from 'lucide-react';
import type { Drink, HappyHour, PfandType, State } from '../types';
import type { Action } from '../reducer';
import { ICON_NAMES, getIcon } from '../icons';
import {
  formatEUR,
  parseEURToCents,
  centsToInputString,
  generateId,
  minutesToTimeString,
  timeStringToMinutes,
} from '../utils';
import { downloadConfig, parseConfig } from '../configIO';
import {
  type BilanzEntry,
  downloadBilanzJson,
  parseBilanzJson,
  visibleEntries,
} from '../bilanz';
import { useT } from '../i18n';

type Props = {
  state: State;
  dispatch: (action: Action) => void;
};

export function SortimentPanel({
  state,
  dispatch,
  bestandEnabled,
  readOnly,
}: Props & { bestandEnabled: boolean; readOnly: boolean }) {
  return (
    <div className="grid grid-cols-1 items-start gap-3 md:grid-cols-2">
      <PfandConfig state={state} dispatch={dispatch} readOnly={readOnly} />
      <DrinkConfig
        state={state}
        dispatch={dispatch}
        bestandEnabled={bestandEnabled}
        readOnly={readOnly}
      />
    </div>
  );
}

/** Löschen in zwei Schritten: Der erste Tipp schärft, der zweite löscht. */
function DeleteButton({ onConfirm }: { onConfirm: () => void }) {
  const t = useT();
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!armed) return;
    const id = window.setTimeout(() => setArmed(false), 3000);
    return () => window.clearTimeout(id);
  }, [armed]);
  return (
    <button
      onClick={() => {
        if (armed) onConfirm();
        else setArmed(true);
      }}
      className={`tap flex shrink-0 items-center justify-center rounded-lg px-2 text-sm font-semibold transition-colors ${
        armed ? 'bg-negative text-on-solid' : 'bg-raised text-negative-ink active:bg-pressed'
      }`}
      aria-label={armed ? t('config.deleteConfirm') : t('config.delete')}
    >
      {armed ? t('config.deleteConfirm') : <Trash2 className="h-5 w-5" aria-hidden="true" />}
    </button>
  );
}

export function DataPanel({
  state,
  dispatch,
  onResetAll,
  resetAllArmed,
  readOnly,
  bilanz,
  onBilanzReplace,
  bilanzEnabled,
  cashStartCents,
}: {
  state: State;
  dispatch: (a: Action) => void;
  onResetAll: () => void;
  resetAllArmed: boolean;
  readOnly: boolean;
  bilanz: BilanzEntry[];
  onBilanzReplace: (entries: BilanzEntry[]) => void;
  bilanzEnabled: boolean;
  cashStartCents: number;
}) {
  const t = useT();
  const fileRef = useRef<HTMLInputElement>(null);
  const bilanzFileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [importedAt, setImportedAt] = useState<number | null>(null);
  const [bilanzError, setBilanzError] = useState<string | null>(null);
  const [bilanzImportedAt, setBilanzImportedAt] = useState<number | null>(null);
  const [pendingImport, setPendingImport] = useState<{
    entries: BilanzEntry[];
    visibleCount: number;
  } | null>(null);

  const handleImport = async (file: File) => {
    setError(null);
    try {
      const text = await file.text();
      const result = parseConfig(text);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      dispatch({
        type: 'REPLACE_CONFIG',
        drinks: result.drinks,
        pfandTypes: result.pfandTypes,
      });
      setImportedAt(Date.now());
      window.setTimeout(() => setImportedAt(null), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('config.fileError'));
    }
  };

  const handleBilanzImport = async (file: File) => {
    setBilanzError(null);
    try {
      const text = await file.text();
      const result = parseBilanzJson(text);
      if (!result.ok) {
        setBilanzError(result.error);
        return;
      }
      // Bestätigungs-Dialog: zeige Anzahl gefundener vs. zu ersetzender Einträge
      setPendingImport({
        entries: result.entries,
        visibleCount: visibleEntries(result.entries).length,
      });
    } catch (e) {
      setBilanzError(
        e instanceof Error ? e.message : t('config.fileError'),
      );
    }
  };

  const confirmBilanzImport = () => {
    if (!pendingImport) return;
    onBilanzReplace(pendingImport.entries);
    setBilanzImportedAt(Date.now());
    setPendingImport(null);
    window.setTimeout(() => setBilanzImportedAt(null), 3000);
  };

  const liveBilanzCount = visibleEntries(bilanz).length;

  return (
    <div className="flex flex-col gap-3">
      <section className="flex flex-col gap-3 rounded-2xl bg-surface p-4">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-ink">
          <Database className="h-5 w-5 text-positive-ink" />
          {t('config.sortimentBackupTitle')}
        </h2>
        <p className="text-sm text-ink-mute">
          {t('config.sortimentBackupHint')}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => downloadConfig(state)}
            className="flex items-center gap-2 rounded-lg bg-raised px-4 py-2.5 font-semibold text-ink active:bg-pressed"
          >
            <Download className="h-5 w-5" /> {t('config.export')}
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={readOnly}
            className="flex items-center gap-2 rounded-lg bg-raised px-4 py-2.5 font-semibold text-ink active:bg-pressed disabled:bg-raised disabled:text-ink-mute disabled:cursor-not-allowed"
          >
            <Upload className="h-5 w-5" /> {t('config.import')}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImport(file);
              e.target.value = '';
            }}
          />
          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-negative-soft px-3 py-2 text-sm text-negative-ink ring-1 ring-negative-ink">
              <AlertCircle className="h-4 w-4" /> {error}
            </div>
          )}
          {importedAt && !error && (
            <div className="rounded-lg bg-positive-soft px-3 py-2 text-sm font-semibold text-positive-ink ring-1 ring-positive">
              {t('config.imported')}
            </div>
          )}
        </div>
      </section>

      {/* Tagesbilanz-Backup — nur sichtbar wenn Feature aktiv und nicht im
           Joiner-Read-only-Modus (Joiner darf Bilanz weder sehen noch ändern). */}
      {bilanzEnabled && !readOnly && (
        <section className="flex flex-col gap-3 rounded-2xl bg-surface p-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-ink">
            <BookOpen className="h-5 w-5 text-positive-ink" />
            {t('config.bilanzBackupTitle')}
          </h2>
          <p className="text-sm text-ink-mute">
            {t('config.bilanzBackupHint')}{' '}
            <strong className="text-ink">
              {liveBilanzCount} {t('bilanz.entries')}
            </strong>
            .
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => downloadBilanzJson(bilanz, cashStartCents)}
              disabled={bilanz.length === 0}
              className="flex items-center gap-2 rounded-lg bg-raised px-4 py-2.5 font-semibold text-ink active:bg-pressed disabled:bg-raised disabled:text-ink-mute disabled:cursor-not-allowed"
            >
              <Download className="h-5 w-5" /> {t('config.bilanzExport')}
            </button>
            <button
              onClick={() => bilanzFileRef.current?.click()}
              className="flex items-center gap-2 rounded-lg bg-raised px-4 py-2.5 font-semibold text-ink active:bg-pressed"
            >
              <Upload className="h-5 w-5" /> {t('config.bilanzImport')}
            </button>
            <input
              ref={bilanzFileRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleBilanzImport(file);
                e.target.value = '';
              }}
            />
            {bilanzError && (
              <div className="flex items-start gap-2 rounded-lg bg-negative-soft px-3 py-2 text-sm text-negative-ink ring-1 ring-negative-ink">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{bilanzError}</span>
              </div>
            )}
            {bilanzImportedAt && !bilanzError && (
              <div className="rounded-lg bg-positive-soft px-3 py-2 text-sm font-semibold text-positive-ink ring-1 ring-positive">
                {t('config.bilanzImported')}
              </div>
            )}
          </div>

          {/* Bestätigungs-Dialog für Replace */}
          {pendingImport && (
            <div className="flex flex-col gap-2 rounded-lg border border-accent bg-accent-soft p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-accent-ink" />
                <div className="text-sm text-accent-ink">
                  <p className="font-bold">
                    {t('config.bilanzImportConfirmTitle')}
                  </p>
                  <p className="mt-1 leading-relaxed">
                    {t('config.bilanzImportConfirmBody')
                      .replace('{new}', String(pendingImport.visibleCount))
                      .replace('{old}', String(liveBilanzCount))}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={confirmBilanzImport}
                  className="flex items-center gap-2 rounded-lg tap bg-accent px-3 py-2 text-sm font-bold text-on-accent active:bg-accent-press"
                >
                  {t('config.bilanzImportConfirm')}
                </button>
                <button
                  onClick={() => setPendingImport(null)}
                  className="rounded-lg bg-raised px-3 py-2 text-sm font-bold text-ink active:bg-pressed"
                >
                  {t('common.cancel')}
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      <section className="flex flex-col gap-3 rounded-2xl border-2 border-negative-ink bg-negative-soft p-4">
        <div className="flex items-start gap-2">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-negative-ink" />
          <div>
            <h2 className="text-lg font-semibold text-negative-ink">
              {t('config.dangerTitle')}
            </h2>
            <p className="mt-1 text-sm text-negative-ink">
              {t('config.dataDanger')}
            </p>
          </div>
        </div>
        <button
          onClick={onResetAll}
          disabled={readOnly}
          className={`flex items-center justify-center gap-2 rounded-lg px-4 py-3 font-bold transition-colors ${
            resetAllArmed
              ? 'bg-negative text-on-solid shadow ring-2 ring-negative-ink'
              : 'bg-negative text-on-solid active:brightness-110 disabled:bg-raised disabled:text-ink-mute disabled:cursor-not-allowed'
          }`}
        >
          <AlertTriangle className="h-5 w-5" />
          {resetAllArmed ? t('header.resetAllConfirm') : t('header.resetAll')}
        </button>
      </section>
    </div>
  );
}

function PfandConfig({
  state,
  dispatch,
  readOnly,
}: Props & { readOnly: boolean }) {
  const t = useT();
  const [label, setLabel] = useState('');
  const [amount, setAmount] = useState('');

  const cents = parseEURToCents(amount);
  const canAdd = !readOnly && label.trim().length > 0 && cents > 0;

  const add = () => {
    if (!canAdd) return;
    dispatch({
      type: 'ADD_PFAND_TYPE',
      pfandType: { id: generateId(), label: label.trim(), amountCents: cents },
    });
    setLabel('');
    setAmount('');
  };

  return (
    <section className="flex min-w-0 flex-col gap-3 overflow-hidden rounded-2xl bg-surface p-4">
      <h2 className="text-lg font-semibold text-ink">
        {t('config.pfandCategories')}
      </h2>
      <div className="flex flex-col gap-2">
        {state.pfandTypes.length === 0 && (
          <div className="rounded-lg bg-canvas p-3 text-sm text-ink-mute">
            {t('config.noPfandTypes')}
          </div>
        )}
        {state.pfandTypes.map((p) => (
          <PfandRow
            key={p.id}
            pfand={p}
            dispatch={dispatch}
            readOnly={readOnly}
          />
        ))}
      </div>
      {!readOnly && (
        <div className="flex flex-col gap-2 rounded-xl border border-line bg-canvas p-3">
          <div className="text-sm font-semibold text-ink-mute">
            {t('config.newPfand')}
          </div>
          <input
            className="rounded-lg bg-raised px-3 py-3 text-ink placeholder-ink-mute focus:outline-none focus:ring-2 focus:ring-accent-line"
            placeholder={t('config.label')}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            aria-label={t('config.label')}
          />
          <input
            className="rounded-lg bg-raised px-3 py-3 text-ink placeholder-ink-mute focus:outline-none focus:ring-2 focus:ring-accent-line tabular-nums"
            placeholder={t('config.amount')}
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            aria-label={t('config.amount')}
          />
          <button
            onClick={add}
            disabled={!canAdd}
            className="mt-1 flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-3 font-bold text-on-accent active:bg-accent-press disabled:bg-raised disabled:text-ink-mute"
          >
            <Plus className="h-5 w-5" aria-hidden="true" /> {t('config.add')}
          </button>
        </div>
      )}
    </section>
  );
}

function PfandRow({
  pfand,
  dispatch,
  readOnly,
}: {
  pfand: PfandType;
  dispatch: (a: Action) => void;
  readOnly: boolean;
}) {
  const t = useT();
  const [label, setLabel] = useState(pfand.label);
  const [amount, setAmount] = useState(centsToInputString(pfand.amountCents));
  // Änderungen vom Master übernehmen, sonst zeigt die Zeile veraltete Werte
  // und „Speichern" würde sie zurückschreiben.
  useEffect(() => {
    setLabel(pfand.label);
    setAmount(centsToInputString(pfand.amountCents));
  }, [pfand.label, pfand.amountCents]);

  const cents = parseEURToCents(amount);
  const valid = label.trim().length > 0 && cents > 0;
  const dirty = label !== pfand.label || cents !== pfand.amountCents;

  const save = () => {
    if (!valid || !dirty) return;
    dispatch({
      type: 'UPDATE_PFAND_TYPE',
      pfandType: { ...pfand, label: label.trim(), amountCents: cents },
    });
  };

  const reset = () => {
    setLabel(pfand.label);
    setAmount(centsToInputString(pfand.amountCents));
  };

  return (
    <div className="flex items-center gap-2 rounded-lg bg-canvas p-2">
      <input
        className="min-w-0 flex-1 rounded bg-raised px-3 py-2 text-ink focus:outline-none focus:ring-2 focus:ring-accent-line disabled:bg-raised disabled:text-ink-mute"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        disabled={readOnly}
        readOnly={readOnly}
        aria-label={t('config.label')}
      />
      <input
        className="w-24 rounded bg-raised px-3 py-2 text-ink tabular-nums focus:outline-none focus:ring-2 focus:ring-accent-line disabled:bg-raised disabled:text-ink-mute"
        inputMode="decimal"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        disabled={readOnly}
        readOnly={readOnly}
        aria-label={t('config.amount')}
      />
      {!readOnly && dirty && (
        <button
          onClick={reset}
          className="tap flex shrink-0 items-center justify-center rounded-lg bg-raised text-ink-soft active:bg-pressed"
          aria-label={t('config.discard')}
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      )}
      {!readOnly && (
        <>
          <button
            onClick={save}
            disabled={!dirty || !valid}
            className="tap flex shrink-0 items-center justify-center rounded-lg bg-positive text-on-solid active:brightness-110 disabled:bg-raised disabled:text-ink-mute"
            aria-label={t('config.save')}
          >
            <Save className="h-5 w-5" />
          </button>
          <DeleteButton onConfirm={() => dispatch({ type: 'DELETE_PFAND_TYPE', id: pfand.id })} />
        </>
      )}
    </div>
  );
}

function DrinkConfig({
  state,
  dispatch,
  bestandEnabled,
  readOnly,
}: Props & { bestandEnabled: boolean; readOnly: boolean }) {
  const t = useT();
  const [label, setLabel] = useState('');
  const [size, setSize] = useState('');
  const [price, setPrice] = useState('');
  const [iconName, setIconName] = useState<string>('Beer');
  const [pfandTypeId, setPfandTypeId] = useState<string>('');

  const cents = parseEURToCents(price);
  const canAdd = !readOnly && label.trim().length > 0 && cents > 0;

  const add = () => {
    if (!canAdd) return;
    dispatch({
      type: 'ADD_DRINK',
      drink: {
        id: generateId(),
        label: label.trim(),
        size: size.trim(),
        priceCents: cents,
        iconName,
        pfandTypeId: pfandTypeId || null,
      },
    });
    setLabel('');
    setSize('');
    setPrice('');
  };

  const NewIcon = getIcon(iconName);

  return (
    <section className="flex min-w-0 flex-col gap-3 overflow-hidden rounded-2xl bg-surface p-4">
      <h2 className="text-lg font-semibold text-ink">{t('config.drinks')}</h2>
      <div className="flex flex-col gap-2">
        {state.drinks.length === 0 && (
          <div className="rounded-lg bg-canvas p-3 text-sm text-ink-mute">
            {t('config.noDrinks')}
          </div>
        )}
        {state.drinks.map((d) => (
          <DrinkRow
            key={d.id}
            drink={d}
            state={state}
            dispatch={dispatch}
            bestandEnabled={bestandEnabled}
            readOnly={readOnly}
          />
        ))}
      </div>
      {!readOnly && (
      <div className="flex flex-col gap-2 rounded-xl border border-line bg-canvas p-3">
        <div className="text-sm font-semibold text-ink-mute">
          {t('config.newDrink')}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-raised">
            <NewIcon className="h-6 w-6 text-accent-ink" />
          </div>
          <select
            className="w-32 rounded-lg bg-raised px-2 py-3 text-ink focus:outline-none focus:ring-2 focus:ring-accent-line"
            value={iconName}
            onChange={(e) => setIconName(e.target.value)}
            aria-label={t('config.icon')}
          >
            {ICON_NAMES.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
          <input
            className="min-w-0 flex-1 rounded-lg bg-raised px-3 py-3 text-ink placeholder-ink-mute focus:outline-none focus:ring-2 focus:ring-accent-line"
            placeholder={t('config.label')}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            aria-label={t('config.label')}
          />
        </div>
        <div className="flex gap-2">
          <input
            className="w-28 rounded-lg bg-raised px-3 py-3 text-ink placeholder-ink-mute focus:outline-none focus:ring-2 focus:ring-accent-line"
            placeholder={t('config.size')}
            value={size}
            onChange={(e) => setSize(e.target.value)}
            aria-label={t('config.size')}
          />
          <input
            className="flex-1 rounded-lg bg-raised px-3 py-3 text-ink placeholder-ink-mute focus:outline-none focus:ring-2 focus:ring-accent-line tabular-nums"
            placeholder={t('config.priceEur')}
            inputMode="decimal"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            aria-label={t('config.price')}
          />
        </div>
        <select
          className="rounded-lg bg-raised px-3 py-3 text-ink focus:outline-none focus:ring-2 focus:ring-accent-line"
          value={pfandTypeId}
          onChange={(e) => setPfandTypeId(e.target.value)}
          aria-label={t('config.pfandType')}
        >
          <option value="">{t('config.noPfand')}</option>
          {state.pfandTypes.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label} ({formatEUR(p.amountCents)})
            </option>
          ))}
        </select>
        <button
          onClick={add}
          disabled={!canAdd}
          className="mt-1 flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-3 font-bold text-on-accent active:bg-accent-press disabled:bg-raised disabled:text-ink-mute"
        >
          <Plus className="h-5 w-5" aria-hidden="true" /> {t('config.add')}
        </button>
      </div>
      )}
    </section>
  );
}

function DrinkRow({
  drink,
  state,
  dispatch,
  bestandEnabled,
  readOnly,
}: {
  drink: Drink;
  state: State;
  dispatch: (a: Action) => void;
  bestandEnabled: boolean;
  readOnly: boolean;
}) {
  const t = useT();
  const [label, setLabel] = useState(drink.label);
  const [size, setSize] = useState(drink.size);
  const [price, setPrice] = useState(centsToInputString(drink.priceCents));
  const [iconName, setIconName] = useState(drink.iconName);
  const [pfandTypeId, setPfandTypeId] = useState(drink.pfandTypeId ?? '');
  const [stockStr, setStockStr] = useState(
    drink.stockStart != null ? String(drink.stockStart) : '',
  );

  const initialHHEnabled = Boolean(drink.happyHour);
  const [hhEnabled, setHhEnabled] = useState(initialHHEnabled);
  const [hhStart, setHhStart] = useState(
    drink.happyHour ? minutesToTimeString(drink.happyHour.startMinutes) : '17:00',
  );
  const [hhEnd, setHhEnd] = useState(
    drink.happyHour ? minutesToTimeString(drink.happyHour.endMinutes) : '19:00',
  );
  const [hhPrice, setHhPrice] = useState(
    drink.happyHour ? centsToInputString(drink.happyHour.priceCents) : '',
  );

  const Icon = getIcon(iconName);
  const cents = parseEURToCents(price);
  const hhCents = parseEURToCents(hhPrice);
  const hhStartM = timeStringToMinutes(hhStart);
  const hhEndM = timeStringToMinutes(hhEnd);

  const buildHH = (): HappyHour | undefined => {
    if (!hhEnabled) return undefined;
    if (hhStartM === null || hhEndM === null || hhCents <= 0) return undefined;
    return { startMinutes: hhStartM, endMinutes: hhEndM, priceCents: hhCents };
  };

  const happyHourValid =
    !hhEnabled || (hhStartM !== null && hhEndM !== null && hhCents > 0);

  const valid = label.trim().length > 0 && cents > 0 && happyHourValid;

  const currentHH = buildHH();
  const hhEqual =
    (currentHH === undefined && drink.happyHour === undefined) ||
    (currentHH !== undefined &&
      drink.happyHour !== undefined &&
      currentHH.startMinutes === drink.happyHour.startMinutes &&
      currentHH.endMinutes === drink.happyHour.endMinutes &&
      currentHH.priceCents === drink.happyHour.priceCents);

  const stockNum = stockStr.trim() === '' ? null : Math.max(0, Math.floor(Number(stockStr)));
  const stockValid = stockStr.trim() === '' || (Number.isFinite(Number(stockStr)) && Number(stockStr) >= 0);
  const stockEqual = (drink.stockStart ?? null) === (stockNum ?? null);

  const dirty =
    label !== drink.label ||
    size !== drink.size ||
    cents !== drink.priceCents ||
    iconName !== drink.iconName ||
    (pfandTypeId || null) !== drink.pfandTypeId ||
    !hhEqual ||
    !stockEqual;

  const save = () => {
    if (!valid || !dirty || !stockValid) return;
    const hh = buildHH();
    dispatch({
      type: 'UPDATE_DRINK',
      drink: {
        ...drink,
        label: label.trim(),
        size: size.trim(),
        priceCents: cents,
        iconName,
        pfandTypeId: pfandTypeId || null,
        stockStart: stockNum,
        ...(hh ? { happyHour: hh } : { happyHour: undefined }),
      },
    });
  };

  const reset = () => {
    setLabel(drink.label);
    setSize(drink.size);
    setPrice(centsToInputString(drink.priceCents));
    setIconName(drink.iconName);
    setPfandTypeId(drink.pfandTypeId ?? '');
    setHhEnabled(Boolean(drink.happyHour));
    setHhStart(
      drink.happyHour ? minutesToTimeString(drink.happyHour.startMinutes) : '17:00',
    );
    setHhEnd(
      drink.happyHour ? minutesToTimeString(drink.happyHour.endMinutes) : '19:00',
    );
    setHhPrice(drink.happyHour ? centsToInputString(drink.happyHour.priceCents) : '');
    setStockStr(drink.stockStart != null ? String(drink.stockStart) : '');
  };

  // Änderungen vom Master übernehmen (siehe PfandRow).
  const drinkJson = JSON.stringify(drink);
  useEffect(() => {
    reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drinkJson]);

  const inputDis = readOnly ? 'bg-surface text-ink-mute cursor-not-allowed' : 'bg-raised text-ink';
  return (
    <div className="flex flex-col gap-2 rounded-lg bg-canvas p-2">
      <div className="flex items-center gap-2">
        <div className="tap flex shrink-0 items-center justify-center rounded-lg bg-raised">
          <Icon className="h-5 w-5 text-accent-ink" />
        </div>
        <select
          className={`w-28 rounded px-2 py-2 focus:outline-none focus:ring-2 focus:ring-accent-line ${inputDis}`}
          value={iconName}
          onChange={(e) => setIconName(e.target.value)}
          disabled={readOnly}
          aria-label={t('config.icon')}
        >
          {ICON_NAMES.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
        <input
          className={`min-w-0 flex-1 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent-line ${inputDis}`}
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          disabled={readOnly}
          readOnly={readOnly}
          aria-label={t('config.label')}
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <input
          className={`w-20 rounded px-2 py-2 focus:outline-none focus:ring-2 focus:ring-accent-line ${inputDis}`}
          value={size}
          onChange={(e) => setSize(e.target.value)}
          disabled={readOnly}
          readOnly={readOnly}
          aria-label={t('config.size')}
        />
        <input
          className={`w-24 rounded px-2 py-2 tabular-nums focus:outline-none focus:ring-2 focus:ring-accent-line ${inputDis}`}
          inputMode="decimal"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          disabled={readOnly}
          readOnly={readOnly}
          aria-label={t('config.price')}
        />
        <select
          className={`min-w-[140px] flex-1 rounded px-2 py-2 focus:outline-none focus:ring-2 focus:ring-accent-line ${inputDis}`}
          value={pfandTypeId}
          onChange={(e) => setPfandTypeId(e.target.value)}
          disabled={readOnly}
          aria-label={t('config.pfandType')}
        >
          <option value="">{t('config.noPfand')}</option>
          {state.pfandTypes.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
        {!readOnly && (
        <div className="ml-auto flex items-center gap-2">
          {dirty && (
            <button
              onClick={reset}
              className="tap flex shrink-0 items-center justify-center rounded-lg bg-raised text-ink-soft active:bg-pressed"
              aria-label={t('config.discard')}
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={save}
            disabled={!dirty || !valid}
            className="tap flex shrink-0 items-center justify-center rounded-lg bg-positive text-on-solid active:brightness-110 disabled:bg-raised disabled:text-ink-mute"
            aria-label={t('config.save')}
          >
            <Save className="h-5 w-5" />
          </button>
          <DeleteButton onConfirm={() => dispatch({ type: 'DELETE_DRINK', id: drink.id })} />
        </div>
        )}
      </div>
      {bestandEnabled && (
        <div className="flex flex-wrap items-center gap-2 border-t border-line pt-2">
          <label className="flex items-center gap-1.5 text-xs font-semibold text-accent-ink">
            <Package className="h-3.5 w-3.5" />
            {t('config.stockTitle')}
          </label>
          <input
            type="number"
            min={0}
            step={1}
            placeholder={t('config.stockUnlimited')}
            value={stockStr}
            onChange={(e) => setStockStr(e.target.value)}
            disabled={readOnly}
            readOnly={readOnly}
            className={`w-32 rounded px-2 py-1.5 text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-accent-line ${inputDis}`}
            aria-label={t('config.stockStart')}
          />
          <span className="text-xs text-ink-mute">
            {stockNum == null ? t('config.stockUnlimited') : stockNum}
          </span>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2 border-t border-line pt-2">
        <label className="flex cursor-pointer select-none items-center gap-2 text-xs font-semibold text-promo-ink">
          <input
            type="checkbox"
            className="h-4 w-4 accent-promo"
            checked={hhEnabled}
            onChange={(e) => setHhEnabled(e.target.checked)}
            disabled={readOnly}
          />
          <Sparkles className="h-3.5 w-3.5" />
          {t('config.happyHour')}
        </label>
        {hhEnabled && (
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-ink-soft">
            <input
              type="time"
              value={hhStart}
              onChange={(e) => setHhStart(e.target.value)}
              disabled={readOnly}
              className={`rounded px-2 py-1.5 tabular-nums focus:outline-none focus:ring-2 focus:ring-accent-line ${inputDis}`}
              aria-label={`${t('config.happyHour')}: ${t('config.startTime')}`}
            />
            <span className="text-ink-mute">–</span>
            <input
              type="time"
              value={hhEnd}
              onChange={(e) => setHhEnd(e.target.value)}
              disabled={readOnly}
              className={`rounded px-2 py-1.5 tabular-nums focus:outline-none focus:ring-2 focus:ring-accent-line ${inputDis}`}
              aria-label={`${t('config.happyHour')}: ${t('config.endTime')}`}
            />
            <span className="text-ink-mute">→</span>
            <input
              type="text"
              inputMode="decimal"
              placeholder={t('config.priceEur')}
              value={hhPrice}
              onChange={(e) => setHhPrice(e.target.value)}
              disabled={readOnly}
              readOnly={readOnly}
              className={`w-24 rounded px-2 py-1.5 tabular-nums focus:outline-none focus:ring-2 focus:ring-accent-line ${inputDis}`}
              aria-label={`${t('config.happyHour')}: ${t('config.price')}`}
            />
          </div>
        )}
      </div>
    </div>
  );
}
