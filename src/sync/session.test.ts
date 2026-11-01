import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as Y from 'yjs';
import { getInitialState } from '../defaults';
import type { BilanzEntry } from '../bilanz';
import {
  applyConfigChange,
  readBilanzFromYjs,
  readDrinksFromYjs,
  seedYDoc,
  upsertBilanzEntries,
} from './bridge';
import { decodePairing, encodePairing } from './qrPairing';
import { SyncSession, type PeerStatus } from './webrtc';

/* Echte SyncSession gegen ein simuliertes WebRTC: Dokumente, Rollen und Pairing
 * laufen wie in der App, nur die Leitung ist ein In-Memory-Kanal. */

class FakeChannel extends EventTarget {
  readyState: RTCDataChannelState = 'connecting';
  binaryType = 'arraybuffer';
  bufferedAmount = 0;
  bufferedAmountLowThreshold = 0;
  other: FakeChannel | null = null;

  send(data: ArrayBuffer): void {
    if (this.readyState !== 'open') throw new Error('Kanal nicht offen');
    const target = this.other;
    queueMicrotask(() => {
      if (target?.readyState !== 'open') return;
      target.dispatchEvent(Object.assign(new Event('message'), { data }));
    });
  }

  close(): void {
    if (this.readyState === 'closed') return;
    this.readyState = 'closed';
    this.dispatchEvent(new Event('close'));
    const target = this.other;
    queueMicrotask(() => target?.close());
  }
}

class FakeConnection extends EventTarget {
  static registry = new Map<string, FakeConnection>();
  static counter = 0;
  static configs: Array<RTCConfiguration | undefined> = [];

  readonly ufrag = `u${(FakeConnection.counter += 1)}`;
  connectionState: RTCPeerConnectionState = 'new';
  iceGatheringState: RTCIceGatheringState = 'new';
  localDescription: { sdp: string } | null = null;
  channel: FakeChannel | null = null;
  remoteUfrag: string | null = null;

  constructor(config?: RTCConfiguration) {
    super();
    FakeConnection.configs.push(config);
    FakeConnection.registry.set(this.ufrag, this);
  }

  createDataChannel(): FakeChannel {
    this.channel = new FakeChannel();
    return this.channel;
  }

  private sdp(): string {
    return [
      'v=0',
      'o=- 1 2 IN IP4 127.0.0.1',
      's=-',
      't=0 0',
      'm=application 9 UDP/DTLS/SCTP webrtc-datachannel',
      'c=IN IP4 0.0.0.0',
      'a=candidate:1 1 udp 2113937151 192.0.2.1 5000 typ host',
      `a=ice-ufrag:${this.ufrag}`,
      'a=ice-pwd:abcdefghijklmnopqrstuvwx',
      'a=setup:actpass',
      'a=mid:0',
      'a=sctp-port:5000',
      '',
    ].join('\r\n');
  }

  async createOffer() {
    return { type: 'offer' as const, sdp: this.sdp() };
  }

  async createAnswer() {
    return { type: 'answer' as const, sdp: this.sdp() };
  }

  async setLocalDescription(description: { sdp: string }) {
    this.localDescription = description;
    this.iceGatheringState = 'complete';
  }

  async setRemoteDescription(description: { type: string; sdp: string }) {
    const ufrag = description.sdp.match(/a=ice-ufrag:(\S+)/)![1];
    this.remoteUfrag = ufrag;
    if (description.type !== 'answer') return;
    const answerer = FakeConnection.registry.get(ufrag)!;
    // Passt die Antwort nicht zum Angebot, kommt wie im echten Netz nichts zustande.
    if (answerer.remoteUfrag !== this.ufrag) return;
    queueMicrotask(() => this.connect(answerer));
  }

  private connect(answerer: FakeConnection): void {
    const mine = this.channel!;
    const theirs = new FakeChannel();
    mine.other = theirs;
    theirs.other = mine;
    answerer.channel = theirs;
    mine.readyState = 'open';
    theirs.readyState = 'open';
    this.connectionState = 'connected';
    answerer.connectionState = 'connected';
    answerer.dispatchEvent(Object.assign(new Event('datachannel'), { channel: theirs }));
    mine.dispatchEvent(new Event('open'));
  }

  close(): void {
    this.connectionState = 'closed';
    this.channel?.close();
  }

  /** Simuliert den Absturz dieses Geräts: Die Leitung reißt ohne Abschied. */
  crash(): void {
    this.channel?.close();
  }
}

const flush = async () => {
  for (let i = 0; i < 8; i++) await new Promise((resolve) => setTimeout(resolve, 0));
};

type Device = {
  name: string;
  doc: Y.Doc;
  session: SyncSession;
  status: () => PeerStatus;
};

function device(name: string, options: { priceOfPils?: number } = {}): Device {
  const doc = new Y.Doc();
  const { drinks, pfandTypes } = getInitialState();
  seedYDoc(doc, {
    drinks: drinks.map((d) =>
      d.id === 'd-pils' && options.priceOfPils ? { ...d, priceCents: options.priceOfPils } : d,
    ),
    pfandTypes,
    bilanz: [],
    shared: {
      version: 1,
      features: { trinkgeld: false, tagesbilanz: true, bestand: false },
      cashStartCents: 0,
    },
  });
  const session = new SyncSession(doc, {
    onStatus: () => {},
    getLocalIdentity: () => ({ deviceId: `id-${name}`, deviceName: name }),
  });
  return { name, doc, session, status: () => session.getStatus() };
}

const codeOf = (d: Device): string => {
  const pairing = d.status().pairing;
  if (pairing?.phase !== 'show-offer' && pairing?.phase !== 'show-answer') {
    throw new Error(`${d.name} zeigt keinen Code: ${pairing?.phase}`);
  }
  return pairing.code;
};

/** Kompletter QR-Tausch, inklusive echtem Kodieren und Dekodieren des Codes. */
async function pair(host: Device, guest: Device, mode: 'sync' | 'display' = 'sync') {
  await host.session.startPairing(mode);
  await guest.session.handleCode(codeOf(host), mode === 'display');
  await host.session.handleCode(codeOf(guest));
  await flush();
}

const sale = (id: string): BilanzEntry => ({
  id,
  timestamp: 1000,
  items: [],
  returns: [],
  drinksSubtotalCents: 450,
  pfandOutCents: 100,
  pfandReturnCents: 0,
  tipCents: 0,
  totalCents: 550,
  paymentMethod: 'cash',
});

const sales = (d: Device) => readBilanzFromYjs(d.doc).map((e) => e.id).sort();

describe('SyncSession', () => {
  beforeEach(() => {
    vi.stubGlobal('RTCPeerConnection', FakeConnection);
    FakeConnection.registry.clear();
    FakeConnection.configs = [];
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  /** Reißt die Verbindung von außen, wie bei einem abgestürzten Gerät. */
  const crashLink = async (a: Device, b: Device) => {
    for (const connection of FakeConnection.registry.values()) {
      const channel = connection.channel;
      if (!channel?.other) continue;
      const peersOfA = (a.session as unknown as { peers: Array<{ pc: unknown; remoteDeviceId?: string }> }).peers;
      const link = peersOfA.find((p) => p.pc === connection && p.remoteDeviceId === `id-${b.name}`);
      if (link) connection.crash();
    }
    await flush();
  };

  it('Keine Verbindung nutzt einen externen Server (STUN/TURN)', async () => {
    await pair(device('Theke'), device('Stand'));
    expect(FakeConnection.configs.length).toBe(2);
    for (const config of FakeConnection.configs) {
      expect(config?.iceServers ?? []).toEqual([]);
    }
  });

  it('Master, zwei Nebenkassen: Verkäufe erreichen alle, die Hauptkasse behält ihr Sortiment', async () => {
    const main = device('Theke', { priceOfPils: 500 });
    const second = device('Stand');
    const third = device('Zelt');
    await pair(main, second);
    await pair(main, third);

    expect(main.status().peerCount).toBe(2);
    expect(second.status().role).toBe('joiner');

    upsertBilanzEntries(third.doc, [sale('von-zelt')]);
    upsertBilanzEntries(main.doc, [sale('von-theke')]);
    await flush();
    for (const d of [main, second, third]) {
      expect(sales(d)).toEqual(['von-theke', 'von-zelt']);
      expect(readDrinksFromYjs(d.doc).find((x) => x.id === 'd-pils')?.priceCents).toBe(500);
    }
  });

  it('Eine Sortiments-Änderung der Hauptkasse erreicht alle Nebenkassen', async () => {
    const main = device('Theke');
    const second = device('Stand');
    await pair(main, second);
    const { drinks, pfandTypes } = getInitialState();
    applyConfigChange(
      main.doc,
      { drinks, pfandTypes },
      { drinks: drinks.filter((d) => d.id !== 'd-radler'), pfandTypes },
    );
    await flush();
    expect(readDrinksFromYjs(second.doc).some((d) => d.id === 'd-radler')).toBe(false);
  });

  it('Verkäufe während der Trennung werden beim Neu-Koppeln zusammengeführt', async () => {
    const main = device('Theke');
    const second = device('Stand');
    await pair(main, second);
    await crashLink(main, second);
    expect(second.status().state).toBe('idle');

    upsertBilanzEntries(main.doc, [sale('getrennt-theke')]);
    upsertBilanzEntries(second.doc, [sale('getrennt-stand')]);
    await pair(main, second);

    const expected = ['getrennt-stand', 'getrennt-theke'];
    expect(sales(main)).toEqual(expected);
    expect(sales(second)).toEqual(expected);
  });

  it('Nach dem Verlust zeigt die Nebenkasse die Hauptkasse als fehlend und kann neu koppeln', async () => {
    const main = device('Theke');
    const second = device('Stand');
    await pair(main, second);
    await crashLink(main, second);

    expect(second.status().role).toBeNull();
    expect(second.status().reconnect?.role).toBe('joiner');
    expect(second.status().reconnect?.remotePeers.map((p) => p.deviceName)).toEqual(['Theke']);

    await pair(main, second);
    expect(second.status().state).toBe('connected');
    expect(second.status().reconnect).toBeNull();
  });

  it('Nebenkasse mit Display: Der Verlust der Hauptkasse wird trotzdem erkannt', async () => {
    const main = device('Theke');
    const second = device('Stand');
    const screen = device('Anzeige');
    await pair(main, second);
    await pair(second, screen, 'display');
    expect(second.status().peerCount).toBe(2);

    await crashLink(main, second);

    const status = second.status();
    expect(status.role).toBeNull(); // nicht mehr gesperrt
    expect(status.peers.map((p) => p.channel)).toEqual(['display']); // Display bleibt
    expect(status.reconnect?.role).toBe('joiner');
    expect(status.reconnect?.remotePeers.map((p) => p.deviceName)).toEqual(['Theke']);

    // Neu koppeln, während das Display verbunden bleibt.
    await pair(main, second);
    expect(second.status().role).toBe('joiner');
    expect(second.status().peerCount).toBe(2);
    expect(second.status().reconnect).toBeNull();
  });

  it('Kasse mit Display: Abgebrochenes Starten als Hauptkasse sperrt das Beitreten nicht', async () => {
    const till = device('Stand');
    const screen = device('Anzeige');
    const main = device('Theke');
    await pair(till, screen, 'display');

    await till.session.startPairing('sync');
    expect(till.status().role).toBe('master');
    till.session.cancelPairing();
    expect(till.status().role).toBeNull();

    await pair(main, till);
    expect(till.status().role).toBe('joiner');
    expect(till.status().error).toBeNull();
  });

  it('Hinweis verwerfen betrifft nur verlorene Geräte, ein späterer Verlust bleibt sichtbar', async () => {
    const main = device('Theke');
    const a = device('Stand');
    const b = device('Zelt');
    await pair(main, a);
    await pair(main, b);

    await crashLink(main, b);
    expect(main.status().reconnect?.remotePeers.map((p) => p.deviceName)).toEqual(['Zelt']);
    main.session.dismissLostPeers();
    expect(main.status().reconnect).toBeNull();

    await crashLink(main, a);
    expect(main.status().reconnect?.remotePeers.map((p) => p.deviceName)).toEqual(['Stand']);
  });

  it('Bewusstes Trennen löst auf keiner Seite einen Verlust-Hinweis aus', async () => {
    const main = device('Theke');
    const second = device('Stand');
    await pair(main, second);
    second.session.disconnect();
    await new Promise((resolve) => setTimeout(resolve, 600));
    await flush();
    expect(main.status().reconnect).toBeNull();
    expect(second.status().reconnect).toBeNull();
    expect(main.status().role).toBeNull();
  });

  it('Nebenkasse trennen löst bei ihr keinen Verlust-Hinweis aus', async () => {
    const main = device('Theke');
    const second = device('Stand');
    await pair(main, second);
    const peerId = main.status().peers[0].id;
    main.session.kickPeer(peerId);
    await new Promise((resolve) => setTimeout(resolve, 600));
    await flush();
    expect(second.status().reconnect).toBeNull();
    expect(second.status().role).toBeNull();
  });

  it('Ein Antwort-Code eines früheren Versuchs wird sofort abgelehnt', async () => {
    const main = device('Theke');
    const a = device('Stand');
    const b = device('Zelt');
    await pair(main, a);

    await main.session.startPairing('sync');
    await b.session.handleCode(codeOf(main));
    const oldAnswer = codeOf(b);
    main.session.cancelPairing();

    await main.session.startPairing('sync');
    await main.session.handleCode(oldAnswer);
    expect(main.status().error).toBe('session-mismatch');
    expect(main.status().pairing?.phase).toBe('show-offer');
  });

  it('Scheitert der Start früh, bleibt kein ewiger Ladezustand', async () => {
    vi.stubGlobal('RTCPeerConnection', undefined);
    const main = device('Theke');
    await main.session.startPairing('sync');
    expect(main.status().pairing).toBeNull();
    expect(main.status().error).toBe('webrtc-unavailable');
    expect(main.status().role).toBeNull();
  });

  it('Falsche Codes geben einen passenden Fehler und lassen die Kopplung offen', async () => {
    const main = device('Theke');
    await main.session.startPairing('sync');
    await main.session.handleCode('https://example.com');
    expect(main.status().error).toBe('qr-invalid');
    await main.session.handleCode(codeOf(main)); // eigener Code statt Antwort
    expect(main.status().error).toBe('qr-expected-answer');
    expect(main.status().pairing?.phase).toBe('show-offer');
  });

  it('Ein Display-Code auf einer Kasse wird abgelehnt', async () => {
    const till = device('Theke');
    const other = device('Stand');
    await till.session.startPairing('display');
    await other.session.handleCode(codeOf(till), false);
    expect(other.status().error).toBe('qr-wrong-mode');
  });

  it('Der Code übersteht Kodieren und Dekodieren mit gültigem Offer', async () => {
    const main = device('Theke');
    await main.session.startPairing('sync');
    const decoded = decodePairing(codeOf(main));
    expect(decoded.type).toBe('offer');
    expect(decoded.sdp).toMatch(/a=ice-ufrag:/);
    expect(encodePairing(decoded)).toBe(codeOf(main));
  });

  it('Große Datenmengen kommen über die Fragmentierung vollständig an', async () => {
    const main = device('Theke');
    const second = device('Stand');
    const many = Array.from({ length: 2000 }, (_, i) => sale(`e-${i}`));
    upsertBilanzEntries(second.doc, many);
    await pair(main, second);
    await flush();
    await flush();
    expect(readBilanzFromYjs(main.doc).length).toBe(2000);
  });
});
