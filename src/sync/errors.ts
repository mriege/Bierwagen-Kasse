/**
 * Fehlercodes der Sync-Schicht. Die UI übersetzt sie über `sync.err.<code>`,
 * deshalb enthält die Sync-Schicht selbst keine Klartexte.
 */
export type SyncErrorCode =
  | 'qr-invalid'
  | 'qr-outdated'
  | 'qr-newer'
  | 'qr-expected-offer'
  | 'qr-expected-answer'
  | 'qr-wrong-mode'
  | 'session-mismatch'
  | 'no-pairing'
  | 'role-conflict'
  | 'webrtc-unavailable'
  | 'no-candidates'
  | 'connect-timeout'
  | 'connect-failed'
  | 'unknown';

export class SyncError extends Error {
  readonly code: SyncErrorCode;
  constructor(code: SyncErrorCode, message?: string) {
    super(message ?? code);
    this.code = code;
    this.name = 'SyncError';
  }
}

export const toSyncErrorCode = (e: unknown): SyncErrorCode =>
  e instanceof SyncError ? e.code : 'unknown';
