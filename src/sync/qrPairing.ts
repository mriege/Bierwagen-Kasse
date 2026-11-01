import pako from 'pako';
import { SyncError } from './errors';

/**
 * QR-Pairing-Format (v3).
 *
 * Ein QR-Code wird umso schwerer lesbar, je mehr Module er hat. Darum wird das
 * SDP so klein wie möglich gemacht:
 *   1. Überflüssige Zeilen und Candidate-Attribute entfernen (`minifySdp`).
 *   2. Mit Wörterbuch komprimieren: SDP-Bausteine kosten dann fast nichts.
 *   3. Base45 statt Base64: passt in den Alphanumerik-Modus des QR-Codes,
 *      der nur 5,5 statt 8 Bit pro Zeichen braucht.
 *
 * Aufbau: `BK3:` + Base45([flags][8 Byte Session][32 Byte Fingerprint?][deflate]) + `:`
 * Das abschließende `:` schützt ein eventuelles Leerzeichen am Ende, weil
 * Leerzeichen zum Base45-Alphabet gehören und beim Einfügen sonst verloren gingen.
 */

const PREFIX = 'BK3:';
const SUFFIX = ':';
/** Präfix der Vorgängerversionen (Base64 von 'B' + Version). */
const LEGACY_V1 = 'QgE';
const LEGACY_V2 = 'QgI';

const FLAG_ANSWER = 0b001;
const FLAG_DISPLAY = 0b010;
const FLAG_FINGERPRINT = 0b100;

const SESSION_BYTES = 8;
const FINGERPRINT_BYTES = 32;
const FINGERPRINT_LINE = 'a=fingerprint:sha-256 ';

export type PairingType = 'offer' | 'answer';
export type PairingMode = 'sync' | 'display';

export type PairingPayload = {
  type: PairingType;
  mode: PairingMode;
  sessionId: string;
  sdp: string;
};

const BASE45 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:';

function encodeBase45(bytes: Uint8Array): string {
  let out = '';
  for (let i = 0; i < bytes.length; i += 2) {
    if (i + 1 < bytes.length) {
      let n = bytes[i] * 256 + bytes[i + 1];
      const c = n % 45;
      n = (n - c) / 45;
      const d = n % 45;
      const e = (n - d) / 45;
      out += BASE45[c] + BASE45[d] + BASE45[e];
    } else {
      const n = bytes[i];
      const c = n % 45;
      const d = (n - c) / 45;
      out += BASE45[c] + BASE45[d];
    }
  }
  return out;
}

function decodeBase45(text: string): Uint8Array {
  const out: number[] = [];
  for (let i = 0; i < text.length; i += 3) {
    const c = BASE45.indexOf(text[i]);
    const d = BASE45.indexOf(text[i + 1]);
    if (c < 0 || d < 0) throw new SyncError('qr-invalid');
    if (i + 2 < text.length) {
      const e = BASE45.indexOf(text[i + 2]);
      if (e < 0) throw new SyncError('qr-invalid');
      const n = c + d * 45 + e * 45 * 45;
      if (n > 0xffff) throw new SyncError('qr-invalid');
      out.push(n >> 8, n & 0xff);
    } else {
      const n = c + d * 45;
      if (n > 0xff) throw new SyncError('qr-invalid');
      out.push(n);
    }
  }
  return Uint8Array.from(out);
}

/**
 * Wörterbuch für deflate. Häufige Bausteine stehen am Ende, weil kurze Distanzen
 * billiger sind. ACHTUNG: Teil des Formats. Änderungen brauchen eine neue Version.
 */
const SDP_DICTIONARY = new TextEncoder().encode(
  'a=end-of-candidates\r\na=sendrecv\r\na=msid-semantic:WMS *\r\n' +
    'a=setup:passive\r\na=setup:active\r\na=setup:actpass\r\n' +
    'a=max-message-size:1073741823\r\na=max-message-size:262144\r\n' +
    'a=ice-options:trickle\r\na=sctp-port:5000\r\na=mid:0\r\n' +
    'a=group:BUNDLE 0\r\nc=IN IP4 0.0.0.0\r\n' +
    'm=application 9 UDP/DTLS/SCTP webrtc-datachannel\r\n' +
    'v=0\r\no=- 0 0 IN IP4 0.0.0.0\r\ns=-\r\nt=0 0\r\n' +
    FINGERPRINT_LINE +
    '\r\na=ice-pwd:\r\na=ice-ufrag:\r\n' +
    ' raddr :: rport 0\r\n raddr 0.0.0.0 rport 0\r\n typ relay typ prflx' +
    ' typ srflx typ host\r\n.local 1 udp 16777 1 udp 21139 1 UDP 21222 1 UDP 16860' +
    '\r\na=candidate:',
);

/** Zeilen ohne Bedeutung für eine reine DataChannel-Verbindung. */
const DROP_LINE = /^a=(extmap-allow-mixed|msid-semantic|sendrecv|end-of-candidates)\b/;
/** Optionale Candidate-Erweiterungen, die nur Platz kosten. */
const CANDIDATE_TAIL =
  /( generation \d+| ufrag \S+| network-id \d+| network-cost \d+)/g;

/**
 * Verkleinert ein SDP, ohne etwas Wesentliches zu entfernen. TCP-Candidates
 * (tcptype active, Port 9) sind ohne TURN-TCP nutzlos und fliegen ebenfalls raus.
 */
export function minifySdp(sdp: string): string {
  let foundation = 0;
  const lines: string[] = [];
  for (const raw of sdp.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || DROP_LINE.test(line)) continue;
    if (line.startsWith('o=')) {
      lines.push('o=- 0 0 IN IP4 0.0.0.0');
      continue;
    }
    if (line.startsWith('a=candidate:')) {
      if (/ tcptype /i.test(line) || / tcp /i.test(line)) continue;
      foundation += 1;
      lines.push(
        line
          .replace(CANDIDATE_TAIL, '')
          .replace(/^a=candidate:\S+/, `a=candidate:${foundation}`),
      );
      continue;
    }
    lines.push(line);
  }
  return lines.join('\r\n') + '\r\n';
}

/** Hat das SDP mindestens einen Netzwerk-Candidate? Ohne geht keine Verbindung. */
export function hasCandidates(sdp: string): boolean {
  return /^a=candidate:/m.test(sdp);
}

function hexToBytes(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

/** Zufällige ID (16 Hex-Zeichen). Reicht als Session-Marker: Die Authentifizierung
 *  übernimmt der DTLS-Fingerprint im SDP. */
export function generateSessionId(): string {
  const bytes = new Uint8Array(SESSION_BYTES);
  const c = (globalThis as unknown as { crypto?: Crypto }).crypto;
  if (c && typeof c.getRandomValues === 'function') {
    c.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  return bytesToHex(bytes);
}

/** Packt den sha-256-Fingerprint als 32 Rohbytes, spart rund 25 Byte im QR. */
function extractFingerprint(sdp: string): { sdp: string; fingerprint: Uint8Array | null } {
  const match = sdp.match(/^a=fingerprint:sha-256 ((?:[0-9A-Fa-f]{2}:){31}[0-9A-Fa-f]{2})\r?$/m);
  if (!match) return { sdp, fingerprint: null };
  const fingerprint = hexToBytes(match[1].replace(/:/g, ''));
  return { sdp: sdp.replace(match[0].trimEnd(), FINGERPRINT_LINE.trimEnd()), fingerprint };
}

function restoreFingerprint(sdp: string, fingerprint: Uint8Array): string {
  const hex = bytesToHex(fingerprint).toUpperCase();
  const colons = hex.match(/.{2}/g)!.join(':');
  return sdp.replace(FINGERPRINT_LINE.trimEnd(), FINGERPRINT_LINE + colons);
}

/** Kodiert Pairing-Daten für den QR-Code. */
export function encodePairing(payload: PairingPayload): string {
  const { sdp, fingerprint } = extractFingerprint(minifySdp(payload.sdp));
  const compressed = pako.deflateRaw(new TextEncoder().encode(sdp), {
    level: 9,
    dictionary: SDP_DICTIONARY,
  });
  const session = hexToBytes(payload.sessionId);
  const fpLength = fingerprint ? FINGERPRINT_BYTES : 0;
  const total = new Uint8Array(1 + SESSION_BYTES + fpLength + compressed.length);
  total[0] =
    (payload.type === 'answer' ? FLAG_ANSWER : 0) |
    (payload.mode === 'display' ? FLAG_DISPLAY : 0) |
    (fingerprint ? FLAG_FINGERPRINT : 0);
  total.set(session, 1);
  if (fingerprint) total.set(fingerprint, 1 + SESSION_BYTES);
  total.set(compressed, 1 + SESSION_BYTES + fpLength);
  return PREFIX + encodeBase45(total) + SUFFIX;
}

/** Dekodiert einen QR-Inhalt. Wirft einen SyncError mit passendem Code. */
export function decodePairing(encoded: string): PairingPayload {
  // Kein trim(): Leerzeichen gehören zum Alphabet. Beim Einfügen können aber
  // Zeilenumbrüche hineingeraten.
  const text = encoded.replace(/[\r\n\t]/g, '');
  if (text.startsWith(LEGACY_V1) || text.startsWith(LEGACY_V2)) {
    throw new SyncError('qr-outdated');
  }
  if (/^BK\d+:/.test(text) && !text.startsWith(PREFIX)) {
    throw new SyncError('qr-newer');
  }
  if (!text.startsWith(PREFIX) || !text.endsWith(SUFFIX)) {
    throw new SyncError('qr-invalid');
  }
  const bytes = decodeBase45(text.slice(PREFIX.length, -SUFFIX.length));
  if (bytes.length < 1 + SESSION_BYTES + 1) throw new SyncError('qr-invalid');

  const flags = bytes[0];
  const sessionId = bytesToHex(bytes.subarray(1, 1 + SESSION_BYTES));
  const hasFingerprint = (flags & FLAG_FINGERPRINT) !== 0;
  const fpEnd = 1 + SESSION_BYTES + (hasFingerprint ? FINGERPRINT_BYTES : 0);
  if (bytes.length <= fpEnd) throw new SyncError('qr-invalid');

  let sdp: string;
  try {
    // `dictionary` fehlt nur in den Typen, pako unterstützt es bei inflateRaw.
    const options = { dictionary: SDP_DICTIONARY } as pako.InflateFunctionOptions;
    sdp = new TextDecoder().decode(pako.inflateRaw(bytes.subarray(fpEnd), options));
  } catch {
    throw new SyncError('qr-invalid');
  }
  if (!sdp.startsWith('v=0')) throw new SyncError('qr-invalid');
  if (hasFingerprint) {
    sdp = restoreFingerprint(sdp, bytes.subarray(1 + SESSION_BYTES, fpEnd));
  }
  return {
    type: flags & FLAG_ANSWER ? 'answer' : 'offer',
    mode: flags & FLAG_DISPLAY ? 'display' : 'sync',
    sessionId,
    sdp,
  };
}
