import { useEffect, useRef, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import qrcode from 'qrcode-generator';
import { useT } from '../i18n';

type Props = {
  value: string;
  /** Maximale Kantenlänge in CSS-Pixeln. Darunter nutzt der Code die volle Breite. */
  maxSize?: number;
  /** Error-Correction-Level. M ist Default — gute Balance. */
  ecc?: 'L' | 'M' | 'Q' | 'H';
};

const QUIET_ZONE_MODULES = 4;

/**
 * Rendert einen QR-Code so groß wie möglich und mit ganzzahligen Gerätepixeln pro
 * Modul. Unscharfe Kanten und kleine Module sind der häufigste Grund, warum eine
 * Handykamera einen Code auf einem Display nicht erkennt. Der Alphanumerik-Modus
 * senkt die Modulzahl deutlich, und die Ruhezone gehört zum Code selbst.
 */
export function QrCanvas({ value, maxSize = 360, ecc = 'M' }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const measure = () => setWidth(wrap.clientWidth);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(wrap);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || width === 0) return;

    const qr = qrcode(0, ecc);
    qr.addData(value, /^[0-9A-Z $%*+\-./:]+$/.test(value) ? 'Alphanumeric' : 'Byte');
    qr.make();

    const moduleCount = qr.getModuleCount();
    const dpr = window.devicePixelRatio || 1;
    const total = moduleCount + QUIET_ZONE_MODULES * 2;
    const modulePx = Math.max(1, Math.floor((Math.min(width, maxSize) * dpr) / total));
    const side = modulePx * total;

    canvas.width = side;
    canvas.height = side;
    canvas.style.width = `${side / dpr}px`;
    canvas.style.height = `${side / dpr}px`;
    canvas.dataset.modules = String(moduleCount);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, side, side);
    ctx.fillStyle = '#000000';
    const offset = QUIET_ZONE_MODULES * modulePx;
    for (let row = 0; row < moduleCount; row++) {
      for (let col = 0; col < moduleCount; col++) {
        if (qr.isDark(row, col)) {
          ctx.fillRect(offset + col * modulePx, offset + row * modulePx, modulePx, modulePx);
        }
      }
    }
  }, [value, width, maxSize, ecc]);

  return (
    <div ref={wrapRef} className="flex w-full justify-center">
      <canvas ref={canvasRef} className="rounded-lg" role="img" aria-label="QR-Code" />
    </div>
  );
}

/** QR-Code plus Kopieren: der Weg für Geräte, deren Kamera nicht mitspielt. */
export function PairingCode({ code }: { code: string }) {
  const t = useT();
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };
  return (
    <>
      <div className="flex w-full justify-center rounded-xl bg-white">
        <QrCanvas value={code} />
      </div>
      <button
        onClick={copy}
        className="tap flex items-center justify-center gap-2 rounded-xl px-3 text-sm font-medium text-ink-soft active:bg-raised"
      >
        {copied ? (
          <Check className="h-4 w-4 text-positive-ink" aria-hidden="true" />
        ) : (
          <Copy className="h-4 w-4" aria-hidden="true" />
        )}
        {copied ? t('sync.codeCopied') : t('sync.copyCode')}
      </button>
    </>
  );
}
