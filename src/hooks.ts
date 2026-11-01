import { useEffect, useState } from 'react';
import { currentMinutes } from './utils';

export function useNowMinutes(): number {
  const [now, setNow] = useState<number>(() => currentMinutes());
  useEffect(() => {
    const tick = () => setNow(currentMinutes());
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, []);
  return now;
}

/** Entspricht dem Tailwind-Screen `regular`. */
export const REGULAR_LAYOUT_QUERY =
  '(min-width: 1024px), (min-width: 600px) and (max-height: 520px)';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const list = window.matchMedia(query);
    const onChange = () => setMatches(list.matches);
    onChange();
    list.addEventListener('change', onChange);
    return () => list.removeEventListener('change', onChange);
  }, [query]);
  return matches;
}

/**
 * Hält den Bildschirm an, solange die App sichtbar ist. Sperrt sich das Gerät,
 * friert der Browser die Seite ein und die Sync-Verbindung reißt ab. Ohne
 * Signaling-Server kostet das einen neuen QR-Tausch. Browser ohne Wake-Lock
 * (oder im Energiesparmodus) verhalten sich einfach wie bisher.
 */
export function useWakeLock(enabled: boolean): void {
  useEffect(() => {
    if (!enabled || !('wakeLock' in navigator)) return;
    let sentinel: WakeLockSentinel | null = null;
    let disposed = false;

    const acquire = async () => {
      if (document.visibilityState !== 'visible' || sentinel) return;
      try {
        const lock = await navigator.wakeLock.request('screen');
        if (disposed) {
          void lock.release();
          return;
        }
        sentinel = lock;
        lock.addEventListener('release', () => {
          sentinel = null;
        });
      } catch {
        /* z. B. Energiesparmodus — dann eben ohne */
      }
    };

    void acquire();
    document.addEventListener('visibilitychange', acquire);
    return () => {
      disposed = true;
      document.removeEventListener('visibilitychange', acquire);
      void sentinel?.release();
    };
  }, [enabled]);
}
