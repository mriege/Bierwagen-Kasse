/**
 * Persistenz der letzten Sync-Session, damit nach App-Reload der Reconnect-Flow
 * verkürzt werden kann (statt vollständigem QR-Tanz: ein Klick).
 *
 * Speicher-Format ist mit `version` versehen, damit künftige Schema-Änderungen
 * sauber migriert werden können.
 */

/** 'cashier' = Kasse ohne Sync-Partner, die nur ein Kundendisplay angebunden hat. */
export type LastSessionRole = 'master' | 'joiner' | 'display' | 'cashier';
export type LastSessionChannel = 'sync' | 'display';

export type LastSessionPeer = {
  deviceId: string;
  deviceName: string;
  channel: LastSessionChannel;
};

export type LastSession = {
  version: 1;
  /** Rolle dieses Geräts beim letzten Connect */
  role: LastSessionRole;
  /** Peers, mit denen wir verbunden waren — nur fürs UI ("Reconnect mit Theke?") */
  remotePeers: LastSessionPeer[];
  /** Wann wir zuletzt eine offene Verbindung hatten (Unix-ms) */
  lastConnectedAt: number;
};

const KEY = 'bierwagen-kasse:last-session:v1';

/** TTL: nach dieser Zeit ohne Reconnect wird die letzte Session vergessen. */
export const LAST_SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24h

const isAvailable = (): boolean => {
  try {
    return typeof window !== 'undefined' && !!window.localStorage;
  } catch {
    return false;
  }
};

export function loadLastSession(): LastSession | null {
  if (!isAvailable()) return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.version !== 1) return null;
    if (
      typeof parsed.role !== 'string' ||
      !['master', 'joiner', 'display', 'cashier'].includes(parsed.role)
    )
      return null;
    if (!Array.isArray(parsed.remotePeers)) return null;
    if (typeof parsed.lastConnectedAt !== 'number') return null;
    // TTL-Check: zu alte Sessions ignorieren
    if (Date.now() - parsed.lastConnectedAt > LAST_SESSION_TTL_MS) {
      return null;
    }
    return parsed as LastSession;
  } catch {
    return null;
  }
}

export function saveLastSession(session: LastSession): void {
  if (!isAvailable()) return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(session));
  } catch {
    /* quota o.ä. — ignorieren */
  }
}

export function clearLastSession(): void {
  if (!isAvailable()) return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* noop */
  }
}
