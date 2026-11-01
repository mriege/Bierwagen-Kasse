import { useEffect, useRef, useState } from 'react';
import { CameraOff, ClipboardPaste } from 'lucide-react';
import jsQR from 'jsqr';
import { Sheet } from './Sheet';
import { useT } from '../i18n';
import type { TranslationKey } from '../i18n/translations';

type Props = {
  open: boolean;
  onClose: () => void;
  /** Wird mit dem rohen QR-Inhalt gerufen, sobald ein Code erkannt wurde. */
  onResult: (value: string) => void;
  /** Überschrift des Sheets. */
  title: string;
};

type NativeDetector = {
  detect: (src: HTMLVideoElement) => Promise<Array<{ rawValue: string }>>;
};
type NativeDetectorClass = {
  new (opts: { formats: string[] }): NativeDetector;
  getSupportedFormats?: () => Promise<string[]>;
};

/** jsQR läuft im Hauptthread: gedrosselt und auf einen Ausschnitt begrenzt. */
const JSQR_INTERVAL_MS = 120;
const JSQR_MAX_SIDE = 900;

async function createNativeDetector(): Promise<NativeDetector | null> {
  const Detector = (window as unknown as { BarcodeDetector?: NativeDetectorClass })
    .BarcodeDetector;
  if (!Detector) return null;
  try {
    const formats = await Detector.getSupportedFormats?.();
    if (formats && !formats.includes('qr_code')) return null;
    return new Detector({ formats: ['qr_code'] });
  } catch {
    return null;
  }
}

function cameraErrorKey(e: unknown): TranslationKey {
  const name = e instanceof Error ? e.name : '';
  if (name === 'NotAllowedError' || name === 'SecurityError') return 'scanner.errDenied';
  if (name === 'NotFoundError' || name === 'OverconstrainedError') return 'scanner.errNoCamera';
  return 'scanner.errGeneric';
}

/**
 * QR-Scanner mit Rückkamera. Nutzt die native `BarcodeDetector`-API, wo sie Codes
 * wirklich unterstützt, sonst jsQR. Geht die Kamera gar nicht, lässt sich der Code
 * am anderen Gerät kopieren und hier einfügen.
 */
export function QrScanner({ open, onClose, onResult, title }: Props) {
  const t = useT();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // In einem Ref, damit neue Eltern-Renders die Kamera nicht neu starten.
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;
  const [errorKey, setErrorKey] = useState<TranslationKey | null>(null);
  const [pasted, setPasted] = useState('');

  useEffect(() => {
    if (!open) return;
    setErrorKey(null);
    setPasted('');

    let stopped = false;
    let raf: number | null = null;
    let stream: MediaStream | null = null;

    const stop = () => {
      stopped = true;
      if (raf !== null) cancelAnimationFrame(raf);
      stream?.getTracks().forEach((track) => track.stop());
    };

    const start = async () => {
      try {
        // Ohne Wunschauflösung liefern viele Geräte nur 640 × 480: zu wenig für
        // einen QR-Code auf einem Display in üblichem Abstand.
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        });
        if (stopped) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        await video.play();

        let detector = await createNativeDetector();
        let lastJsQrAt = 0;

        const tick = async (now: number) => {
          if (stopped) return;
          const v = videoRef.current;
          if (v && v.readyState >= 2) {
            try {
              const found = detector
                ? (await detector.detect(v))[0]?.rawValue
                : now - lastJsQrAt >= JSQR_INTERVAL_MS
                  ? ((lastJsQrAt = now), scanWithJsQr(v, canvasRef.current))
                  : null;
              if (found && !stopped) {
                stop();
                onResultRef.current(found);
                return;
              }
            } catch {
              // Native Erkennung kann auf manchen Geräten dauerhaft scheitern.
              detector = null;
            }
          }
          raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      } catch (e) {
        if (!stopped) setErrorKey(cameraErrorKey(e));
      }
    };

    void start();
    return stop;
  }, [open]);

  const submitPasted = () => {
    const value = pasted.replace(/[\r\n\t]/g, '');
    if (value.length > 0) onResult(value);
  };

  return (
    <Sheet open={open} onClose={onClose} title={title} width="28rem">
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-black">
        <video
          ref={videoRef}
          playsInline
          muted
          className="h-full w-full object-cover"
          aria-hidden="true"
        />
        <canvas ref={canvasRef} className="hidden" />
        <div
          className="pointer-events-none absolute inset-6 rounded-2xl ring-2 ring-accent-line-line"
          aria-hidden="true"
        />
      </div>
      {errorKey ? (
        <div className="mt-3 flex items-start gap-2 rounded-xl bg-negative-soft p-3 text-sm text-ink">
          <CameraOff className="mt-0.5 h-5 w-5 shrink-0 text-negative-ink" aria-hidden="true" />
          <span>{t(errorKey)}</span>
        </div>
      ) : (
        <p className="mt-3 text-center text-sm text-ink-mute">{t('scanner.hint')}</p>
      )}
      <details className="mt-3 rounded-xl bg-canvas" open={errorKey !== null}>
        <summary className="tap flex cursor-pointer list-none items-center gap-2 px-3 text-sm font-medium text-ink-soft">
          <ClipboardPaste className="h-4 w-4" aria-hidden="true" />
          {t('scanner.pasteLabel')}
        </summary>
        <div className="flex flex-col gap-2 px-3 pb-3">
          <p className="text-sm text-ink-mute">{t('scanner.pasteHint')}</p>
          <textarea
            value={pasted}
            onChange={(e) => setPasted(e.target.value)}
            rows={3}
            className="w-full rounded-lg bg-raised p-2 font-mono text-xs text-ink focus:outline-none focus:ring-2 focus:ring-accent-line"
            aria-label={t('scanner.pasteLabel')}
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
          />
          <button
            onClick={submitPasted}
            disabled={pasted.trim().length === 0}
            className="tap rounded-xl bg-accent px-4 font-bold text-on-accent active:bg-accent-press disabled:bg-raised disabled:text-ink-mute"
          >
            {t('scanner.pasteSubmit')}
          </button>
        </div>
      </details>
    </Sheet>
  );
}

function scanWithJsQr(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement | null,
): string | null {
  const w = video.videoWidth;
  const h = video.videoHeight;
  if (!canvas || w === 0 || h === 0) return null;
  const crop = Math.min(w, h);
  const side = Math.min(crop, JSQR_MAX_SIDE);
  canvas.width = side;
  canvas.height = side;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(video, (w - crop) / 2, (h - crop) / 2, crop, crop, 0, 0, side, side);
  const image = ctx.getImageData(0, 0, side, side);
  return jsQR(image.data, side, side, { inversionAttempts: 'dontInvert' })?.data ?? null;
}
