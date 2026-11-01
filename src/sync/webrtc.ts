import * as Y from 'yjs';
import {
  encodePairing,
  decodePairing,
  generateSessionId,
  hasCandidates,
  type PairingPayload,
  type PairingMode,
} from './qrPairing';
import { isValidSnapshot, type OrderSnapshot } from './orderSnapshot';
import {
  loadLastSession,
  saveLastSession,
  clearLastSession,
  type LastSession,
  type LastSessionPeer,
} from './lastSession';
import { captureAuthoritative, restoreAuthoritative } from './bridge';
import { SyncError, toSyncErrorCode, type SyncErrorCode } from './errors';
import {
  MSG_BYE,
  MSG_CHUNK,
  MSG_HELLO,
  MSG_ORDER,
  MSG_PING,
  MSG_PONG,
  MSG_SYNC_REPLY,
  MSG_SYNC_REQUEST,
  MSG_UPDATE,
  Reassembler,
  packMessage,
  splitMessage,
  unpackMessage,
} from './wire';

/**
 * P2P-WebRTC-Sync mit Stern-Topologie.
 *
 * Master: hält N RTCPeerConnections (eine pro Partner) und verteilt Yjs-Updates
 * an alle außer dem Absender.
 * Joiner: hält genau eine RTCPeerConnection zum Master.
 *
 * Abgleich: Beim Verbinden und danach regelmäßig schickt jede Seite ihren
 * State-Vector. Die Gegenseite antwortet mit genau den fehlenden Daten. Dadurch
 * reparieren sich Abweichungen selbst, auch nach Aussetzern.
 *
 * Ohne Signaling-Server gibt es nach einer abgerissenen Verbindung keinen Weg
 * zurück außer einem neuen QR-Tausch. Deshalb wird eine Verbindung nicht
 * vorschnell aufgegeben (siehe Heartbeat), und ein Verlust bleibt sichtbar, bis
 * neu gekoppelt oder bewusst verworfen wurde. Verkäufe bleiben währenddessen
 * lokal gespeichert und werden beim nächsten Koppeln zusammengeführt.
 */

export type SyncRole = 'master' | 'joiner' | 'display' | null;

/** Was läuft über diesen Peer-Kanal: regulärer Sync oder Display-Order-Stream? */
export type PeerChannel = 'sync' | 'display';

export type PeerInfo = {
  /** Stabile, zufällige ID pro RTCPeerConnection — für Kick-Operationen. */
  id: string;
  /** Unix-ms-Timestamp, wann die DC zum ersten Mal 'open' wurde. */
  connectedAt: number;
  /** Stabile UUID des entfernten Geräts (aus Handshake). */
  remoteDeviceId?: string;
  /** Vom Remote gesetzter Anzeige-Name (z.B. "Theke", "Hilfsstand"). */
  remoteDeviceName?: string;
  /** App-Version der Gegenseite, um Versionsunterschiede sichtbar zu machen. */
  remoteAppVersion?: string;
  /** Kanal-Typ — bestimmt was wir an diesen Peer senden. */
  channel: PeerChannel;
  /** Seit einigen Sekunden kein Lebenszeichen, Verbindung aber noch nicht tot. */
  unstable: boolean;
  /** Letzter vollständiger Datenabgleich (nur Sync-Kanal). */
  lastSyncedAt: number | null;
};

/** Vom App-Layer bereitgestellt, damit der Handshake unsere eigene Identität kennt. */
export type LocalIdentity = {
  deviceId: string;
  deviceName: string;
};

export type PairingState =
  | { phase: 'preparing'; mode: PairingMode }
  /** Eigener QR-Code wird gezeigt, wartet auf die Antwort des anderen Geräts. */
  | { phase: 'show-offer'; mode: PairingMode; code: string }
  /** Antwort-QR wird gezeigt, wartet darauf, dass das andere Gerät ihn scannt. */
  | { phase: 'show-answer'; mode: PairingMode; code: string }
  /** Beide Codes getauscht, Verbindung wird aufgebaut. */
  | { phase: 'connecting'; mode: PairingMode };

export type PeerStatus = {
  state: 'idle' | 'connected';
  role: SyncRole;
  peerCount: number;
  peers: PeerInfo[];
  /** Laufender Kopplungsvorgang. Überlebt Tab-Wechsel, weil er hier lebt. */
  pairing: PairingState | null;
  /** Letzter Fehler, bis zum nächsten Versuch. */
  error: SyncErrorCode | null;
  /** Bekannte Geräte ohne aktuelle Verbindung, auch nach einem App-Neustart. */
  reconnect: LastSession | null;
};

export const IDLE_STATUS: PeerStatus = {
  state: 'idle',
  role: null,
  peerCount: 0,
  peers: [],
  pairing: null,
  error: null,
  reconnect: null,
};

export type SyncEvents = {
  onStatus: (status: PeerStatus) => void;
  /** Wird beim Handshake aufgerufen — App reicht aktuelle deviceId + deviceName.
   *  Getter (statt Constructor-Argument), damit Renaming sofort wirkt. */
  getLocalIdentity: () => LocalIdentity;
  /** Wird gerufen, sobald ein Display-Peer einen Order-Snapshot empfängt
   *  (nur relevant wenn dieses Gerät selbst im Display-Modus läuft). */
  onOrderSnapshot?: (snapshot: OrderSnapshot) => void;
};

/**
 * Bewusst ohne STUN und TURN: Die Geräte finden sich nur im selben Netz. Jeder
 * externe Server bekäme beim Koppeln die IP-Adresse des Geräts, und die App
 * verspricht, ohne externe Dienste auszukommen.
 */
const RTC_CONFIG: RTCConfiguration = { iceServers: [] };

/** Wie oft wir Pings senden (ms). */
const HEARTBEAT_INTERVAL_MS = 4000;
/** Ohne Lebenszeichen gilt die Verbindung als instabil (nur Anzeige). */
const UNSTABLE_AFTER_MS = 10_000;
/** Erst danach geben wir auf. Ein Neuaufbau kostet einen QR-Tausch und das
 *  Sperren eines Geräts für ein paar Sekunden darf das nicht auslösen. Die
 *  Browser selbst melden 'failed' nach rund 30 s fehlender ICE-Antworten. */
const GIVE_UP_AFTER_MS = 45_000;
/** Nach so vielen Ticks ein Abgleich über den State-Vector (= alle 28 s). */
const RESYNC_EVERY_TICKS = 7;
/** Master hat die Antwort gescannt: So lange darf der Aufbau dauern. */
const CONNECT_TIMEOUT_MS = 30_000;
/** So lange bleibt ein gezeigter Antwort-QR gültig. */
const ANSWER_EXPIRY_MS = 5 * 60_000;
/** ICE-Sammlung: Ende nach kurzer Ruhe, spätestens nach dem Maximum. */
const ICE_QUIET_MS = 1500;
const ICE_MAX_WAIT_MS = 5000;
/** Über diesem Wert warten wir mit dem Senden, bis der Puffer leerer ist. */
const BUFFER_HIGH_BYTES = 1024 * 1024;
const BUFFER_LOW_BYTES = 256 * 1024;
const BYE_FLUSH_MS = 500;

const DC_LABEL = 'bierwagen-sync';
const LOG_LIMIT = 200;

/** Non-Trickle: Alle Candidates müssen ins SDP, weil der QR-Code nur einmal übertragen wird. */
function waitForIceGathering(pc: RTCPeerConnection): Promise<void> {
  if (pc.iceGatheringState === 'complete') return Promise.resolve();
  return new Promise((resolve) => {
    let quietTimer: ReturnType<typeof setTimeout> | null = null;
    const finish = () => {
      pc.removeEventListener('icegatheringstatechange', onState);
      pc.removeEventListener('icecandidate', onCandidate);
      if (quietTimer) clearTimeout(quietTimer);
      clearTimeout(maxTimer);
      resolve();
    };
    const onState = () => {
      if (pc.iceGatheringState === 'complete') finish();
    };
    const onCandidate = () => {
      if (quietTimer) clearTimeout(quietTimer);
      quietTimer = setTimeout(finish, ICE_QUIET_MS);
    };
    const maxTimer = setTimeout(finish, ICE_MAX_WAIT_MS);
    pc.addEventListener('icegatheringstatechange', onState);
    pc.addEventListener('icecandidate', onCandidate);
  });
}

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

type Peer = {
  id: string;
  pc: RTCPeerConnection;
  dc: RTCDataChannel | null;
  channel: PeerChannel;
  connectedAt: number;
  remoteDeviceId?: string;
  remoteDeviceName?: string;
  remoteAppVersion?: string;
  /** Letzter Zeitpunkt, an dem wir IRGENDETWAS vom Peer empfangen haben (ms). */
  lastSeen: number;
  unstable: boolean;
  lastSyncedAt: number | null;
  /** Gegenseite hat sich bewusst verabschiedet. */
  saidBye: boolean;
  outbox: ArrayBuffer[];
  reassembler: Reassembler;
};

type PendingPair = {
  peer: Peer;
  side: 'offer' | 'answer';
  mode: PairingMode;
  /** Gilt nur für diesen einen Versuch, damit ein alter Antwort-Code auffällt. */
  sessionId: string;
  timer: ReturnType<typeof setTimeout> | null;
};

/** Sync-Session: kapselt RTCPeerConnections, DataChannels und das Yjs-Routing. */
export class SyncSession {
  private ydoc: Y.Doc;
  private events: SyncEvents;
  private role: SyncRole = null;
  private peers: Peer[] = [];
  private pending: PendingPair | null = null;
  private pairing: PairingState | null = null;
  private error: SyncErrorCode | null = null;
  /** Bricht einen laufenden Vorgang ab, wenn inzwischen ein neuer gestartet wurde. */
  private pairingToken = 0;
  /** Zuletzt verbundene Geräte. Persistiert, also auch nach einem Neustart bekannt. */
  private known: LastSession | null = loadLastSession();
  private ydocUpdateHandler: ((update: Uint8Array, origin: unknown) => void) | null =
    null;
  /** Letzter Order-Snapshot — wird Display-Peers beim Connect direkt geschickt. */
  private lastOrderSnapshot: OrderSnapshot | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private lastTickAt = 0;
  private ticks = 0;
  private nextMsgId = 1;
  private logLines: string[] = [];

  constructor(ydoc: Y.Doc, events: SyncEvents) {
    this.ydoc = ydoc;
    this.events = events;
    this.log(`Session gestartet, App ${__APP_VERSION__}`);
  }

  getStatus(): PeerStatus {
    const open = this.openPeers();
    const openIds = new Set(open.map((p) => p.remoteDeviceId));
    const missing =
      this.known?.remotePeers.filter((p) => !openIds.has(p.deviceId)) ?? [];
    return {
      state: open.length > 0 ? 'connected' : 'idle',
      role: this.role,
      peerCount: open.length,
      peers: open.map((p) => ({
        id: p.id,
        connectedAt: p.connectedAt,
        remoteDeviceId: p.remoteDeviceId,
        remoteDeviceName: p.remoteDeviceName,
        remoteAppVersion: p.remoteAppVersion,
        channel: p.channel,
        unstable: p.unstable,
        lastSyncedAt: p.lastSyncedAt,
      })),
      pairing: this.pairing,
      error: this.error,
      reconnect:
        this.known && missing.length > 0
          ? { ...this.known, remotePeers: missing }
          : null,
    };
  }

  private emitStatus(): void {
    this.events.onStatus(this.getStatus());
  }

  private openPeers(): Peer[] {
    return this.peers.filter((p) => p.dc?.readyState === 'open');
  }

  private log(message: string): void {
    const time = new Date().toISOString().slice(11, 19);
    this.logLines.push(`${time} ${message}`);
    if (this.logLines.length > LOG_LIMIT) this.logLines.shift();
  }

  // ============== SENDEN ==============

  /** Alles läuft hierüber: Fragmentierung, Reihenfolge und Puffer-Grenzen. */
  private sendTo(peer: Peer, message: ArrayBuffer): void {
    const parts = splitMessage(message, this.nextMsgId);
    if (parts.length > 1) this.nextMsgId += 1;
    peer.outbox.push(...parts);
    this.flush(peer);
  }

  private flush(peer: Peer): void {
    const dc = peer.dc;
    if (!dc || dc.readyState !== 'open') return;
    try {
      while (peer.outbox.length > 0 && dc.bufferedAmount < BUFFER_HIGH_BYTES) {
        dc.send(peer.outbox.shift()!);
      }
    } catch (e) {
      // Kanal bricht gerade weg. Der nächste Abgleich holt Fehlendes nach.
      this.log(`Senden an ${peer.remoteDeviceName ?? peer.id} fehlgeschlagen: ${String(e)}`);
      peer.outbox = [];
    }
  }

  private sendJson(peer: Peer, type: number, value: unknown): void {
    this.sendTo(peer, packMessage(type, textEncoder.encode(JSON.stringify(value))));
  }

  private sendHello(peer: Peer): void {
    this.sendJson(peer, MSG_HELLO, {
      ...this.events.getLocalIdentity(),
      appVersion: __APP_VERSION__,
    });
  }

  /** Fragt die Gegenseite nach allem, was uns laut State-Vector noch fehlt. */
  private requestSync(peer: Peer): void {
    this.sendTo(
      peer,
      packMessage(MSG_SYNC_REQUEST, Y.encodeStateVector(this.ydoc)),
    );
  }

  /** Sendet die eigene Identität erneut, z. B. nach dem Umbenennen des Geräts. */
  broadcastIdentity(): void {
    for (const peer of this.openPeers()) this.sendHello(peer);
  }

  /** Verteilt lokale und vom Master weitergeleitete Yjs-Änderungen an Sync-Peers. */
  private installYjsBroadcast(): void {
    if (this.ydocUpdateHandler) return;
    this.ydocUpdateHandler = (update: Uint8Array, origin: unknown) => {
      const message = packMessage(MSG_UPDATE, update);
      for (const peer of this.openPeers()) {
        if (peer.channel !== 'sync') continue;
        // Echo-Schutz: nicht zurück an den Origin-Peer schicken.
        if (origin === peer.dc) continue;
        this.sendTo(peer, message);
      }
    };
    this.ydoc.on('update', this.ydocUpdateHandler);
  }

  private uninstallYjsBroadcast(): void {
    if (this.ydocUpdateHandler) {
      this.ydoc.off('update', this.ydocUpdateHandler);
      this.ydocUpdateHandler = null;
    }
  }

  /** Verteilt die aktuelle Bestellung an verbundene Kundendisplays. */
  broadcastOrder(snapshot: OrderSnapshot): void {
    this.lastOrderSnapshot = snapshot;
    for (const peer of this.openPeers()) {
      if (peer.channel === 'display') this.sendJson(peer, MSG_ORDER, snapshot);
    }
  }

  // ============== EMPFANGEN ==============

  private handleIncoming(peer: Peer, data: ArrayBuffer): void {
    // Jede empfangene Nachricht zählt als Lebenszeichen.
    peer.lastSeen = Date.now();
    if (peer.unstable) {
      peer.unstable = false;
      this.log(`${peer.remoteDeviceName ?? peer.id}: wieder stabil`);
      this.emitStatus();
    }
    const { type, payload } = unpackMessage(data);
    if (type === MSG_CHUNK) {
      const whole = peer.reassembler.add(payload);
      if (whole) this.handleIncoming(peer, whole);
      return;
    }
    switch (type) {
      case MSG_PING:
        this.sendTo(peer, packMessage(MSG_PONG, payload));
        return;
      case MSG_PONG:
        return;
      case MSG_HELLO:
        this.handleHello(peer, payload);
        return;
      case MSG_SYNC_REQUEST:
        if (peer.channel === 'sync') this.answerSyncRequest(peer, payload);
        return;
      case MSG_SYNC_REPLY:
        if (peer.channel !== 'sync') return;
        this.applyRemoteUpdate(peer, payload);
        peer.lastSyncedAt = Date.now();
        this.emitStatus();
        return;
      case MSG_UPDATE:
        if (peer.channel === 'sync') this.applyRemoteUpdate(peer, payload);
        return;
      case MSG_ORDER:
        this.handleOrder(payload);
        return;
      case MSG_BYE:
        peer.saidBye = true;
        return;
      default:
        // Unbekannter Typ, z. B. von einer neueren App-Version.
        this.log(`Unbekannter Nachrichtentyp ${type}`);
    }
  }

  private answerSyncRequest(peer: Peer, stateVector: Uint8Array): void {
    try {
      const diff = Y.encodeStateAsUpdate(this.ydoc, stateVector);
      this.sendTo(peer, packMessage(MSG_SYNC_REPLY, diff));
    } catch (e) {
      this.log(`Abgleich-Anfrage defekt: ${String(e)}`);
    }
  }

  /**
   * Übernimmt Daten eines Partners. Auf dem Master bleiben Sortiment und geteilte
   * Einstellungen unverändert, nur die Tagesbilanz fließt zusammen.
   */
  private applyRemoteUpdate(peer: Peer, update: Uint8Array): void {
    try {
      if (this.role === 'master') {
        const before = captureAuthoritative(this.ydoc);
        Y.applyUpdate(this.ydoc, update, peer.dc);
        if (restoreAuthoritative(this.ydoc, before)) {
          this.log(`Sortiment des Masters gegenüber ${peer.remoteDeviceName ?? peer.id} bestätigt`);
        }
      } else {
        Y.applyUpdate(this.ydoc, update, peer.dc);
      }
    } catch (e) {
      this.log(`Update defekt: ${String(e)}`);
    }
  }

  private handleOrder(payload: Uint8Array): void {
    try {
      const parsed = JSON.parse(textDecoder.decode(payload));
      if (isValidSnapshot(parsed)) this.events.onOrderSnapshot?.(parsed);
    } catch {
      /* defekter Order-Snapshot — ignorieren */
    }
  }

  private handleHello(peer: Peer, payload: Uint8Array): void {
    try {
      const parsed = JSON.parse(textDecoder.decode(payload)) as Partial<
        LocalIdentity & { appVersion: string }
      >;
      if (typeof parsed.deviceId === 'string') peer.remoteDeviceId = parsed.deviceId;
      if (typeof parsed.deviceName === 'string') peer.remoteDeviceName = parsed.deviceName;
      if (typeof parsed.appVersion === 'string') peer.remoteAppVersion = parsed.appVersion;
      this.log(`Verbunden mit ${peer.remoteDeviceName} (App ${peer.remoteAppVersion ?? '?'})`);
      this.rememberPeer(peer);
      this.emitStatus();
    } catch {
      /* defekter Handshake — ignorieren */
    }
  }

  // ============== VERBINDUNGS-LEBENSZYKLUS ==============

  private wireDataChannel(dc: RTCDataChannel, peer: Peer): void {
    dc.binaryType = 'arraybuffer';
    dc.bufferedAmountLowThreshold = BUFFER_LOW_BYTES;
    peer.dc = dc;
    let opened = false;
    const onOpen = () => {
      if (opened) return;
      opened = true;
      this.handleChannelOpen(peer);
    };
    dc.addEventListener('open', onOpen);
    dc.addEventListener('message', (e) => {
      this.handleIncoming(peer, e.data as ArrayBuffer);
    });
    dc.addEventListener('bufferedamountlow', () => this.flush(peer));
    dc.addEventListener('close', () => {
      this.removePeer(peer, peer.saidBye ? 'bye' : 'lost');
    });
    // Beim Antwortenden kann der Kanal beim 'datachannel'-Event schon offen sein.
    if (dc.readyState === 'open') onOpen();
  }

  private handleChannelOpen(peer: Peer): void {
    peer.connectedAt = Date.now();
    peer.lastSeen = peer.connectedAt;
    this.log(`Kanal offen (${peer.channel})`);
    if (this.pending?.peer === peer) this.finishPairing();
    this.resetRoleIfUnused();
    this.error = null;
    this.sendHello(peer);
    if (peer.channel === 'sync') {
      this.requestSync(peer);
    } else if (this.lastOrderSnapshot) {
      this.sendJson(peer, MSG_ORDER, this.lastOrderSnapshot);
    }
    this.startHeartbeat();
    this.emitStatus();
  }

  private watchConnection(peer: Peer): void {
    peer.pc.addEventListener('connectionstatechange', () => {
      const state = peer.pc.connectionState;
      this.log(`Verbindung ${peer.remoteDeviceName ?? peer.id}: ${state}`);
      if (state === 'connected') {
        peer.lastSeen = Date.now();
        if (peer.unstable) {
          peer.unstable = false;
          this.emitStatus();
        }
        return;
      }
      if (state === 'disconnected') {
        // Oft nur ein kurzer Aussetzer, der sich von selbst erholt.
        peer.unstable = true;
        this.emitStatus();
        return;
      }
      if (state !== 'failed' && state !== 'closed') return;

      if (this.pending?.peer === peer) {
        // Das Gerät mit dem Antwort-QR wartet weiter, bis der Code gescannt wurde:
        // Seine ICE-Prüfungen dürfen vorher ins Leere laufen.
        if (this.pending.side === 'answer') return;
        this.failPairing('connect-failed');
        return;
      }
      this.removePeer(peer, 'lost');
    });
  }

  private createPeer(channel: PeerChannel): Peer {
    if (typeof RTCPeerConnection === 'undefined') {
      throw new SyncError('webrtc-unavailable');
    }
    const peer: Peer = {
      id: generateSessionId(),
      pc: new RTCPeerConnection(RTC_CONFIG),
      dc: null,
      channel,
      connectedAt: 0,
      lastSeen: Date.now(),
      unstable: false,
      lastSyncedAt: null,
      saidBye: false,
      outbox: [],
      reassembler: new Reassembler(),
    };
    this.watchConnection(peer);
    return peer;
  }

  /**
   * `pc.close()` kappt die Leitung sofort. Nach einem bewussten Trennen bekommt
   * der Kanal kurz Zeit, damit das MSG_BYE noch ankommt.
   */
  private closePeerTransport(peer: Peer, afterBye = false): void {
    try {
      peer.dc?.close();
    } catch {
      /* noop */
    }
    const closeConnection = () => {
      try {
        peer.pc.close();
      } catch {
        /* noop */
      }
    };
    if (afterBye) setTimeout(closeConnection, BYE_FLUSH_MS);
    else closeConnection();
  }

  private removePeer(peer: Peer, reason: 'lost' | 'bye' | 'kicked'): void {
    if (!this.peers.includes(peer)) return;
    const wasOpen = peer.connectedAt > 0;
    this.peers = this.peers.filter((p) => p !== peer);
    this.closePeerTransport(peer, reason === 'kicked');
    this.log(`Partner ${peer.remoteDeviceName ?? peer.id} weg: ${reason}`);
    if (reason === 'lost') {
      if (wasOpen) this.touchKnown();
    } else {
      this.forgetPeer(peer);
    }
    this.resetRoleIfUnused();
    this.emitStatus();
  }

  /**
   * Ohne Sync-Partner und ohne laufendes Sync-Pairing gibt es keine Master- oder
   * Joiner-Rolle mehr, auch wenn noch Displays angebunden sind. So kann ein
   * ehemaliger Joiner direkt neu scannen oder selbst Master werden.
   */
  private resetRoleIfUnused(): void {
    const hasSyncPartner = this.peers.some((p) => p.channel === 'sync');
    if (this.role !== 'display' && !hasSyncPartner && this.pending?.mode !== 'sync') {
      this.role = null;
      this.uninstallYjsBroadcast();
    }
    if (this.peers.length > 0 || this.pending) return;
    this.role = null;
    this.stopHeartbeat();
  }

  // ============== LETZTE SESSION ==============

  private rememberPeer(peer: Peer): void {
    if (!peer.remoteDeviceId || !peer.remoteDeviceName) return;
    const entry: LastSessionPeer = {
      deviceId: peer.remoteDeviceId,
      deviceName: peer.remoteDeviceName,
      channel: peer.channel,
    };
    // Eine neue Hauptkasse ersetzt die alte, ein Display hat genau eine Kasse.
    // Displays einer Nebenkasse dürfen die Hauptkasse aber nicht verdrängen.
    const replaced = (p: LastSessionPeer): boolean =>
      p.deviceId === entry.deviceId ||
      this.role === 'display' ||
      (this.role === 'joiner' && entry.channel === 'sync' && p.channel === 'sync');
    this.known = {
      version: 1,
      // Ohne Rolle gilt die letzte: Sie sagt, wie der fehlende Partner zurückkommt.
      role: this.role ?? this.known?.role ?? 'cashier',
      remotePeers: [...(this.known?.remotePeers.filter((p) => !replaced(p)) ?? []), entry],
      lastConnectedAt: Date.now(),
    };
    saveLastSession(this.known);
  }

  private touchKnown(): void {
    if (!this.known) return;
    this.known = { ...this.known, lastConnectedAt: Date.now() };
    saveLastSession(this.known);
  }

  private forgetPeer(peer: Peer): void {
    if (!this.known) return;
    this.keepKnownPeers((p) => p.deviceId !== peer.remoteDeviceId);
  }

  private keepKnownPeers(keep: (peer: LastSessionPeer) => boolean): void {
    if (!this.known) return;
    const remotePeers = this.known.remotePeers.filter(keep);
    if (remotePeers.length === 0) {
      this.known = null;
      clearLastSession();
    } else {
      this.known = { ...this.known, remotePeers };
      saveLastSession(this.known);
    }
  }

  /**
   * Verwirft den Hinweis auf verlorene Geräte. Noch verbundene bleiben bekannt,
   * sonst bliebe ihr späterer Verlust unbemerkt.
   */
  dismissLostPeers(): void {
    const connected = new Set(this.openPeers().map((p) => p.remoteDeviceId));
    this.keepKnownPeers((p) => connected.has(p.deviceId));
    this.emitStatus();
  }

  // ============== HEARTBEAT ==============

  private startHeartbeat(): void {
    if (this.heartbeatTimer !== null) return;
    this.lastTickAt = Date.now();
    this.heartbeatTimer = setInterval(
      () => this.heartbeatTick(),
      HEARTBEAT_INTERVAL_MS,
    );
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer !== null) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private markAllPeersSeen(now: number): void {
    for (const peer of this.peers) peer.lastSeen = now;
  }

  private heartbeatTick(): void {
    const now = Date.now();
    // Timer gedrosselt oder Seite eingefroren: Dann waren WIR die Stillen. Die
    // Partner bekommen eine neue Chance, statt sofort aufgegeben zu werden.
    if (now - this.lastTickAt > HEARTBEAT_INTERVAL_MS * 2.5) {
      this.log(`Eigene Pause: ${Math.round((now - this.lastTickAt) / 1000)} s`);
      this.markAllPeersSeen(now);
    }
    this.lastTickAt = now;
    this.ticks += 1;
    const resync = this.ticks % RESYNC_EVERY_TICKS === 0;

    let statusChanged = false;
    for (const peer of [...this.peers]) {
      if (peer.dc?.readyState !== 'open') continue;
      const silentFor = now - peer.lastSeen;
      if (silentFor > GIVE_UP_AFTER_MS) {
        this.log(`${peer.remoteDeviceName ?? peer.id}: ${Math.round(silentFor / 1000)} s still, gebe auf`);
        this.removePeer(peer, 'lost');
        continue;
      }
      this.sendTo(peer, packMessage(MSG_PING, new Uint8Array(0)));
      const unstable = silentFor > UNSTABLE_AFTER_MS;
      if (unstable !== peer.unstable) {
        peer.unstable = unstable;
        statusChanged = true;
      }
      if (resync && peer.channel === 'sync') this.requestSync(peer);
    }
    if (statusChanged) this.emitStatus();
  }

  /** App kommt in den Vordergrund: Lebenszeichen einholen und Daten abgleichen. */
  handleForeground(): void {
    const now = Date.now();
    this.lastTickAt = now;
    this.markAllPeersSeen(now);
    for (const peer of this.openPeers()) {
      this.sendTo(peer, packMessage(MSG_PING, new Uint8Array(0)));
      if (peer.channel === 'sync') this.requestSync(peer);
    }
    this.emitStatus();
  }

  // ============== PAIRING ==============

  private setPairing(pairing: PairingState | null): void {
    this.pairing = pairing;
    this.emitStatus();
  }

  private clearPendingTimer(): void {
    if (this.pending?.timer) {
      clearTimeout(this.pending.timer);
      this.pending.timer = null;
    }
  }

  private finishPairing(): void {
    this.clearPendingTimer();
    this.pending = null;
    this.pairing = null;
  }

  private dropPending(): void {
    if (!this.pending) return;
    const { peer } = this.pending;
    this.clearPendingTimer();
    this.pending = null;
    this.pairing = null;
    this.peers = this.peers.filter((p) => p !== peer);
    this.closePeerTransport(peer);
  }

  private failPairing(code: SyncErrorCode): void {
    this.log(`Kopplung fehlgeschlagen: ${code}`);
    this.dropPending();
    this.pairing = null;
    this.pairingToken += 1;
    this.error = code;
    this.resetRoleIfUnused();
    this.emitStatus();
  }

  /** Bricht den laufenden Kopplungsvorgang ab, bestehende Partner bleiben. */
  cancelPairing(): void {
    this.pairingToken += 1;
    this.dropPending();
    this.pairing = null;
    this.error = null;
    this.resetRoleIfUnused();
    this.emitStatus();
  }

  /** Blendet die letzte Fehlermeldung aus. */
  clearError(): void {
    if (this.error === null) return;
    this.error = null;
    this.emitStatus();
  }

  /** Kasse erzeugt einen QR-Code für einen weiteren Partner oder ein Display. */
  async startPairing(mode: PairingMode): Promise<void> {
    this.pairingToken += 1;
    const token = this.pairingToken;
    this.dropPending();
    this.resetRoleIfUnused();
    this.error = null;
    try {
      if (mode === 'sync') {
        if (this.role === 'joiner' || this.role === 'display') {
          throw new SyncError('role-conflict');
        }
        this.role = 'master';
        this.installYjsBroadcast();
      } else if (this.role === 'display') {
        throw new SyncError('role-conflict');
      }
      const sessionId = generateSessionId();

      this.setPairing({ phase: 'preparing', mode });
      const peer = this.createPeer(mode === 'display' ? 'display' : 'sync');
      this.pending = { peer, side: 'offer', mode, sessionId, timer: null };
      this.wireDataChannel(
        peer.pc.createDataChannel(DC_LABEL, { ordered: true }),
        peer,
      );

      await peer.pc.setLocalDescription(await peer.pc.createOffer());
      await waitForIceGathering(peer.pc);
      if (token !== this.pairingToken) return;

      const sdp = peer.pc.localDescription?.sdp ?? '';
      if (!hasCandidates(sdp)) throw new SyncError('no-candidates');
      const code = encodePairing({ type: 'offer', mode, sessionId, sdp });
      this.log(`QR erzeugt (${mode}), ${code.length} Zeichen`);
      this.setPairing({ phase: 'show-offer', mode, code });
    } catch (e) {
      if (token === this.pairingToken) this.failPairing(toSyncErrorCode(e));
    }
  }

  /**
   * Verarbeitet einen gescannten oder eingefügten Code. Was erwartet wird, ergibt
   * sich aus dem Zustand: Wer selbst einen QR zeigt, erwartet die Antwort darauf.
   * `displayDevice`: Dieses Gerät läuft als Kundendisplay.
   */
  async handleCode(raw: string, displayDevice = false): Promise<void> {
    this.error = null;
    try {
      const payload = decodePairing(raw);
      if (this.pending?.side === 'offer') {
        if (payload.type !== 'answer') throw new SyncError('qr-expected-answer');
        await this.acceptAnswer(payload);
      } else {
        if (payload.type !== 'offer') throw new SyncError('qr-expected-offer');
        if (displayDevice !== (payload.mode === 'display')) {
          throw new SyncError('qr-wrong-mode');
        }
        await this.joinFromOffer(payload);
      }
    } catch (e) {
      const code = toSyncErrorCode(e);
      this.log(`Code abgelehnt: ${code}`);
      this.error = code;
      this.emitStatus();
    }
  }

  private async acceptAnswer(payload: PairingPayload): Promise<void> {
    const pending = this.pending;
    if (!pending) throw new SyncError('no-pairing');
    if (payload.sessionId !== pending.sessionId) {
      throw new SyncError('session-mismatch');
    }
    if (payload.mode !== pending.mode) throw new SyncError('qr-wrong-mode');

    // Vor dem await eintragen: Ab hier kann der Kanal jederzeit aufgehen, und
    // ein Abbruch während des Wartens räumt den Peer über dropPending wieder ab.
    this.peers.push(pending.peer);
    pending.timer = setTimeout(
      () => this.failPairing('connect-timeout'),
      CONNECT_TIMEOUT_MS,
    );
    this.setPairing({ phase: 'connecting', mode: pending.mode });
    try {
      await pending.peer.pc.setRemoteDescription({ type: 'answer', sdp: payload.sdp });
    } catch (e) {
      this.log(`Antwort-Code nicht verwendbar: ${String(e)}`);
      if (this.pending === pending) this.failPairing('connect-failed');
    }
  }

  private async joinFromOffer(offer: PairingPayload): Promise<void> {
    const isDisplay = offer.mode === 'display';
    const targetRole: SyncRole = isDisplay ? 'display' : 'joiner';
    // Eine Nebenkasse hat genau eine Hauptkasse, ein Display genau eine Kasse.
    // Angebundene Displays dürfen bleiben, wenn die Kasse einer Hauptkasse beitritt.
    const open = this.openPeers();
    const occupied = isDisplay
      ? open.length > 0
      : open.some((p) => p.channel === 'sync');
    if (this.role === 'master' || occupied) {
      throw new SyncError('role-conflict');
    }

    this.pairingToken += 1;
    const token = this.pairingToken;
    this.dropPending();
    this.role = targetRole;
    if (!isDisplay) this.installYjsBroadcast();
    this.setPairing({ phase: 'preparing', mode: offer.mode });

    try {
      const peer = this.createPeer(isDisplay ? 'display' : 'sync');
      peer.pc.addEventListener('datachannel', (e) => {
        this.peers.push(peer);
        this.wireDataChannel(e.channel, peer);
      });
      this.pending = {
        peer,
        side: 'answer',
        mode: offer.mode,
        sessionId: offer.sessionId,
        timer: setTimeout(() => this.failPairing('connect-timeout'), ANSWER_EXPIRY_MS),
      };

      await peer.pc.setRemoteDescription({ type: 'offer', sdp: offer.sdp });
      await peer.pc.setLocalDescription(await peer.pc.createAnswer());
      await waitForIceGathering(peer.pc);
      if (token !== this.pairingToken) return;

      const sdp = peer.pc.localDescription?.sdp ?? '';
      if (!hasCandidates(sdp)) throw new SyncError('no-candidates');
      const code = encodePairing({
        type: 'answer',
        mode: offer.mode,
        sessionId: offer.sessionId,
        sdp,
      });
      this.log(`Antwort-QR erzeugt, ${code.length} Zeichen`);
      // Der Kanal kann schon offen sein, wenn die Sammlung lange gedauert hat.
      if (this.pending?.peer === peer) {
        this.setPairing({ phase: 'show-answer', mode: offer.mode, code });
      }
    } catch (e) {
      if (token === this.pairingToken) this.failPairing(toSyncErrorCode(e));
    }
  }

  // ============== TRENNEN ==============

  /** Master kickt einen einzelnen Partner, der keinen Verlust-Hinweis sehen soll. */
  kickPeer(id: string): void {
    const peer = this.peers.find((p) => p.id === id);
    if (!peer) return;
    this.sendTo(peer, packMessage(MSG_BYE, new Uint8Array(0)));
    this.removePeer(peer, 'kicked');
  }

  /** Trennt alle Verbindungen bewusst. Lokale Daten bleiben in IndexedDB. */
  disconnect(): void {
    this.pairingToken += 1;
    this.dropPending();
    const peers = this.peers;
    this.peers = [];
    for (const peer of peers) {
      this.sendTo(peer, packMessage(MSG_BYE, new Uint8Array(0)));
      this.closePeerTransport(peer, true);
    }
    this.error = null;
    this.known = null;
    clearLastSession();
    this.log('Sync bewusst beendet');
    this.resetRoleIfUnused();
    this.emitStatus();
  }

  // ============== DIAGNOSE ==============

  /** Technischer Bericht für den Support. Enthält keine Bestell- oder Umsatzdaten. */
  async getDiagnostics(): Promise<string> {
    const lines = [
      `App: ${__APP_VERSION__}`,
      `Browser: ${navigator.userAgent}`,
      `Rolle: ${this.role ?? 'keine'}`,
      `Dokumentgröße: ${Y.encodeStateAsUpdate(this.ydoc).length} Byte`,
      `Bekannte Geräte: ${this.known?.remotePeers.map((p) => p.deviceName).join(', ') || 'keine'}`,
      '',
    ];
    for (const peer of this.peers) {
      lines.push(
        `Partner ${peer.remoteDeviceName ?? peer.id} (${peer.channel}, App ${peer.remoteAppVersion ?? '?'}):`,
        `  Status ${peer.pc.connectionState}, Kanal ${peer.dc?.readyState ?? '-'}, zuletzt gehört vor ${Math.round((Date.now() - peer.lastSeen) / 1000)} s`,
        `  Verbindungsweg: ${await describeRoute(peer.pc)}`,
      );
    }
    lines.push('', 'Protokoll:', ...this.logLines);
    return lines.join('\n');
  }
}

/** Liest aus den WebRTC-Statistiken, wie die Verbindung tatsächlich läuft. */
async function describeRoute(pc: RTCPeerConnection): Promise<string> {
  try {
    const stats = await pc.getStats();
    let route = 'unbekannt';
    stats.forEach((report) => {
      if (report.type !== 'candidate-pair' || !report.nominated) return;
      const local = stats.get(report.localCandidateId);
      const remote = stats.get(report.remoteCandidateId);
      route = `${local?.candidateType ?? '?'} ↔ ${remote?.candidateType ?? '?'}, ${report.currentRoundTripTime ? Math.round(report.currentRoundTripTime * 1000) + ' ms' : 'keine Laufzeit'}`;
    });
    return route;
  } catch {
    return 'nicht verfügbar';
  }
}
