import {
  Component,
  Suspense,
  lazy,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Eraser, RotateCcw, Trash2 } from 'lucide-react';
import { reducer, type Action } from './reducer';
import { getInitialState } from './defaults';
import { computeTotals } from './totals';
import {
  REGULAR_LAYOUT_QUERY,
  useMediaQuery,
  useNowMinutes,
  useWakeLock,
} from './hooks';
import { beepAdd, beepRemove, beepLong } from './sound';
import { DrinkGrid } from './components/DrinkGrid';
import { OrderSummary } from './components/OrderSummary';
import { PfandReturns } from './components/PfandReturns';
import { Checkout, TotalsBreakdown } from './components/Checkout';
import { SortimentPanel, DataPanel } from './components/ConfigPanel';
import { SettingsPanel } from './components/SettingsPanel';
import { BilanzPanel } from './components/BilanzPanel';
import { BottomTabBar, TopTabBar, type Tab } from './components/AppNav';
import { ConnectionBanner, SyncChip } from './components/SyncIndicators';
import { Sheet } from './components/Sheet';
import { DsgvoModal } from './components/DsgvoModal';
import { ImpressumModal } from './components/ImpressumModal';
import { DatenschutzModal } from './components/DatenschutzModal';
import {
  loadStoredConfig,
  saveStoredConfig,
  clearStoredConfig,
} from './configStorage';
import {
  loadSettings,
  saveSettings,
  splitSettings,
  mergeSettings,
  watchSystemTheme,
  type AppSettings,
} from './settings';
import { whenYDocReady, clearYDocStorage } from './sync/ydoc';
import {
  applyConfigChange,
  ensureConfigOrder,
  isYDocEmpty,
  readDrinksFromYjs,
  readPfandFromYjs,
  readBilanzFromYjs,
  readSharedSettingsFromYjs,
  replaceBilanzInYjs,
  seedYDoc,
  subscribeYjs,
  upsertBilanzEntries,
  writeSharedSettingsToYjs,
} from './sync/bridge';
import { IDLE_STATUS, SyncSession, type PeerStatus } from './sync/webrtc';
import { buildOrderSnapshot, type OrderSnapshot } from './sync/orderSnapshot';
import type * as Y from 'yjs';
import {
  type BilanzEntry,
  type BilanzLine,
  type BilanzReturn,
  loadBilanz,
  saveBilanz,
  clearBilanz,
  makeEntryFromOrder,
} from './bilanz';
import { I18nProvider, useT } from './i18n';
import type { TranslationKey } from './i18n/translations';
import { effectivePriceCents } from './effectivePrice';
import { formatEUR } from './utils';
import type { OrderLine, ReturnLine } from './types';

// Lazy: QR-Renderer + jsqr fließen nur in eigene Chunks, nicht ins Haupt-Bundle.
const loadCustomerDisplay = () => import('./components/CustomerDisplay');
const loadSyncPanel = () => import('./components/SyncPanel');
const CustomerDisplay = lazy(() =>
  loadCustomerDisplay().then((m) => ({ default: m.CustomerDisplay })),
);
const SyncPanel = lazy(() =>
  loadSyncPanel().then((m) => ({ default: m.SyncPanel })),
);

const initialState = (() => {
  const stored = loadStoredConfig();
  if (!stored) return getInitialState();
  return {
    drinks: stored.drinks,
    pfandTypes: stored.pfandTypes,
    order: [],
    returns: [],
  };
})();

const initialSettings: AppSettings = loadSettings();
const initialBilanz: BilanzEntry[] = loadBilanz();

/** So lange bleibt „Rückgängig" nach dem Kassieren sichtbar. */
const UNDO_VISIBLE_MS = 6000;
/** Die Tagesbilanz in localStorage ist nur Backup: gebündelt statt bei jedem Verkauf. */
const BILANZ_BACKUP_DELAY_MS = 800;

/** Fängt z. B. einen nicht ladbaren Code-Chunk ab, statt weiß zu bleiben. */
class LoadBoundary extends Component<
  { message: string; action: string; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl bg-surface p-6 text-center">
        <p className="text-sm text-ink-soft">{this.props.message}</p>
        <button
          onClick={() => window.location.reload()}
          className="tap rounded-xl bg-accent px-5 font-bold text-on-accent active:bg-accent-press"
        >
          {this.props.action}
        </button>
      </div>
    );
  }
}

export default function App() {
  const [settings, setSettings] = useState<AppSettings>(initialSettings);

  useEffect(() => watchSystemTheme(settings.theme), [settings.theme]);

  useEffect(() => {
    document.documentElement.lang = settings.language;
  }, [settings.language]);

  // Persist settings
  const isFirstSettingsRender = useRef(true);
  useEffect(() => {
    if (isFirstSettingsRender.current) {
      isFirstSettingsRender.current = false;
      return;
    }
    saveSettings(settings);
  }, [settings]);

  return (
    <I18nProvider lang={settings.language}>
      <AppInner settings={settings} setSettings={setSettings} />
    </I18nProvider>
  );
}

type InnerProps = {
  settings: AppSettings;
  setSettings: (s: AppSettings) => void;
};

/** Letzter Abschluss, damit er sich rückgängig machen lässt. */
type LastAction = {
  key: number;
  kind: 'sold' | 'discarded';
  order: OrderLine[];
  returns: ReturnLine[];
  cashGivenCents: number | null;
  tipCents: number;
  totalCents: number;
  entry: BilanzEntry | null;
};

function AppInner({ settings, setSettings }: InnerProps) {
  const t = useT();
  const [state, dispatch] = useReducer(reducer, initialState);
  const stateRef = useRef(state);
  stateRef.current = state;
  const [tab, setTab] = useState<Tab>('order');
  const [confirmAll, setConfirmAll] = useState(false);
  const [stornoMode, setStornoMode] = useState(false);
  const [cashGivenCents, setCashGivenCents] = useState<number | null>(null);
  const [tipCents, setTipCents] = useState(0);
  const [dsgvoOpen, setDsgvoOpen] = useState(false);
  const [impressumOpen, setImpressumOpen] = useState(false);
  const [datenschutzOpen, setDatenschutzOpen] = useState(false);
  const [orderSheetOpen, setOrderSheetOpen] = useState(false);
  const [bilanz, setBilanz] = useState<BilanzEntry[]>(initialBilanz);
  const [lastAction, setLastAction] = useState<LastAction | null>(null);
  const [saleCount, setSaleCount] = useState(0);

  const isRegular = useMediaQuery(REGULAR_LAYOUT_QUERY);

  const ydocRef = useRef<Y.Doc | null>(null);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const bilanzRef = useRef(bilanz);
  bilanzRef.current = bilanz;

  // WebRTC-Sync-Session
  const [syncSession, setSyncSession] = useState<SyncSession | null>(null);
  const [syncStatus, setSyncStatus] = useState<PeerStatus>(IDLE_STATUS);
  /** Display-Modus: empfangener Order-Snapshot vom gepairten Kassen-Gerät. */
  const [displaySnapshot, setDisplaySnapshot] = useState<OrderSnapshot | null>(
    null,
  );
  /** Sequenz-Counter für Order-Broadcasts (Stale-Detection auf der Display-Seite). */
  const orderSeqRef = useRef(0);

  useWakeLock(settings.keepAwake);

  // Code-Chunks schon laden, solange Netz da ist: Auf dem Festplatz wäre es zu spät.
  useEffect(() => {
    const load = () => {
      void loadSyncPanel().catch(() => {});
      void loadCustomerDisplay().catch(() => {});
    };
    const id = window.setTimeout(load, 1500);
    return () => window.clearTimeout(id);
  }, []);

  // App kommt nach vorn: Browser können Verbindungen im Hintergrund drosseln.
  // Lebenszeichen einholen und Daten abgleichen, statt vorschnell aufzugeben.
  useEffect(() => {
    if (!syncSession) return;
    const handler = () => {
      if (document.visibilityState === 'visible') syncSession.handleForeground();
    };
    document.addEventListener('visibilitychange', handler);
    window.addEventListener('pageshow', handler);
    window.addEventListener('online', handler);
    return () => {
      document.removeEventListener('visibilitychange', handler);
      window.removeEventListener('pageshow', handler);
      window.removeEventListener('online', handler);
    };
  }, [syncSession]);

  // Wenn der User das Gerät umbenennt, schicken wir die neue Identity an alle Peers.
  useEffect(() => {
    syncSession?.broadcastIdentity();
  }, [syncSession, settings.deviceName]);

  const nowMinutes = useNowMinutes();
  const totals = useMemo(
    () => computeTotals(state, nowMinutes, tipCents),
    [state, nowMinutes, tipCents],
  );
  const hasOrder = state.order.length > 0 || state.returns.length > 0;
  const totalQty = state.order.reduce((s, l) => s + l.qty, 0);

  // Order-Snapshot an Display-Peers schicken — bei jeder relevanten Änderung.
  // Display-Geräte broadcasten keine Order, sie empfangen nur.
  useEffect(() => {
    if (!syncSession || settings.displayMode) return;
    orderSeqRef.current += 1;
    syncSession.broadcastOrder(
      buildOrderSnapshot({
        state,
        drinks: state.drinks,
        pfandTypes: state.pfandTypes,
        totals,
        nowMinutes,
        cashGivenCents,
        tipCents,
        cashierName: settings.deviceName,
        seq: orderSeqRef.current,
      }),
    );
  }, [
    syncSession,
    settings.displayMode,
    settings.deviceName,
    state,
    totals,
    nowMinutes,
    cashGivenCents,
    tipCents,
  ]);

  useEffect(() => {
    if (tab !== 'order') setOrderSheetOpen(false);
  }, [tab]);

  // Storno-Modus auto-aus, sobald die Bestellung leer ist
  useEffect(() => {
    if (stornoMode && state.order.length === 0) setStornoMode(false);
  }, [stornoMode, state.order.length]);

  /**
   * Yjs-Bootstrap: Wenn die Doc aus IndexedDB hydriert ist, entweder
   * (a) leer → localStorage-Stand einmalig übernehmen, oder
   * (b) befüllt → Yjs-Stand anzeigen.
   * Danach ist Yjs die Quelle: Lokale Änderungen schreiben direkt als gezielte
   * Operationen hinein, Änderungen anderer Geräte kommen über den Observer.
   */
  useEffect(() => {
    let disposer: (() => void) | undefined;
    let cancelled = false;

    void (async () => {
      const ydoc = await whenYDocReady();
      if (cancelled) return;
      ydocRef.current = ydoc;

      if (isYDocEmpty(ydoc)) {
        seedYDoc(ydoc, {
          drinks: stateRef.current.drinks,
          pfandTypes: stateRef.current.pfandTypes,
          bilanz: bilanzRef.current,
          shared: splitSettings(settingsRef.current).shared,
        });
      } else {
        ensureConfigOrder(ydoc);
        dispatch({
          type: 'APPLY_SYNCED_CONFIG',
          drinks: readDrinksFromYjs(ydoc),
          pfandTypes: readPfandFromYjs(ydoc),
        });
        setBilanz(readBilanzFromYjs(ydoc));
        const shared = readSharedSettingsFromYjs(ydoc);
        if (shared) {
          const { local } = splitSettings(settingsRef.current);
          setSettings(mergeSettings(local, shared));
        }
      }

      const session = new SyncSession(ydoc, {
        onStatus: (s) => setSyncStatus(s),
        // Getter — damit Renaming sofort wirkt ohne Re-Instantiation der Session
        getLocalIdentity: () => ({
          deviceId: settingsRef.current.deviceId,
          deviceName: settingsRef.current.deviceName,
        }),
        onOrderSnapshot: (snapshot) => setDisplaySnapshot(snapshot),
      });
      setSyncSession(session);
      setSyncStatus(session.getStatus());

      disposer = subscribeYjs(ydoc, {
        onConfig: ({ drinks, pfandTypes }) => {
          dispatch({ type: 'APPLY_SYNCED_CONFIG', drinks, pfandTypes });
          saveStoredConfig(pfandTypes, drinks);
        },
        onBilanz: (entries) => setBilanz(entries),
        onSharedSettings: (shared) => {
          const { local } = splitSettings(settingsRef.current);
          setSettings(mergeSettings(local, shared));
        },
      });
    })();

    return () => {
      cancelled = true;
      disposer?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Sortiments-Änderungen aus dem UI: Reducer, Backup und Yjs in einem Schritt. */
  const dispatchConfig = (action: Action) => {
    const prev = stateRef.current;
    const next = reducer(prev, action);
    stateRef.current = next;
    dispatch(action);
    saveStoredConfig(next.pfandTypes, next.drinks);
    if (ydocRef.current) applyConfigChange(ydocRef.current, prev, next);
  };

  /** Einstellungen aus dem UI. Geteilte Felder gehen direkt an die anderen Geräte. */
  const changeSettings = (next: AppSettings) => {
    setSettings(next);
    if (ydocRef.current) {
      writeSharedSettingsToYjs(ydocRef.current, splitSettings(next).shared);
    }
  };

  const writeBilanz = (entries: BilanzEntry[]) => {
    const ydoc = ydocRef.current;
    if (ydoc) {
      upsertBilanzEntries(ydoc, entries);
      setBilanz(readBilanzFromYjs(ydoc));
    } else {
      // Nur in den ersten Millisekunden vor dem Bootstrap möglich.
      const ids = new Set(entries.map((e) => e.id));
      setBilanz((prev) => [...prev.filter((e) => !ids.has(e.id)), ...entries]);
    }
  };

  const replaceBilanz = (entries: BilanzEntry[]) => {
    if (ydocRef.current) replaceBilanzInYjs(ydocRef.current, entries);
    setBilanz(entries);
  };

  // Backup der Tagesbilanz in localStorage, gebündelt.
  useEffect(() => {
    const id = window.setTimeout(() => saveBilanz(bilanz), BILANZ_BACKUP_DELAY_MS);
    return () => window.clearTimeout(id);
  }, [bilanz]);

  // Reset tip if feature gets disabled
  useEffect(() => {
    if (!settings.features.trinkgeld && tipCents !== 0) setTipCents(0);
  }, [settings.features.trinkgeld, tipCents]);

  useEffect(() => {
    if (!lastAction) return;
    const id = window.setTimeout(() => setLastAction(null), UNDO_VISIBLE_MS);
    return () => window.clearTimeout(id);
  }, [lastAction]);

  // Eine Nebenkasse darf die Tagesbilanz nicht sehen.
  const isJoinerSyncing =
    syncStatus.state === 'connected' && syncStatus.role === 'joiner';

  const playIf = (fn: () => void) => {
    if (settings.sound) fn();
  };

  const handleAdd = (drinkId: string, count: number) => {
    dispatch({ type: 'INCREMENT_ORDER', drinkId, by: count });
    playIf(beepAdd);
  };

  const handleRemove = (drinkId: string, count: number) => {
    dispatch({ type: 'DECREMENT_ORDER', drinkId, by: count });
    playIf(beepRemove);
  };

  const incReturn = (id: string) => {
    dispatch({ type: 'INCREMENT_RETURN', pfandTypeId: id });
    playIf(beepRemove);
  };
  const decReturn = (id: string) => {
    dispatch({ type: 'DECREMENT_RETURN', pfandTypeId: id });
    playIf(beepRemove);
  };

  /** Build BilanzEntry from current state — used when a sale is completed */
  const captureCurrentAsEntry = (): BilanzEntry | null => {
    if (!hasOrder && tipCents === 0) return null;
    const items: BilanzLine[] = state.order.map((line) => {
      const drink = state.drinks.find((d) => d.id === line.drinkId);
      const pfand = drink?.pfandTypeId
        ? state.pfandTypes.find((p) => p.id === drink.pfandTypeId)
        : null;
      const unitPrice = drink ? effectivePriceCents(drink, nowMinutes) : 0;
      return {
        drinkLabel: drink?.label ?? '?',
        drinkSize: drink?.size ?? '',
        qty: line.qty,
        unitPriceCents: unitPrice,
        pfandLabel: pfand?.label ?? null,
        pfandAmountCents: pfand?.amountCents ?? 0,
      };
    });
    const returns: BilanzReturn[] = state.returns.map((line) => {
      const pfand = state.pfandTypes.find((p) => p.id === line.pfandTypeId);
      return {
        pfandLabel: pfand?.label ?? '?',
        qty: line.qty,
        pfandAmountCents: pfand?.amountCents ?? 0,
      };
    });
    return makeEntryFromOrder({
      items,
      returns,
      drinksSubtotalCents: totals.drinksSubtotalCents,
      pfandOutCents: totals.pfandOutCents,
      pfandReturnCents: totals.pfandReturnCents,
      tipCents,
      paymentMethod: 'cash',
      deviceId: settings.deviceId,
      deviceName: settings.deviceName,
    });
  };

  const clearCurrentOrder = () => {
    dispatch({ type: 'RESET_ORDER' });
    setCashGivenCents(null);
    setTipCents(0);
    setStornoMode(false);
    setOrderSheetOpen(false);
  };

  const rememberAction = (kind: LastAction['kind'], entry: BilanzEntry | null) => {
    setLastAction({
      key: Date.now(),
      kind,
      order: state.order,
      returns: state.returns,
      cashGivenCents,
      tipCents,
      totalCents: totals.totalCents,
      entry,
    });
  };

  const handleCompleteSale = () => {
    const entry = settings.features.tagesbilanz ? captureCurrentAsEntry() : null;
    if (entry) writeBilanz([entry]);
    rememberAction('sold', entry);
    setSaleCount((n) => n + 1);
    clearCurrentOrder();
    playIf(beepAdd);
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate(20);
      } catch {
        /* noop */
      }
    }
  };

  const handleDiscardOrder = () => {
    rememberAction('discarded', null);
    clearCurrentOrder();
    playIf(beepRemove);
  };

  const handleUndo = () => {
    if (!lastAction) return;
    dispatch({
      type: 'RESTORE_ORDER',
      order: lastAction.order,
      returns: lastAction.returns,
    });
    setCashGivenCents(lastAction.cashGivenCents);
    setTipCents(lastAction.tipCents);
    if (lastAction.entry) writeBilanz([{ ...lastAction.entry, deleted: true }]);
    setLastAction(null);
    setTab('order');
  };

  const handleResetAll = () => {
    if (confirmAll) {
      // Aktive Sync trennen — sonst würden andere Peers die Resets als
      // Drinks-/Bilanz-Wipes empfangen statt selbst zurückzusetzen.
      syncSession?.disconnect();
      clearStoredConfig();
      clearBilanz();
      // Neu laden: Doc, Session und Zustand starten garantiert sauber.
      void clearYDocStorage().finally(() => window.location.reload());
    } else {
      setConfirmAll(true);
      window.setTimeout(() => setConfirmAll(false), 3000);
    }
  };

  const reloadBoundary = {
    message: t('app.loadError'),
    action: t('app.reload'),
  };

  // Display-Modus überschreibt das gesamte UI — keine Kassen-Bedienung,
  // nur die Customer-Display-Komponente (lazy-loaded).
  if (settings.displayMode) {
    return (
      <LoadBoundary {...reloadBoundary}>
        <Suspense
          fallback={
            <div className="flex h-full items-center justify-center bg-canvas text-ink-mute">
              …
            </div>
          }
        >
          <CustomerDisplay
            session={syncSession}
            status={syncStatus}
            snapshot={displaySnapshot}
            onExitDisplayMode={() => {
              setSettings({ ...settingsRef.current, displayMode: false });
              setDisplaySnapshot(null);
            }}
            deviceName={settings.deviceName}
          />
        </Suspense>
      </LoadBoundary>
    );
  }

  const NAV_TITLE: Record<Tab, TranslationKey> = {
    order: 'nav.order',
    bilanz: 'nav.bilanz',
    sortiment: 'nav.sortiment',
    devices: 'nav.devices',
    settings: 'nav.settings',
  };

  const readOnlyBanner = isJoinerSyncing && (
    <p className="rounded-2xl bg-accent-soft p-3 text-sm text-ink">
      {t('sync.joinerReadOnly')}
    </p>
  );

  const stornoButton = tab === 'order' && (
    <button
      onClick={() => setStornoMode((s) => !s)}
      disabled={state.order.length === 0}
      className={`tap flex shrink-0 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold transition-colors disabled:text-ink-mute disabled:opacity-60 ${
        stornoMode ? 'bg-negative text-on-solid' : 'text-ink-soft active:bg-raised'
      }`}
      aria-pressed={stornoMode}
    >
      <Eraser className="h-5 w-5" aria-hidden="true" />
      {t('header.storno')}
    </button>
  );

  const orderHeader = (
    <div className="flex items-center justify-between gap-2">
      <h2 className="text-sm font-medium text-ink-soft">{t('order.title')}</h2>
      {hasOrder && (
        <button
          onClick={handleDiscardOrder}
          className="tap -my-2 flex items-center gap-1.5 rounded-lg px-2 text-sm font-medium text-ink-mute active:bg-raised"
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
          {t('sale.discard')}
        </button>
      )}
    </div>
  );

  const checkout = (
    <Checkout
      totals={totals}
      itemCount={totalQty}
      hasOrder={hasOrder}
      cashGivenCents={cashGivenCents}
      onCashGivenChange={setCashGivenCents}
      tipEnabled={settings.features.trinkgeld}
      tipCents={tipCents}
      onTipChange={setTipCents}
      onComplete={handleCompleteSale}
      onOpenOrder={() => setOrderSheetOpen(true)}
      saleCount={saleCount}
    />
  );

  return (
    <div className="flex h-full flex-col bg-canvas pl-safe pr-safe text-ink">
      <header
        className={`flex shrink-0 items-center gap-2 px-2 pb-1.5 pt-safe-2 transition-colors ${
          stornoMode ? 'bg-negative-soft' : ''
        }`}
      >
        <h1 className="min-w-0 truncate pl-1 text-lg font-semibold regular:sr-only">
          {t(NAV_TITLE[tab])}
        </h1>
        <TopTabBar tab={tab} onChange={setTab} syncStatus={syncStatus} />
        <SyncChip status={syncStatus} onClick={() => setTab('devices')} />
        <div className="flex-1" />
        {stornoButton}
      </header>

      <ConnectionBanner
        status={syncStatus}
        onReconnect={() => setTab('devices')}
        onDismiss={() => syncSession?.dismissLostPeers()}
      />

      <main className="relative flex min-h-0 flex-1 flex-col regular:flex-row">
        {tab === 'order' ? (
          <>
            <section
              className={`relative min-h-0 min-w-0 flex-1 ${stornoMode ? 'bg-negative-soft/40' : ''}`}
              aria-label={t('nav.order')}
            >
              <div className="h-full overflow-y-auto">
                {stornoMode && (
                  <div className="sticky top-0 z-[5] bg-negative px-4 py-1 text-center text-sm font-semibold text-on-solid">
                    {t('banner.stornoMode')}
                  </div>
                )}
                <DrinkGrid
                  drinks={state.drinks}
                  pfandTypes={state.pfandTypes}
                  order={state.order}
                  nowMinutes={nowMinutes}
                  stornoMode={stornoMode}
                  bestandEnabled={settings.features.bestand}
                  bilanzEntries={bilanz}
                  onAdd={handleAdd}
                  onRemove={handleRemove}
                  onLongPressStart={() => playIf(beepLong)}
                />
              </div>
              {lastAction && (
                <div
                  key={lastAction.key}
                  className="animate-toast-in absolute inset-x-2 bottom-2 z-10 flex items-center gap-2 rounded-2xl bg-raised py-1 pl-4 pr-1 shadow-lg ring-1 ring-line"
                  role="status"
                >
                  <span className="min-w-0 flex-1 truncate text-[0.9375rem] font-medium text-ink">
                    {lastAction.kind === 'sold'
                      ? t('sale.done').replace('{amount}', formatEUR(lastAction.totalCents))
                      : t('sale.discarded')}
                  </span>
                  <button
                    onClick={handleUndo}
                    className="tap flex shrink-0 items-center gap-1.5 rounded-xl px-3 text-[0.9375rem] font-semibold text-accent-ink active:bg-pressed"
                  >
                    <RotateCcw className="h-4 w-4" aria-hidden="true" />
                    {t('sale.undo')}
                  </button>
                </div>
              )}
            </section>

            {isRegular ? (
              <aside className="flex min-h-0 w-[22rem] shrink-0 flex-col gap-2 border-l border-line p-2 lg:w-[25rem]">
                {/* Bei wenig Höhe (Handy quer) scrollt der Bereich als Ganzes,
                    damit die Bestellung nicht zu einem Spalt zusammenschrumpft. */}
                <div className="flex min-h-0 flex-1 flex-col gap-1.5 [@media(max-height:520px)]:overflow-y-auto">
                  {orderHeader}
                  <div className="min-h-0 flex-1 overflow-y-auto [@media(max-height:520px)]:flex-none [@media(max-height:520px)]:overflow-visible">
                    <OrderSummary
                      state={state}
                      nowMinutes={nowMinutes}
                      onIncrement={(id) => handleAdd(id, 1)}
                      onDecrement={(id) => handleRemove(id, 1)}
                    />
                  </div>
                  {hasOrder && <TotalsBreakdown totals={totals} tipCents={tipCents} />}
                  <PfandReturns state={state} onIncrement={incReturn} onDecrement={decReturn} />
                </div>
                {checkout}
              </aside>
            ) : (
              <div className="flex shrink-0 flex-col gap-1.5 border-t border-line p-2">
                <PfandReturns state={state} onIncrement={incReturn} onDecrement={decReturn} />
                {checkout}
              </div>
            )}
          </>
        ) : (
          <section className="min-h-0 flex-1 overflow-y-auto">
            <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 p-2 sm:p-3">
              {tab === 'bilanz' && (
                <BilanzPanel
                  entries={bilanz}
                  cashStartCents={settings.cashStartCents}
                  enabled={settings.features.tagesbilanz}
                  isJoiner={isJoinerSyncing}
                  onEnable={() =>
                    changeSettings({
                      ...settings,
                      features: { ...settings.features, tagesbilanz: true },
                    })
                  }
                  onUpdate={(updated) => writeBilanz([updated])}
                  onDelete={(id) => {
                    const entry = bilanz.find((e) => e.id === id);
                    if (entry) writeBilanz([{ ...entry, deleted: true }]);
                  }}
                  onClearAll={() =>
                    writeBilanz(bilanz.map((e) => ({ ...e, deleted: true })))
                  }
                />
              )}
              {tab === 'sortiment' && (
                <>
                  {readOnlyBanner}
                  <SortimentPanel
                    state={state}
                    dispatch={dispatchConfig}
                    bestandEnabled={settings.features.bestand}
                    readOnly={isJoinerSyncing}
                  />
                </>
              )}
              {tab === 'devices' && (
                <LoadBoundary {...reloadBoundary}>
                  <Suspense
                    fallback={
                      <div className="rounded-2xl bg-surface p-4 text-sm text-ink-mute">
                        {t('sync.notReady')}
                      </div>
                    }
                  >
                    <SyncPanel
                      session={syncSession}
                      status={syncStatus}
                      deviceName={settings.deviceName}
                      onDeviceNameChange={(name) =>
                        setSettings({ ...settingsRef.current, deviceName: name })
                      }
                      onEnterDisplayMode={() =>
                        setSettings({ ...settingsRef.current, displayMode: true })
                      }
                    />
                  </Suspense>
                </LoadBoundary>
              )}
              {tab === 'settings' && (
                <>
                  {readOnlyBanner}
                  <SettingsPanel
                    settings={settings}
                    onChange={changeSettings}
                    readOnly={isJoinerSyncing}
                    onOpenAbout={() => setDsgvoOpen(true)}
                    onOpenPrivacy={() => setDatenschutzOpen(true)}
                    onOpenImprint={() => setImpressumOpen(true)}
                  />
                  <DataPanel
                    state={state}
                    dispatch={dispatchConfig}
                    onResetAll={handleResetAll}
                    resetAllArmed={confirmAll}
                    readOnly={isJoinerSyncing}
                    bilanz={bilanz}
                    onBilanzReplace={replaceBilanz}
                    bilanzEnabled={settings.features.tagesbilanz}
                    cashStartCents={settings.cashStartCents}
                  />
                </>
              )}
            </div>
          </section>
        )}
      </main>

      <BottomTabBar tab={tab} onChange={setTab} syncStatus={syncStatus} />

      {!isRegular && (
        <Sheet
          open={orderSheetOpen}
          onClose={() => setOrderSheetOpen(false)}
          title={t('order.title')}
          footer={hasOrder ? <TotalsBreakdown totals={totals} tipCents={tipCents} /> : undefined}
        >
          <div className="flex flex-col gap-3">
            <OrderSummary
              state={state}
              nowMinutes={nowMinutes}
              onIncrement={(id) => handleAdd(id, 1)}
              onDecrement={(id) => handleRemove(id, 1)}
            />
            {hasOrder && (
              <button
                onClick={handleDiscardOrder}
                className="tap flex items-center justify-center gap-2 rounded-xl bg-raised px-4 font-semibold text-negative-ink active:bg-pressed"
              >
                <Trash2 className="h-5 w-5" aria-hidden="true" />
                {t('sale.discardOrder')}
              </button>
            )}
          </div>
        </Sheet>
      )}

      <DsgvoModal
        open={dsgvoOpen}
        onClose={() => setDsgvoOpen(false)}
        onOpenImpressum={() => {
          setDsgvoOpen(false);
          setImpressumOpen(true);
        }}
        onOpenDatenschutz={() => {
          setDsgvoOpen(false);
          setDatenschutzOpen(true);
        }}
      />
      <ImpressumModal
        open={impressumOpen}
        onClose={() => setImpressumOpen(false)}
      />
      <DatenschutzModal
        open={datenschutzOpen}
        onClose={() => setDatenschutzOpen(false)}
      />
    </div>
  );
}
