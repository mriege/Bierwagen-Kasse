import { useEffect, useState } from 'react';
import {
  AlertCircle,
  Camera,
  Check,
  HelpCircle,
  Loader2,
  Monitor,
  RadioTower,
  ScanLine,
  Smartphone,
  Stethoscope,
  UserMinus,
  WifiOff,
  X,
} from 'lucide-react';
import { PairingGuide } from './PairingGuide';
import { useSinceLabel } from './SyncIndicators';
import { useT } from '../i18n';
import type { TranslationKey } from '../i18n/translations';
import { PairingCode } from './QrCanvas';
import { QrScanner } from './QrScanner';
import {
  SyncSession,
  type PairingState,
  type PeerInfo,
  type PeerStatus,
} from '../sync/webrtc';

type Props = {
  /** Wenn null = noch nicht ready (Yjs lädt, IndexedDB hydriert). */
  session: SyncSession | null;
  status: PeerStatus;
  /** Aktueller Gerätename (lokal, wird in Bilanz + Pairing gezeigt). */
  deviceName: string;
  /** Setter — speichert in localStorage und triggert Handshake-Re-Send. */
  onDeviceNameChange: (name: string) => void;
  /** Setzt das Gerät in den Kundendisplay-Modus (Vollbild-Order-Anzeige). */
  onEnterDisplayMode: () => void;
};

const CARD = 'flex flex-col gap-3 rounded-2xl bg-surface p-4';
const BUTTON_PRIMARY =
  'tap flex items-center justify-center gap-2 rounded-xl bg-accent px-4 font-bold text-on-accent active:bg-accent-press disabled:bg-raised disabled:text-ink-mute';
const BUTTON_SECONDARY =
  'tap flex items-center justify-center gap-2 rounded-xl bg-raised px-4 font-semibold text-ink active:bg-pressed disabled:text-ink-mute';

/**
 * Geräte koppeln. Der Ablauf steckt in der SyncSession, damit ein Tab-Wechsel
 * mitten im Koppeln nichts verliert. Hier wird nur der jeweilige Schritt gezeigt.
 */
export function SyncPanel({
  session,
  status,
  deviceName,
  onDeviceNameChange,
  onEnterDisplayMode,
}: Props) {
  const t = useT();
  const [scanTitle, setScanTitle] = useState<TranslationKey | null>(null);
  const [guideOpen, setGuideOpen] = useState(false);
  const [draftName, setDraftName] = useState(deviceName);
  // Synchronisiere draftName, wenn die Settings extern geändert werden.
  useEffect(() => {
    setDraftName(deviceName);
  }, [deviceName]);

  if (!session) {
    return <div className={`${CARD} text-sm text-ink-mute`}>{t('sync.notReady')}</div>;
  }

  const commitName = () => {
    const trimmed = draftName.trim();
    if (trimmed.length === 0) {
      setDraftName(deviceName);
      return;
    }
    if (trimmed !== deviceName) onDeviceNameChange(trimmed);
  };

  const handleScan = (raw: string) => {
    setScanTitle(null);
    void session.handleCode(raw);
  };

  const syncPeers = status.peers.filter((p) => p.channel === 'sync');
  const displayPeers = status.peers.filter((p) => p.channel === 'display');
  const pairing = status.pairing;
  const reconnect = status.reconnect;
  const missingSync = reconnect?.remotePeers.filter((p) => p.channel === 'sync') ?? [];
  const missingDisplay = reconnect?.remotePeers.filter((p) => p.channel === 'display') ?? [];
  const isJoiner = status.role === 'joiner';
  const isMaster = status.role === 'master';
  const canStartSync = !pairing && !isJoiner;
  const canJoin = !pairing && !isMaster && !isJoiner;

  return (
    <div className="flex flex-col gap-3">
      {/* Beim Koppeln zählt nur der Code: Er steht dann ganz oben. */}
      {!pairing && (
      <section className={CARD}>
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-semibold text-ink">{t('sync.title')}</h2>
            <p className="mt-0.5 text-sm text-ink-mute">{t('sync.intro')}</p>
          </div>
          <button
            onClick={() => setGuideOpen(true)}
            className="tap flex shrink-0 items-center justify-center rounded-xl text-accent-ink active:bg-raised"
            aria-label={t('sync.openGuide')}
          >
            <HelpCircle className="h-6 w-6" />
          </button>
        </div>
        <label className="flex flex-col gap-1.5 text-sm font-medium text-ink-soft">
          {t('sync.deviceNameLabel')}
          <input
            type="text"
            value={draftName}
            maxLength={32}
            onChange={(e) => setDraftName(e.target.value)}
            onBlur={commitName}
            onKeyDown={(e) => {
              if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
            }}
            placeholder={t('sync.deviceNamePlaceholder')}
            className="tap rounded-xl bg-raised px-3 text-base font-semibold text-ink placeholder-ink-mute focus:outline-none focus:ring-2 focus:ring-accent-line"
          />
          <span className="text-xs font-normal text-ink-mute">{t('sync.deviceNameHint')}</span>
        </label>
      </section>
      )}

      {status.error && (
        <div
          className="flex items-start gap-2 rounded-2xl bg-negative-soft p-3 text-sm text-ink"
          role="alert"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-negative-ink" aria-hidden="true" />
          <span className="min-w-0 flex-1">{t(`sync.err.${status.error}` as TranslationKey)}</span>
          <button
            onClick={() => session.clearError()}
            className="tap -m-2 flex shrink-0 items-center justify-center text-ink-soft"
            aria-label={t('modal.close')}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      {pairing && (
        <PairingCard
          pairing={pairing}
          onScanAnswer={() => setScanTitle('sync.scanAnswer')}
          onCancel={() => session.cancelPairing()}
        />
      )}

      {/* Verlorene Verbindungen: bleibt sichtbar, bis neu gekoppelt oder verworfen. */}
      {reconnect && !pairing && (
        <ReconnectCard
          role={reconnect.role}
          lastConnectedAt={reconnect.lastConnectedAt}
          missingSync={missingSync.map((p) => p.deviceName)}
          missingDisplay={missingDisplay.map((p) => p.deviceName)}
          onShowCode={() => void session.startPairing('sync')}
          onShowDisplayCode={() => void session.startPairing('display')}
          onScan={() => setScanTitle('sync.scanOffer')}
          onDismiss={() => session.dismissLostPeers()}
        />
      )}

      {/* Bestehende Verbindungen */}
      {syncPeers.length > 0 && (
        <section className={CARD} aria-label={t('sync.connected')}>
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold text-positive-ink">{t('sync.connected')}</h3>
            <span className="text-sm text-ink-mute">
              {isMaster ? t('sync.role.master') : t('sync.role.joiner')}
            </span>
          </div>
          <div className="flex flex-col gap-1.5">
            {syncPeers.map((peer, idx) => (
              <PeerRow
                key={peer.id}
                index={idx + 1}
                peer={peer}
                onKick={() => session.kickPeer(peer.id)}
              />
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {isMaster && !pairing && (
              <button
                onClick={() => void session.startPairing('sync')}
                className={`${BUTTON_SECONDARY} flex-1`}
              >
                <RadioTower className="h-5 w-5" aria-hidden="true" />
                {t('sync.addDevice')}
              </button>
            )}
            <DisconnectButton onConfirm={() => session.disconnect()} />
          </div>
        </section>
      )}

      {/* Erste Kopplung */}
      {syncPeers.length === 0 && !pairing && (canStartSync || canJoin) && (
        <section className={CARD}>
          {status.state !== 'connected' && !reconnect && (
            <div className="flex items-center gap-2 text-sm text-ink-mute">
              <WifiOff className="h-4 w-4" aria-hidden="true" />
              {t('sync.idle')}
            </div>
          )}
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="flex flex-1 flex-col gap-1.5">
              <button
                onClick={() => void session.startPairing('sync')}
                className={BUTTON_PRIMARY}
              >
                <RadioTower className="h-5 w-5" aria-hidden="true" />
                {t('sync.startMaster')}
              </button>
              <p className="text-xs text-ink-mute">{t('sync.startMasterHint')}</p>
            </div>
            {canJoin && (
              <div className="flex flex-1 flex-col gap-1.5">
                <button
                  onClick={() => setScanTitle('sync.scanOffer')}
                  className={BUTTON_SECONDARY}
                >
                  <ScanLine className="h-5 w-5" aria-hidden="true" />
                  {t('sync.joinAsClient')}
                </button>
                <p className="text-xs text-ink-mute">{t('sync.joinHint')}</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Kundendisplay */}
      <section className={CARD} aria-label={t('sync.displaySection')}>
        <div>
          <h3 className="font-semibold text-ink">{t('sync.displaySection')}</h3>
          <p className="mt-0.5 text-sm text-ink-mute">{t('sync.displaySectionHint')}</p>
        </div>
        {displayPeers.length > 0 && (
          <div className="flex flex-col gap-1.5">
            {displayPeers.map((peer, idx) => (
              <PeerRow
                key={peer.id}
                index={idx + 1}
                peer={peer}
                onKick={() => session.kickPeer(peer.id)}
              />
            ))}
          </div>
        )}
        {!pairing && (
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              onClick={() => void session.startPairing('display')}
              className={`${BUTTON_SECONDARY} flex-1`}
            >
              <Monitor className="h-5 w-5" aria-hidden="true" />
              {displayPeers.length > 0 ? t('sync.pairAnotherDisplay') : t('sync.pairDisplay')}
            </button>
            {status.state !== 'connected' && (
              <button onClick={onEnterDisplayMode} className={`${BUTTON_SECONDARY} flex-1`}>
                <Monitor className="h-5 w-5" aria-hidden="true" />
                {t('sync.becomeDisplay')}
              </button>
            )}
          </div>
        )}
        {syncPeers.length === 0 && displayPeers.length > 0 && (
          <DisconnectButton onConfirm={() => session.disconnect()} />
        )}
      </section>

      <section className="rounded-2xl bg-surface p-4 text-sm leading-relaxed text-ink-mute">
        <p>{t('sync.connectingHint')}</p>
        <p className="mt-1">{t('sync.privacyHint')}</p>
        <DiagnosticsButton session={session} />
      </section>

      <QrScanner
        open={scanTitle !== null}
        onClose={() => setScanTitle(null)}
        onResult={handleScan}
        title={scanTitle ? t(scanTitle) : ''}
      />
      <PairingGuide open={guideOpen} onClose={() => setGuideOpen(false)} />
    </div>
  );
}

function DiagnosticsButton({ session }: { session: SyncSession }) {
  const t = useT();
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(await session.getDiagnostics());
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };
  return (
    <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
      <button
        onClick={copy}
        className="tap -ml-2 flex items-center gap-2 rounded-lg px-2 font-medium text-ink-soft active:bg-raised"
      >
        {copied ? (
          <Check className="h-4 w-4 text-positive-ink" aria-hidden="true" />
        ) : (
          <Stethoscope className="h-4 w-4" aria-hidden="true" />
        )}
        {copied ? t('sync.diagnosticsCopied') : t('sync.diagnostics')}
      </button>
      <span className="tabular-nums">
        {t('settings.version')} {__APP_VERSION__}
      </span>
    </div>
  );
}

/** Zwei Schritte statt Alert: erster Tipp schärft, zweiter trennt. */
function useArmed(onConfirm: () => void): { armed: boolean; press: () => void } {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!armed) return;
    const id = window.setTimeout(() => setArmed(false), 3000);
    return () => window.clearTimeout(id);
  }, [armed]);
  return {
    armed,
    press: () => {
      if (armed) {
        setArmed(false);
        onConfirm();
      } else {
        setArmed(true);
      }
    },
  };
}

function DisconnectButton({ onConfirm }: { onConfirm: () => void }) {
  const t = useT();
  const { armed, press } = useArmed(onConfirm);
  return (
    <button
      onClick={press}
      className={`tap flex flex-1 items-center justify-center gap-2 rounded-xl px-4 font-semibold transition-colors ${
        armed ? 'bg-negative text-on-solid' : 'bg-raised text-negative-ink active:bg-pressed'
      }`}
    >
      <WifiOff className="h-5 w-5" aria-hidden="true" />
      {armed ? t('sync.kickConfirm') : t('sync.disconnect')}
    </button>
  );
}

function ReconnectCard({
  role,
  lastConnectedAt,
  missingSync,
  missingDisplay,
  onShowCode,
  onShowDisplayCode,
  onScan,
  onDismiss,
}: {
  role: string;
  lastConnectedAt: number;
  missingSync: string[];
  missingDisplay: string[];
  onShowCode: () => void;
  onShowDisplayCode: () => void;
  onScan: () => void;
  onDismiss: () => void;
}) {
  const t = useT();
  const since = useSinceLabel();
  const syncNames = missingSync.join(', ');
  const displayNames = missingDisplay.join(', ');
  return (
    <section className="flex flex-col gap-3 rounded-2xl bg-negative-soft p-4">
      <div>
        <h3 className="font-semibold text-ink">{t('sync.reconnectTitle')}</h3>
        <p className="mt-0.5 text-sm text-ink-soft">
          {missingSync.length > 0 &&
            (role === 'joiner'
              ? t('sync.reconnectJoinerBody').replace('{name}', syncNames)
              : t('sync.reconnectMasterBody').replace('{names}', syncNames))}{' '}
          {missingDisplay.length > 0 &&
            t('sync.reconnectDisplayBody').replace('{name}', displayNames)}{' '}
          {since(lastConnectedAt)}.
        </p>
        <p className="mt-1 text-sm text-ink-soft">{t('sync.reconnectSafe')}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {missingSync.length > 0 && role === 'joiner' && (
          <button onClick={onScan} className={`${BUTTON_PRIMARY} flex-1`}>
            <Camera className="h-5 w-5" aria-hidden="true" />
            {t('sync.reconnectScanCta')}
          </button>
        )}
        {missingSync.length > 0 && role !== 'joiner' && (
          <button onClick={onShowCode} className={`${BUTTON_PRIMARY} flex-1`}>
            <RadioTower className="h-5 w-5" aria-hidden="true" />
            {t('sync.reconnectShowCta')}
          </button>
        )}
        {missingDisplay.length > 0 && (
          <button onClick={onShowDisplayCode} className={`${BUTTON_SECONDARY} flex-1`}>
            <Monitor className="h-5 w-5" aria-hidden="true" />
            {t('sync.pairDisplay')}
          </button>
        )}
      </div>
      <button
        onClick={onDismiss}
        className="tap self-start rounded-lg px-2 text-sm font-medium text-ink-soft active:bg-raised"
      >
        {t('sync.reconnectDismiss')}
      </button>
    </section>
  );
}

function PeerRow({
  index,
  peer,
  onKick,
}: {
  index: number;
  peer: PeerInfo;
  onKick: () => void;
}) {
  const t = useT();
  const { armed, press } = useArmed(onKick);
  const clock = new Intl.DateTimeFormat('de-DE', {
    hour: '2-digit',
    minute: '2-digit',
  });
  // Vor dem Handshake (erste Sekunden) ist der Name noch nicht bekannt.
  const name = peer.remoteDeviceName?.trim() || `${t('sync.peerLabel')} ${index}`;
  const Icon = peer.channel === 'display' ? Monitor : Smartphone;
  const otherVersion =
    peer.remoteAppVersion && peer.remoteAppVersion !== __APP_VERSION__
      ? peer.remoteAppVersion
      : null;

  return (
    <div className="flex items-center gap-2 rounded-xl bg-canvas p-2">
      <Icon className="ml-1 h-5 w-5 shrink-0 text-ink-mute" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <div className="truncate font-semibold text-ink">{name}</div>
        <div
          className={`truncate text-xs ${peer.unstable ? 'text-accent-ink' : 'text-ink-mute'}`}
        >
          {peer.unstable ? (
            <span className="inline-flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin [animation-duration:2s]" aria-hidden="true" />
              {t('sync.peerUnstable')}
            </span>
          ) : peer.channel === 'sync' && peer.lastSyncedAt ? (
            t('sync.peerSynced').replace('{time}', clock.format(new Date(peer.lastSyncedAt)))
          ) : peer.connectedAt > 0 ? (
            `${t('sync.peerSince')} ${clock.format(new Date(peer.connectedAt))}`
          ) : null}
        </div>
        {otherVersion && (
          <div className="truncate text-xs text-accent-ink">
            {t('sync.peerVersion').replace('{version}', otherVersion)}
          </div>
        )}
      </div>
      <button
        onClick={press}
        className={`tap flex shrink-0 items-center justify-center gap-1 rounded-lg px-2 text-sm font-medium transition-colors ${
          armed ? 'bg-negative text-on-solid' : 'text-negative-ink active:bg-raised'
        }`}
        aria-label={`${name}: ${t('sync.kickPeer')}`}
      >
        <UserMinus className="h-4 w-4" aria-hidden="true" />
        {armed ? t('sync.kickConfirm') : t('sync.kickPeer')}
      </button>
    </div>
  );
}

/** Eine Karte für jeden Schritt, damit klar ist, was als Nächstes zu tun ist. */
function PairingCard({
  pairing,
  onScanAnswer,
  onCancel,
}: {
  pairing: PairingState;
  onScanAnswer: () => void;
  onCancel: () => void;
}) {
  const t = useT();
  const isDisplay = pairing.mode === 'display';

  const cancelButton = (
    <button onClick={onCancel} className={`${BUTTON_SECONDARY} flex-1`}>
      <X className="h-5 w-5" aria-hidden="true" /> {t('sync.cancelPairing')}
    </button>
  );

  if (pairing.phase === 'preparing' || pairing.phase === 'connecting') {
    return (
      <section className={CARD} role="status">
        <div className="flex items-center gap-3 text-ink">
          <Loader2 className="h-6 w-6 shrink-0 animate-spin text-accent-ink" aria-hidden="true" />
          <div>
            <div className="font-semibold">
              {pairing.phase === 'preparing' ? t('sync.preparing') : t('sync.connecting')}
            </div>
            {pairing.phase === 'connecting' && (
              <div className="text-sm text-ink-mute">{t('sync.connectingBody')}</div>
            )}
          </div>
        </div>
        {cancelButton}
      </section>
    );
  }

  const isOffer = pairing.phase === 'show-offer';
  return (
    <section className={CARD}>
      <div>
        <h3 className="font-semibold text-ink">
          {isOffer
            ? isDisplay
              ? t('sync.showDisplayOfferQr')
              : t('sync.showOfferQr')
            : t('sync.showAnswerQr')}
        </h3>
        <p className="mt-0.5 text-sm text-ink-soft">
          {isOffer
            ? isDisplay
              ? t('sync.displayScanInstruction')
              : t('sync.scanInstruction')
            : t('sync.answerInstruction')}
        </p>
      </div>
      <PairingCode code={pairing.code} />
      <div className="flex flex-wrap gap-2">
        {isOffer && (
          <button onClick={onScanAnswer} className={`${BUTTON_PRIMARY} flex-1`}>
            <Camera className="h-5 w-5" aria-hidden="true" /> {t('sync.scanAnswer')}
          </button>
        )}
        {cancelButton}
      </div>
    </section>
  );
}
