/**
 * Drahtformat auf dem DataChannel:
 *   1 Byte Typ, danach Payload.
 *
 * Große Nachrichten werden in MSG_CHUNK zerlegt. Browser begrenzen die
 * SCTP-Nachrichtengröße (Chrome/Safari: 256 KB) und `send()` wirft darüber.
 * Eine größere Tagesbilanz wäre sonst nie angekommen.
 */

export const MSG_UPDATE = 0x01;
/** Geräte-Identität (UTF-8-JSON: { deviceId, deviceName, appVersion }). */
export const MSG_HELLO = 0x03;
/** Order-Snapshot fürs Kundendisplay (UTF-8-JSON). */
export const MSG_ORDER = 0x04;
export const MSG_PING = 0x05;
export const MSG_PONG = 0x06;
/** State-Vector: „Schick mir, was mir fehlt." */
export const MSG_SYNC_REQUEST = 0x07;
/** Antwort auf MSG_SYNC_REQUEST: Y-Update mit genau den fehlenden Daten. */
export const MSG_SYNC_REPLY = 0x08;
/** Bewusstes Trennen, damit die Gegenseite keinen Verbindungsverlust meldet. */
export const MSG_BYE = 0x09;
/** Fragment: [0x0a][msgId:u32][index:u16][total:u16][bytes …] */
export const MSG_CHUNK = 0x0a;

/** 16 KiB sind die über alle Browser hinweg sichere Größe pro Nachricht. */
export const CHUNK_PAYLOAD_BYTES = 16 * 1024;
const CHUNK_HEADER_BYTES = 9;

export function packMessage(type: number, payload: Uint8Array): ArrayBuffer {
  const buf = new ArrayBuffer(1 + payload.length);
  const view = new Uint8Array(buf);
  view[0] = type;
  view.set(payload, 1);
  return buf;
}

export function unpackMessage(data: ArrayBuffer | Uint8Array): {
  type: number;
  payload: Uint8Array;
} {
  const view = data instanceof Uint8Array ? data : new Uint8Array(data);
  return { type: view[0], payload: view.subarray(1) };
}

/** Zerlegt eine gepackte Nachricht, falls sie zu groß für einen Versand ist. */
export function splitMessage(message: ArrayBuffer, msgId: number): ArrayBuffer[] {
  if (message.byteLength <= CHUNK_PAYLOAD_BYTES) return [message];
  const bytes = new Uint8Array(message);
  const total = Math.ceil(bytes.length / CHUNK_PAYLOAD_BYTES);
  const parts: ArrayBuffer[] = [];
  for (let index = 0; index < total; index++) {
    const slice = bytes.subarray(
      index * CHUNK_PAYLOAD_BYTES,
      (index + 1) * CHUNK_PAYLOAD_BYTES,
    );
    const buf = new ArrayBuffer(CHUNK_HEADER_BYTES + slice.length);
    const view = new DataView(buf);
    view.setUint8(0, MSG_CHUNK);
    view.setUint32(1, msgId);
    view.setUint16(5, index);
    view.setUint16(7, total);
    new Uint8Array(buf).set(slice, CHUNK_HEADER_BYTES);
    parts.push(buf);
  }
  return parts;
}

/** Setzt Fragmente pro Nachrichten-ID wieder zusammen (Kanal ist geordnet). */
export class Reassembler {
  private pending = new Map<number, { parts: Uint8Array[]; received: number }>();

  /** Liefert die fertige Nachricht beim letzten Fragment, sonst null. */
  add(payload: Uint8Array): ArrayBuffer | null {
    if (payload.length < CHUNK_HEADER_BYTES - 1) return null;
    const view = new DataView(
      payload.buffer,
      payload.byteOffset,
      payload.byteLength,
    );
    const msgId = view.getUint32(0);
    const index = view.getUint16(4);
    const total = view.getUint16(6);
    if (total === 0 || index >= total) return null;

    let entry = this.pending.get(msgId);
    if (!entry) {
      entry = { parts: new Array<Uint8Array>(total), received: 0 };
      this.pending.set(msgId, entry);
    }
    if (!entry.parts[index]) entry.received += 1;
    // Kopie, weil der zugrundeliegende Puffer nur für dieses Event gilt.
    entry.parts[index] = payload.slice(CHUNK_HEADER_BYTES - 1);
    if (entry.received < total) return null;

    this.pending.delete(msgId);
    const size = entry.parts.reduce((sum, part) => sum + part.length, 0);
    const out = new Uint8Array(size);
    let offset = 0;
    for (const part of entry.parts) {
      out.set(part, offset);
      offset += part.length;
    }
    return out.buffer;
  }
}
