import * as Y from 'yjs';
import { IndexeddbPersistence } from 'y-indexeddb';

/** Origin-Tag für lokale (vom Reducer/State ausgelöste) Yjs-Transaktionen.
 *  Der Observer ignoriert Updates mit diesem Origin, um Echo-Loops zu verhindern. */
export const LOCAL_ORIGIN = Symbol('bk-local');
/** Origin-Tag für Updates, die über WebRTC von Peers reinkommen. */
export const REMOTE_ORIGIN = Symbol('bk-remote');

const DOC_NAME = 'bierwagen-kasse-doc-v1';
const PERSISTENCE_TIMEOUT_MS = 3000;

/** Sub-Map-Keys im Y.Doc. */
export const M_DRINKS = 'drinks';
export const M_PFAND = 'pfand';
export const M_BILANZ = 'bilanz';
export const M_SHARED = 'sharedSettings';

let docInstance: Y.Doc | null = null;
let persistenceInstance: IndexeddbPersistence | null = null;
let readyPromise: Promise<Y.Doc> | null = null;

const indexedDBAvailable = (): boolean => {
  try {
    return typeof indexedDB !== 'undefined';
  } catch {
    return false;
  }
};

/** Gibt das Singleton-YDoc zurück (lazy-initialisiert + IndexedDB-Persistenz). */
export function getYDoc(): Y.Doc {
  if (docInstance) return docInstance;
  docInstance = new Y.Doc();
  if (indexedDBAvailable()) {
    try {
      persistenceInstance = new IndexeddbPersistence(DOC_NAME, docInstance);
    } catch {
      persistenceInstance = null;
    }
  }
  return docInstance;
}

/** Resolved sobald die Yjs-Doc aus IndexedDB geladen ist (oder sofort, falls keine Persistence). */
export function whenYDocReady(): Promise<Y.Doc> {
  if (readyPromise) return readyPromise;
  const ydoc = getYDoc();
  // `whenSynced` löst nie auf, wenn IndexedDB blockiert ist. Die App darf daran
  // nicht hängen: Sie läuft dann vorerst im Speicher, ein spätes Laden wird
  // über die normalen Yjs-Observer nachgezogen.
  readyPromise = persistenceInstance
    ? Promise.race([
        persistenceInstance.whenSynced.then(() => ydoc),
        new Promise<Y.Doc>((resolve) =>
          window.setTimeout(() => resolve(ydoc), PERSISTENCE_TIMEOUT_MS),
        ),
      ])
    : Promise.resolve(ydoc);
  return readyPromise;
}

/** Löscht IndexedDB-Persistenz UND die Speicher-Doc — wird bei "Alles zurücksetzen" gerufen. */
export async function clearYDocStorage(): Promise<void> {
  if (persistenceInstance) {
    try {
      await persistenceInstance.clearData();
    } catch {
      /* ignore */
    }
  }
  destroyYDoc();
}

export function destroyYDoc(): void {
  if (persistenceInstance) {
    try {
      persistenceInstance.destroy();
    } catch {
      /* ignore */
    }
    persistenceInstance = null;
  }
  if (docInstance) {
    try {
      docInstance.destroy();
    } catch {
      /* ignore */
    }
    docInstance = null;
  }
  readyPromise = null;
}
