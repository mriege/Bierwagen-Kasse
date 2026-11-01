import { AlertTriangle, Loader2, Wifi, X } from 'lucide-react';
import type { PeerStatus } from '../sync/webrtc';
import type { LastSession } from '../sync/lastSession';
import { useT } from '../i18n';

export type SyncTone = 'none' | 'ok' | 'busy' | 'problem';

/** Eine Einschätzung für alle Anzeigen, damit Tab-Punkt und Chip nie widersprechen. */
export function syncTone(status: PeerStatus): SyncTone {
  if (status.reconnect || status.error) return 'problem';
  if (status.pairing || status.peers.some((p) => p.unstable)) return 'busy';
  if (status.state === 'connected') return 'ok';
  return 'none';
}

const peerNames = (session: LastSession): string =>
  session.remotePeers.map((p) => p.deviceName).join(', ');

/** „vor 3 Min." — grob genug, um ohne eigenen Takt zu stimmen. */
export function useSinceLabel(): (timestamp: number) => string {
  const t = useT();
  return (timestamp) => {
    const minutes = Math.round((Date.now() - timestamp) / 60_000);
    if (minutes < 1) return t('sync.reconnectJustNow');
    if (minutes < 60) return t('sync.sinceMinutes').replace('{n}', String(minutes));
    return t('sync.sinceHours').replace('{n}', String(Math.round(minutes / 60)));
  };
}

/** Kurzer Status oben. Ohne Sync zeigt er nichts: Wer ihn nicht nutzt, sieht ihn nicht. */
export function SyncChip({
  status,
  onClick,
}: {
  status: PeerStatus;
  onClick: () => void;
}) {
  const t = useT();
  const tone = syncTone(status);
  // Einen Verlust meldet das Banner direkt darunter, nicht doppelt.
  if (tone === 'none' || status.reconnect) return null;

  const count = status.peerCount;
  const text =
    tone === 'problem'
      ? t('sync.chipError')
      : status.pairing
        ? t('sync.chipPairing')
        : tone === 'busy'
          ? t('sync.chipUnstable')
          : t('sync.chipConnected').replace('{n}', String(count));

  const style =
    tone === 'problem'
      ? 'text-negative-ink'
      : tone === 'busy'
        ? 'text-accent-ink'
        : 'text-positive-ink';
  const Icon = tone === 'problem' ? AlertTriangle : tone === 'busy' ? Loader2 : Wifi;

  return (
    <button
      onClick={onClick}
      className={`tap flex min-w-0 items-center gap-1.5 rounded-lg px-2 text-sm font-medium active:bg-raised ${style}`}
    >
      <Icon
        className={`h-4 w-4 shrink-0 ${tone === 'busy' ? 'animate-spin [animation-duration:2s]' : ''}`}
        aria-hidden="true"
      />
      <span className="truncate">{text}</span>
    </button>
  );
}

/**
 * Bleibt sichtbar, bis neu gekoppelt oder bewusst verworfen wurde. Ohne das
 * verkauft eine Kasse womöglich stundenlang getrennt, ohne dass es jemand merkt.
 */
export function ConnectionBanner({
  status,
  onReconnect,
  onDismiss,
}: {
  status: PeerStatus;
  onReconnect: () => void;
  onDismiss: () => void;
}) {
  const t = useT();
  const session = status.reconnect;
  if (!session) return null;

  return (
    <div
      className="flex shrink-0 items-center gap-2 border-b border-line bg-negative-soft px-3 py-1.5"
      role="status"
    >
      <AlertTriangle className="h-5 w-5 shrink-0 text-negative-ink" aria-hidden="true" />
      <div className="min-w-0 flex-1 text-sm leading-snug">
        <div className="font-semibold text-ink">
          {t('sync.bannerTitle').replace('{names}', peerNames(session))}
        </div>
        <div className="text-ink-soft">{t('sync.bannerBody')}</div>
      </div>
      <button
        onClick={onReconnect}
        className="tap shrink-0 rounded-lg bg-accent px-3 text-sm font-bold text-on-accent active:bg-accent-press"
      >
        {t('sync.bannerAction')}
      </button>
      <button
        onClick={onDismiss}
        className="tap flex shrink-0 items-center justify-center rounded-lg text-ink-soft active:bg-raised"
        aria-label={t('sync.reconnectDismiss')}
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  );
}
