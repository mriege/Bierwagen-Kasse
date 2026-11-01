import { useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowLeftFromLine,
  Loader2,
  Maximize2,
  Minimize2,
  Monitor,
  RefreshCw,
  ScanLine,
  Sparkles,
  WifiOff,
  Wifi,
  X,
} from 'lucide-react';
import { useT } from '../i18n';
import type { TranslationKey } from '../i18n/translations';
import { formatEUR } from '../utils';
import { PairingCode } from './QrCanvas';
import { QrScanner } from './QrScanner';
import type { SyncSession, PeerStatus } from '../sync/webrtc';
import type { OrderSnapshot } from '../sync/orderSnapshot';

type Props = {
  session: SyncSession | null;
  status: PeerStatus;
  /** Letzter empfangener Snapshot — vom Hook verwaltet. */
  snapshot: OrderSnapshot | null;
  onExitDisplayMode: () => void;
  deviceName: string;
};

/**
 * Vollbild-Kundendisplay: zeigt die aktuelle Bestellung des gepairten Kassen-Geräts.
 *
 * Zwei Zustände:
 *   - Pairing: noch nicht verbunden, zeigt Pairing-Flow (QR-Scan → Antwort-QR)
 *   - Display: verbunden, zeigt Bestellung in großer customer-readable Schrift
 *
 * Der Exit-Button verlangt zwei Tipps, damit Kundschaft nicht versehentlich
 * aus dem Display-Modus aussteigt.
 */
export function CustomerDisplay({
  session,
  status,
  snapshot,
  onExitDisplayMode,
  deviceName,
}: Props) {
  const t = useT();
  const [scanOpen, setScanOpen] = useState(false);
  const [confirmExit, setConfirmExit] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Fullscreen-State trackt Browser-Events (z.B. ESC-Taste, F11) — sodass
  // unser Toggle-Icon immer den richtigen Zustand anzeigt.
  useEffect(() => {
    const handler = () => {
      const fsEl =
        document.fullscreenElement ||
        (document as Document & { webkitFullscreenElement?: Element })
          .webkitFullscreenElement ||
        null;
      setIsFullscreen(!!fsEl);
    };
    document.addEventListener('fullscreenchange', handler);
    document.addEventListener('webkitfullscreenchange', handler);
    return () => {
      document.removeEventListener('fullscreenchange', handler);
      document.removeEventListener('webkitfullscreenchange', handler);
    };
  }, []);

  const toggleFullscreen = async () => {
    type ElWithFs = HTMLElement & {
      webkitRequestFullscreen?: () => Promise<void>;
    };
    type DocWithFs = Document & {
      webkitExitFullscreen?: () => Promise<void>;
      webkitFullscreenElement?: Element | null;
    };
    const doc = document as DocWithFs;
    const fsEl = doc.fullscreenElement || doc.webkitFullscreenElement || null;
    try {
      if (fsEl) {
        if (doc.exitFullscreen) await doc.exitFullscreen();
        else if (doc.webkitExitFullscreen) await doc.webkitExitFullscreen();
      } else {
        const elem = document.documentElement as ElWithFs;
        if (elem.requestFullscreen) await elem.requestFullscreen();
        else if (elem.webkitRequestFullscreen)
          await elem.webkitRequestFullscreen();
      }
    } catch {
      /* Vollbild nicht verfügbar, z. B. auf dem iPhone: Die App läuft dann normal. */
    }
  };

  const handleScan = (raw: string) => {
    setScanOpen(false);
    void session?.handleCode(raw, true);
  };

  const handleExit = () => {
    if (confirmExit) {
      session?.disconnect();
      onExitDisplayMode();
      setConfirmExit(false);
    } else {
      setConfirmExit(true);
      window.setTimeout(() => setConfirmExit(false), 3000);
    }
  };

  const isConnected = status.state === 'connected';
  const unstable = status.peers.some((p) => p.unstable);
  const cashier = status.peers[0]?.remoteDeviceName ?? snapshot?.cashierName;

  return (
    <div className="flex h-full flex-col bg-canvas pl-safe pr-safe pt-safe-2 pb-safe-2 text-ink">
      <header className="flex items-center gap-3 border-b border-line px-3 pb-2">
        <Monitor className="h-5 w-5 shrink-0 text-ink-mute" aria-label={t('display.title')} />
        <div
          className={`flex min-w-0 items-center gap-2 text-sm font-medium ${
            !isConnected ? 'text-ink-mute' : unstable ? 'text-accent-ink' : 'text-positive-ink'
          }`}
        >
          {isConnected ? (
            <Wifi className="h-4 w-4 shrink-0" aria-hidden="true" />
          ) : (
            <WifiOff className="h-4 w-4 shrink-0" aria-hidden="true" />
          )}
          <span className="truncate">
            {isConnected
              ? unstable
                ? t('sync.chipUnstable')
                : cashier ?? t('display.connected')
              : t('display.waiting')}
          </span>
        </div>
        <div className="ml-auto flex items-center gap-1">
          <span className="hidden text-sm text-ink-mute sm:inline">{deviceName}</span>
          <button
            onClick={toggleFullscreen}
            className="tap flex items-center justify-center rounded-xl text-ink-soft active:bg-raised"
            aria-label={isFullscreen ? t('display.exitFullscreen') : t('display.enterFullscreen')}
          >
            {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
          </button>
          <button
            onClick={handleExit}
            className={`tap flex items-center gap-1.5 rounded-xl px-2.5 text-sm font-semibold transition-colors ${
              confirmExit ? 'bg-negative text-on-solid' : 'text-ink-soft active:bg-raised'
            }`}
          >
            <ArrowLeftFromLine className="h-5 w-5" aria-hidden="true" />
            {confirmExit ? t('display.exitConfirm') : t('display.exit')}
          </button>
        </div>
      </header>

      <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {!isConnected ? (
          <PairingView
            status={status}
            onStartScan={() => setScanOpen(true)}
            onCancel={() => session?.cancelPairing()}
            onDismissLastSession={() => session?.dismissLostPeers()}
            onClearError={() => session?.clearError()}
          />
        ) : (
          <OrderView snapshot={snapshot} />
        )}
      </main>

      <QrScanner
        open={scanOpen}
        onClose={() => setScanOpen(false)}
        onResult={handleScan}
        title={t('display.scanCashier')}
      />
    </div>
  );
}

/* ============== Pairing View ============== */

function PairingView({
  status,
  onStartScan,
  onCancel,
  onDismissLastSession,
  onClearError,
}: {
  status: PeerStatus;
  onStartScan: () => void;
  onCancel: () => void;
  onDismissLastSession: () => void;
  onClearError: () => void;
}) {
  const t = useT();
  const pairing = status.pairing;
  const reconnectName =
    status.reconnect?.role === 'display'
      ? status.reconnect.remotePeers[0]?.deviceName
      : null;

  if (pairing?.phase === 'show-answer') {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 overflow-y-auto p-4 text-center">
        <div>
          <h1 className="text-xl font-semibold text-ink">{t('display.showAnswer')}</h1>
          <p className="mx-auto mt-1 max-w-md text-sm text-ink-mute">
            {t('display.showAnswerHint')}
          </p>
        </div>
        <div className="flex w-full max-w-sm flex-col gap-2">
          <PairingCode code={pairing.code} />
        </div>
        <button
          onClick={onCancel}
          className="tap flex items-center gap-2 rounded-xl bg-raised px-4 font-semibold text-ink active:bg-pressed"
        >
          <X className="h-5 w-5" aria-hidden="true" />
          {t('display.cancelPairing')}
        </button>
      </div>
    );
  }

  if (pairing) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center" role="status">
        <Loader2 className="h-8 w-8 animate-spin text-accent-ink" aria-hidden="true" />
        <p className="text-base text-ink-soft">
          {pairing.phase === 'connecting' ? t('sync.connecting') : t('sync.preparing')}
        </p>
        <button
          onClick={onCancel}
          className="tap flex items-center gap-2 rounded-xl bg-raised px-4 font-semibold text-ink active:bg-pressed"
        >
          <X className="h-5 w-5" aria-hidden="true" />
          {t('display.cancelPairing')}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5 overflow-y-auto p-6 text-center">
      <Monitor className="h-12 w-12 text-ink-mute" aria-hidden="true" />
      <div>
        <h1 className="text-2xl font-semibold text-ink">{t('display.title')}</h1>
        <p className="mx-auto mt-1 max-w-md text-sm text-ink-mute">
          {reconnectName
            ? t('display.reconnectBody').replace('{name}', reconnectName)
            : t('display.intro')}
        </p>
      </div>
      {status.error && (
        <button
          onClick={onClearError}
          className="flex max-w-md items-start gap-2 rounded-2xl bg-negative-soft p-3 text-left text-sm text-ink"
          role="alert"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-negative-ink" aria-hidden="true" />
          <span>{t(`sync.err.${status.error}` as TranslationKey)}</span>
        </button>
      )}
      <button
        onClick={onStartScan}
        className="flex min-h-[3.25rem] items-center gap-2 rounded-xl bg-accent px-6 text-lg font-bold text-on-accent active:bg-accent-press"
      >
        {reconnectName ? (
          <RefreshCw className="h-6 w-6" aria-hidden="true" />
        ) : (
          <ScanLine className="h-6 w-6" aria-hidden="true" />
        )}
        {reconnectName
          ? t('display.reconnectCta').replace('{name}', reconnectName)
          : t('display.scanCashier')}
      </button>
      {reconnectName && (
        <button
          onClick={onDismissLastSession}
          className="tap rounded-lg px-3 text-sm font-medium text-ink-mute active:bg-raised"
        >
          {t('display.reconnectDismiss')}
        </button>
      )}
    </div>
  );
}

/* ============== Order View (Verbunden) ============== */

function OrderView({ snapshot }: { snapshot: OrderSnapshot | null }) {
  const t = useT();

  // Noch kein Snapshot empfangen — Verbindung gerade aufgebaut, gleich kommt was.
  if (!snapshot || (snapshot.items.length === 0 && snapshot.returns.length === 0)) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-ink sm:text-6xl">
          {t('display.welcome')}
        </h1>
        <p className="max-w-md text-lg text-ink-mute sm:text-2xl">
          {t('display.welcomeHint')}
        </p>
      </div>
    );
  }

  const hasTip = snapshot.tipCents > 0;
  const hasCash =
    snapshot.cashGivenCents !== null && snapshot.changeCents !== null;
  const exact = hasCash && snapshot.changeCents === 0;
  const insufficient = hasCash && (snapshot.changeCents ?? 0) < 0;
  const payout = snapshot.totalCents < 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto px-3 py-3 sm:px-5">
        <ul className="flex flex-col gap-1.5">
          {snapshot.items.map((item, idx) => (
            <li
              key={`${item.drinkLabel}-${item.drinkSize}-${idx}`}
              className="flex items-baseline gap-2 rounded-2xl bg-surface px-3 py-2"
            >
              <span className="w-12 shrink-0 text-right text-2xl font-bold tabular-nums text-ink">
                {item.qty}×
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="truncate text-xl font-semibold text-ink">
                    {item.drinkLabel}
                  </span>
                  {item.drinkSize && (
                    <span className="text-sm text-ink-mute">{item.drinkSize}</span>
                  )}
                  {item.onHappyHour && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-promo-soft px-2 py-0.5 text-xs font-semibold text-promo-ink">
                      <Sparkles className="h-3 w-3" aria-hidden="true" /> Happy Hour
                    </span>
                  )}
                </div>
                {item.pfandLabel && (
                  <div className="text-sm text-ink-mute">
                    + {item.pfandLabel}{' '}
                    <span className="tabular-nums">{formatEUR(item.pfandAmountCents)}</span>
                  </div>
                )}
              </div>
              <div className="flex flex-col items-end">
                <span className="text-xl font-bold tabular-nums text-ink">
                  {formatEUR((item.unitPriceCents + item.pfandAmountCents) * item.qty)}
                </span>
                {item.onHappyHour &&
                  item.regularUnitPriceCents !== item.unitPriceCents && (
                    <span className="text-sm tabular-nums text-ink-mute line-through">
                      {formatEUR(
                        (item.regularUnitPriceCents + item.pfandAmountCents) * item.qty,
                      )}
                    </span>
                  )}
              </div>
            </li>
          ))}
          {snapshot.returns.map((ret, idx) => (
            <li
              key={`ret-${idx}`}
              className="flex items-baseline gap-2 rounded-2xl bg-negative-soft px-3 py-2"
            >
              <span className="w-12 shrink-0 text-right text-2xl font-bold tabular-nums text-negative-ink">
                −{ret.qty}×
              </span>
              <div className="min-w-0 flex-1 text-lg font-semibold text-negative-ink">
                {ret.pfandLabel} {t('pfand.return')}
              </div>
              <span className="text-xl font-bold tabular-nums text-negative-ink">
                −{formatEUR(ret.pfandAmountCents * ret.qty)}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Die Summe ist das, was Kundschaft aus der Entfernung lesen will. */}
      <div className="shrink-0 border-t border-line px-4 py-3 sm:px-6 sm:py-4">
        {hasTip && (
          <div className="mb-1 flex items-baseline justify-between text-promo-ink">
            <span className="text-base font-medium">{t('tip.label')}</span>
            <span className="text-xl font-semibold tabular-nums">
              +{formatEUR(snapshot.tipCents)}
            </span>
          </div>
        )}
        <div className="flex items-baseline justify-between gap-4">
          <span className="text-lg font-semibold text-ink-soft sm:text-2xl">
            {payout ? t('sale.payout') : t('totalbar.total')}
          </span>
          <span
            className={`text-5xl font-bold tabular-nums sm:text-7xl ${
              payout ? 'text-negative-ink' : 'text-ink'
            }`}
          >
            {formatEUR(snapshot.totalCents)}
          </span>
        </div>
        {hasCash && (
          <div className="mt-3 grid grid-cols-2 gap-3 border-t border-line pt-3">
            <div className="flex flex-col">
              <span className="text-sm text-ink-mute sm:text-base">{t('totalbar.given')}</span>
              <span className="text-2xl font-bold tabular-nums text-ink sm:text-4xl">
                {formatEUR(snapshot.cashGivenCents!)}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm text-ink-mute sm:text-base">
                {exact
                  ? t('totalbar.exact')
                  : insufficient
                    ? t('totalbar.missing')
                    : t('totalbar.change')}
              </span>
              <span
                className={`text-2xl font-bold tabular-nums sm:text-4xl ${
                  insufficient ? 'text-negative-ink' : 'text-positive-ink'
                }`}
              >
                {exact ? '✓' : formatEUR(Math.abs(snapshot.changeCents!))}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
