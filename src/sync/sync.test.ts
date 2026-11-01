import { describe, expect, it } from 'vitest';
import * as Y from 'yjs';
import { csvEscape, type BilanzEntry } from '../bilanz';
import type { Drink, PfandType, State } from '../types';
import { getInitialState } from '../defaults';
import { reducer } from '../reducer';
import {
  applyConfigChange,
  captureAuthoritative,
  readBilanzFromYjs,
  readDrinksFromYjs,
  readSharedSettingsFromYjs,
  restoreAuthoritative,
  seedYDoc,
  subscribeYjs,
  upsertBilanzEntries,
} from './bridge';
import { decodePairing, encodePairing, generateSessionId, minifySdp } from './qrPairing';
import { SyncError } from './errors';
import {
  CHUNK_PAYLOAD_BYTES,
  MSG_CHUNK,
  MSG_UPDATE,
  Reassembler,
  packMessage,
  splitMessage,
  unpackMessage,
} from './wire';

const shared = (over: Partial<{ tagesbilanz: boolean; cash: number }> = {}) => ({
  version: 1 as const,
  features: { trinkgeld: false, tagesbilanz: over.tagesbilanz ?? false, bestand: false },
  cashStartCents: over.cash ?? 0,
});

const entry = (id: string, timestamp = 1000): BilanzEntry => ({
  id,
  timestamp,
  items: [],
  returns: [],
  drinksSubtotalCents: 450,
  pfandOutCents: 100,
  pfandReturnCents: 0,
  tipCents: 0,
  totalCents: 550,
  paymentMethod: 'cash',
});

function device(
  clientID: number,
  config: { drinks: Drink[]; pfandTypes: PfandType[] },
  options: { bilanz?: BilanzEntry[]; tagesbilanz?: boolean } = {},
): Y.Doc {
  const doc = new Y.Doc();
  doc.clientID = clientID;
  seedYDoc(doc, {
    ...config,
    bilanz: options.bilanz ?? [],
    shared: shared({ tagesbilanz: options.tagesbilanz }),
  });
  return doc;
}

/** Ablauf wie in SyncSession: Master übernimmt Joiner-Daten, bestätigt sein Sortiment. */
function pair(master: Y.Doc, joiner: Y.Doc): void {
  const before = captureAuthoritative(master);
  Y.applyUpdate(master, Y.encodeStateAsUpdate(joiner, Y.encodeStateVector(master)));
  restoreAuthoritative(master, before);
  Y.applyUpdate(joiner, Y.encodeStateAsUpdate(master, Y.encodeStateVector(joiner)));
  Y.applyUpdate(master, Y.encodeStateAsUpdate(joiner, Y.encodeStateVector(master)));
}

const defaults = (): { drinks: Drink[]; pfandTypes: PfandType[] } => {
  const { drinks, pfandTypes } = getInitialState();
  return { drinks, pfandTypes };
};

describe('Master bleibt Quelle der Wahrheit beim Koppeln', () => {
  // Yjs entscheidet Konflikte nach Client-ID. Beide Reihenfolgen müssen stimmen.
  const clientIdOrders: Array<[string, number, number]> = [
    ['Master hat kleinere Client-ID', 100, 200],
    ['Master hat größere Client-ID', 200, 100],
  ];

  for (const [name, masterId, joinerId] of clientIdOrders) {
    describe(name, () => {
      const customized = () => {
        const base = defaults();
        return {
          pfandTypes: base.pfandTypes,
          drinks: base.drinks
            .filter((d) => d.id !== 'd-radler')
            .map((d) => (d.id === 'd-pils' ? { ...d, priceCents: 500 } : d)),
        };
      };

      it('behält geänderte Preise', () => {
        const master = device(masterId, customized());
        const joiner = device(joinerId, defaults());
        pair(master, joiner);
        for (const doc of [master, joiner]) {
          expect(readDrinksFromYjs(doc).find((d) => d.id === 'd-pils')?.priceCents).toBe(500);
        }
      });

      it('bringt gelöschte Getränke nicht zurück', () => {
        const master = device(masterId, customized());
        const joiner = device(joinerId, defaults());
        pair(master, joiner);
        for (const doc of [master, joiner]) {
          expect(readDrinksFromYjs(doc).some((d) => d.id === 'd-radler')).toBe(false);
        }
      });

      it('übernimmt die Reihenfolge des Masters auf allen Geräten', () => {
        const config = defaults();
        config.drinks.reverse();
        const master = device(masterId, config);
        const joiner = device(joinerId, defaults());
        pair(master, joiner);
        const order = config.drinks.map((d) => d.id);
        expect(readDrinksFromYjs(master).map((d) => d.id)).toEqual(order);
        expect(readDrinksFromYjs(joiner).map((d) => d.id)).toEqual(order);
      });

      it('überschreibt Einstellungen des Masters nicht mit Standardwerten', () => {
        const master = device(masterId, defaults(), { tagesbilanz: true });
        const joiner = device(joinerId, defaults(), { tagesbilanz: false });
        pair(master, joiner);
        expect(readSharedSettingsFromYjs(master)?.features.tagesbilanz).toBe(true);
        expect(readSharedSettingsFromYjs(joiner)?.features.tagesbilanz).toBe(true);
      });

      it('führt die Tagesbilanz aller Geräte zusammen', () => {
        const master = device(masterId, defaults(), { bilanz: [entry('m1'), entry('m2')] });
        const joiner = device(joinerId, defaults(), { bilanz: [entry('j1')] });
        pair(master, joiner);
        const ids = ['j1', 'm1', 'm2'];
        expect(readBilanzFromYjs(master).map((e) => e.id).sort()).toEqual(ids);
        expect(readBilanzFromYjs(joiner).map((e) => e.id).sort()).toEqual(ids);
      });
    });
  }
});

describe('Schreiben als gezielte Operationen', () => {
  it('Ein veralteter Stand löscht keine fremden Bilanz-Einträge', () => {
    const doc = device(1, defaults(), { bilanz: [entry('alt')] });
    const remote = new Y.Doc();
    Y.applyUpdate(remote, Y.encodeStateAsUpdate(doc));
    upsertBilanzEntries(remote, [entry('von-partner')]);
    Y.applyUpdate(doc, Y.encodeStateAsUpdate(remote));

    upsertBilanzEntries(doc, [entry('lokal-neu')]);

    expect(readBilanzFromYjs(doc).map((e) => e.id).sort()).toEqual([
      'alt',
      'lokal-neu',
      'von-partner',
    ]);
  });

  it('Eine Sortiments-Änderung fasst nur betroffene Getränke an', () => {
    const config = defaults();
    const doc = device(1, config);
    // Partner hat Helles geändert, dieses Gerät hat das noch nicht gerendert.
    doc.getMap<string>('drinks').set(
      'd-helles',
      JSON.stringify({ ...config.drinks[1], priceCents: 999 }),
    );
    const next = {
      pfandTypes: config.pfandTypes,
      drinks: config.drinks.map((d) => (d.id === 'd-pils' ? { ...d, priceCents: 460 } : d)),
    };
    applyConfigChange(doc, config, next);
    const drinks = readDrinksFromYjs(doc);
    expect(drinks.find((d) => d.id === 'd-pils')?.priceCents).toBe(460);
    expect(drinks.find((d) => d.id === 'd-helles')?.priceCents).toBe(999);
  });
});

describe('Beobachter melden Remote-Änderungen', () => {
  it('Lokale Änderungen lösen keine Rückmeldung aus, Remote-Änderungen genau eine', () => {
    const config = defaults();
    const doc = device(1, config);
    const calls: string[] = [];
    const dispose = subscribeYjs(doc, {
      onConfig: () => calls.push('config'),
      onBilanz: () => calls.push('bilanz'),
      onSharedSettings: () => calls.push('shared'),
    });

    upsertBilanzEntries(doc, [entry('lokal')]);
    expect(calls).toEqual([]);

    const remote = new Y.Doc();
    Y.applyUpdate(remote, Y.encodeStateAsUpdate(doc));
    upsertBilanzEntries(remote, [entry('remote')]);
    Y.applyUpdate(doc, Y.encodeStateAsUpdate(remote, Y.encodeStateVector(doc)), 'peer');
    expect(calls).toEqual(['bilanz']);
    dispose();
  });

  it('Nur eine Reihenfolgen-Änderung des Masters meldet das Sortiment, nicht die Einstellungen', () => {
    const config = defaults();
    const doc = device(1, config);
    const calls: string[] = [];
    const dispose = subscribeYjs(doc, {
      onConfig: () => calls.push('config'),
      onBilanz: () => calls.push('bilanz'),
      onSharedSettings: () => calls.push('shared'),
    });
    const remote = new Y.Doc();
    Y.applyUpdate(remote, Y.encodeStateAsUpdate(doc));
    applyConfigChange(remote, config, { ...config, drinks: [...config.drinks].reverse() });
    Y.applyUpdate(doc, Y.encodeStateAsUpdate(remote, Y.encodeStateVector(doc)), 'peer');
    expect(calls).toEqual(['config']);
    dispose();
  });
});

describe('Reducer', () => {
  const withOrder = (): State => ({
    ...getInitialState(),
    order: [
      { drinkId: 'd-pils', qty: 2 },
      { drinkId: 'd-radler', qty: 1 },
    ],
    returns: [{ pfandTypeId: 'pfand-glas', qty: 1 }],
  });

  it('APPLY_SYNCED_CONFIG behält die laufende Bestellung', () => {
    const state = withOrder();
    const next = reducer(state, {
      type: 'APPLY_SYNCED_CONFIG',
      drinks: state.drinks,
      pfandTypes: state.pfandTypes,
    });
    expect(next.order).toEqual(state.order);
    expect(next.returns).toEqual(state.returns);
  });

  it('APPLY_SYNCED_CONFIG entfernt nur Positionen gelöschter Getränke', () => {
    const state = withOrder();
    const next = reducer(state, {
      type: 'APPLY_SYNCED_CONFIG',
      drinks: state.drinks.filter((d) => d.id !== 'd-radler'),
      pfandTypes: state.pfandTypes,
    });
    expect(next.order).toEqual([{ drinkId: 'd-pils', qty: 2 }]);
  });

  it('RESTORE_ORDER lässt inzwischen gelöschte Getränke weg', () => {
    const state = withOrder();
    const without = reducer(
      { ...state, order: [], returns: [] },
      {
        type: 'APPLY_SYNCED_CONFIG',
        drinks: state.drinks.filter((d) => d.id !== 'd-radler'),
        pfandTypes: state.pfandTypes,
      },
    );
    const restored = reducer(without, {
      type: 'RESTORE_ORDER',
      order: state.order,
      returns: state.returns,
    });
    expect(restored.order).toEqual([{ drinkId: 'd-pils', qty: 2 }]);
  });

  it('RESTORE_ORDER stellt eine abgeschlossene Bestellung wieder her', () => {
    const state = withOrder();
    const cleared = reducer(state, { type: 'RESET_ORDER' });
    const restored = reducer(cleared, {
      type: 'RESTORE_ORDER',
      order: state.order,
      returns: state.returns,
    });
    expect(restored.order).toEqual(state.order);
    expect(restored.returns).toEqual(state.returns);
  });
});

describe('QR-Format', () => {
  const chromiumSdp = [
    'v=0',
    'o=- 1911938173977972775 2 IN IP4 127.0.0.1',
    's=-',
    't=0 0',
    'a=group:BUNDLE 0',
    'a=extmap-allow-mixed',
    'a=msid-semantic: WMS',
    'm=application 12426 UDP/DTLS/SCTP webrtc-datachannel',
    'c=IN IP4 203.0.113.7',
    'a=candidate:4222963882 1 udp 2113937151 09c0ece0-1c95-4f97-aa26-74c51c9c804d.local 53053 typ host generation 0 network-cost 999',
    'a=candidate:1764218489 1 udp 2113939711 3b39c7a8-6e04-44ca-85fa-36440ff4d597.local 63310 typ host generation 0 network-cost 999',
    'a=candidate:229443224 1 udp 1677729535 203.0.113.7 12426 typ srflx raddr 0.0.0.0 rport 0 generation 0 network-cost 999',
    'a=candidate:1256462654 1 udp 1677732095 2001:db8:81d8:ea00:1ccc:1c72:c4e2:c40e 63310 typ srflx raddr :: rport 0 generation 0 network-cost 999',
    'a=ice-ufrag:eaGS',
    'a=ice-pwd:deW+6hQ3FvCoNCF0HA3r7/Hx',
    'a=ice-options:trickle',
    'a=fingerprint:sha-256 71:D6:33:59:24:0C:63:AE:54:7D:BB:31:AD:10:9C:40:08:BE:92:97:14:E6:C8:9C:F3:19:AF:02:EF:77:95:BE',
    'a=setup:actpass',
    'a=mid:0',
    'a=sctp-port:5000',
    'a=max-message-size:262144',
    '',
  ].join('\r\n');

  const firefoxSdp = [
    'v=0',
    'o=mozilla...THIS_IS_SDPARTA-99.0 5837228396624655000 0 IN IP4 0.0.0.0',
    's=-',
    't=0 0',
    'a=sendrecv',
    'a=fingerprint:sha-256 03:FC:4E:5D:24:09:92:60:D5:37:85:72:2F:AA:26:D4:0E:75:73:DC:83:38:55:A6:41:FB:F9:CC:B6:3E:B1:26',
    'a=group:BUNDLE 0',
    'a=ice-options:trickle',
    'a=msid-semantic:WMS *',
    'm=application 12429 UDP/DTLS/SCTP webrtc-datachannel',
    'c=IN IP4 203.0.113.7',
    'a=candidate:0 1 UDP 2122187007 8d427dd6-ab3f-4dd1-8de0-fca971a7eb49.local 51652 typ host',
    'a=candidate:4 1 TCP 2105458943 8d427dd6-ab3f-4dd1-8de0-fca971a7eb49.local 9 typ host tcptype active',
    'a=candidate:1 1 UDP 1685987327 203.0.113.7 12429 typ srflx raddr 0.0.0.0 rport 0',
    'a=sendrecv',
    'a=end-of-candidates',
    'a=ice-pwd:d3ce371e37c148c755d33c427cd072be',
    'a=ice-ufrag:d630c1da',
    'a=mid:0',
    'a=setup:actpass',
    'a=sctp-port:5000',
    'a=max-message-size:1073741823',
    '',
  ].join('\r\n');

  for (const [name, sdp] of [['Chromium/Safari', chromiumSdp], ['Firefox', firefoxSdp]] as const) {
    it(`${name}: Kodieren und Dekodieren erhält alle wesentlichen Daten`, () => {
      const sessionId = generateSessionId();
      const code = encodePairing({ type: 'answer', mode: 'display', sessionId, sdp });
      const decoded = decodePairing(code);
      expect(decoded.type).toBe('answer');
      expect(decoded.mode).toBe('display');
      expect(decoded.sessionId).toBe(sessionId);
      expect(decoded.sdp).toBe(minifySdp(sdp));
      expect(decoded.sdp).toMatch(/a=fingerprint:sha-256 ([0-9A-F]{2}:){31}[0-9A-F]{2}/);
      expect(decoded.sdp).toMatch(/a=ice-ufrag:/);
      expect(decoded.sdp).toMatch(/a=ice-pwd:/);
      expect(decoded.sdp).toMatch(/ typ srflx /);
    });
  }

  it('Der Code passt in den QR-Alphanumerik-Zeichensatz', () => {
    const code = encodePairing({
      type: 'offer',
      mode: 'sync',
      sessionId: generateSessionId(),
      sdp: chromiumSdp,
    });
    expect(code).toMatch(/^[0-9A-Z $%*+\-./:]+$/);
    // Altes Format: rund 830 Zeichen im Byte-Modus (QR-Version 23, 109 Module).
    expect(code.length).toBeLessThan(450);
  });

  it('TCP-Candidates und Füllzeilen fallen weg, Netzwerk-Candidates bleiben', () => {
    const minified = minifySdp(firefoxSdp);
    expect(minified).not.toMatch(/tcptype/);
    expect(minified).not.toMatch(/a=sendrecv/);
    expect(minified).toMatch(/\.local 51652 typ host/);
  });

  const codeOf = (fn: () => unknown): string | undefined => {
    try {
      fn();
    } catch (e) {
      if (e instanceof SyncError) return e.code;
      throw e;
    }
    return undefined;
  };

  it('Erkennt fremde, veraltete und neuere Codes mit eigenem Fehlercode', () => {
    expect(codeOf(() => decodePairing('https://example.com'))).toBe('qr-invalid');
    expect(codeOf(() => decodePairing('QgIAAAAA'))).toBe('qr-outdated');
    expect(codeOf(() => decodePairing('BK9:ABC:'))).toBe('qr-newer');
    expect(codeOf(() => decodePairing('BK3:AB:'))).toBe('qr-invalid');
  });

  it('Eingefügter Code mit Zeilenumbruch funktioniert noch', () => {
    const code = encodePairing({
      type: 'offer',
      mode: 'sync',
      sessionId: generateSessionId(),
      sdp: chromiumSdp,
    });
    expect(decodePairing(`${code.slice(0, 40)}\n${code.slice(40)}\r\n`).sdp).toBe(
      minifySdp(chromiumSdp),
    );
  });
});

describe('Drahtformat', () => {
  it('Kleine Nachrichten bleiben unverändert', () => {
    const message = packMessage(MSG_UPDATE, new Uint8Array([1, 2, 3]));
    expect(splitMessage(message, 1)).toEqual([message]);
  });

  it('Große Nachrichten werden zerlegt und vollständig zusammengesetzt', () => {
    const payload = new Uint8Array(CHUNK_PAYLOAD_BYTES * 3 + 123);
    for (let i = 0; i < payload.length; i++) payload[i] = i % 251;
    const parts = splitMessage(packMessage(MSG_UPDATE, payload), 7);
    expect(parts.length).toBe(4);
    for (const part of parts) {
      expect(part.byteLength).toBeLessThanOrEqual(CHUNK_PAYLOAD_BYTES + 9);
    }

    const reassembler = new Reassembler();
    let whole: ArrayBuffer | null = null;
    for (const part of parts) {
      const unpacked = unpackMessage(part);
      expect(unpacked.type).toBe(MSG_CHUNK);
      whole = reassembler.add(unpacked.payload);
    }
    expect(whole).not.toBeNull();
    const result = unpackMessage(whole!);
    expect(result.type).toBe(MSG_UPDATE);
    expect(result.payload.every((value, i) => value === payload[i])).toBe(true);
    expect(result.payload.length).toBe(payload.length);
  });

  it('Zwei verschränkte Nachrichten stören sich nicht', () => {
    const a = new Uint8Array(CHUNK_PAYLOAD_BYTES * 2).fill(1);
    const b = new Uint8Array(CHUNK_PAYLOAD_BYTES * 2).fill(2);
    const partsA = splitMessage(packMessage(MSG_UPDATE, a), 1);
    const partsB = splitMessage(packMessage(MSG_UPDATE, b), 2);
    const reassembler = new Reassembler();
    const results: Array<ArrayBuffer | null> = [];
    for (let i = 0; i < partsA.length; i++) {
      results.push(reassembler.add(unpackMessage(partsA[i]).payload));
      results.push(reassembler.add(unpackMessage(partsB[i]).payload));
    }
    const done = results.filter((r): r is ArrayBuffer => r !== null);
    expect(done.length).toBe(2);
    expect(unpackMessage(done[0]).payload.every((v) => v === 1)).toBe(true);
    expect(unpackMessage(done[1]).payload.every((v) => v === 2)).toBe(true);
  });
});

describe('CSV-Export', () => {
  it('Bezeichnungen werden nicht als Tabellen-Formel ausgeführt', () => {
    expect(csvEscape('=HYPERLINK("http://x")')).toBe(`"'=HYPERLINK(""http://x"")"`);
    expect(csvEscape('@SUM(A1)')).toBe("'@SUM(A1)");
    expect(csvEscape('Pils')).toBe('Pils');
    expect(csvEscape('Maß; groß')).toBe('"Maß; groß"');
  });
});
