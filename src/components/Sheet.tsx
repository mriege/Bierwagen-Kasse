import { useEffect, useId, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { useT } from '../i18n';

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  /** Maximale Breite im breiten Layout. */
  width?: string;
  /** Text markierbar machen, z. B. für Rechtstexte. */
  selectable?: boolean;
  children: ReactNode;
  /** Bleibt unten sichtbar, auch wenn der Inhalt scrollt. */
  footer?: ReactNode;
};

const DISMISS_DISTANCE_PX = 90;

/**
 * Sheet auf Basis von <dialog>: Der Browser übernimmt Fokus-Falle, Esc und das
 * Sperren des Hintergrunds. Am Handy kommt es von unten und lässt sich am Griff
 * nach unten wegwischen. Tippen auf den Hintergrund schließt es ebenfalls.
 */
export function Sheet({
  open,
  onClose,
  title,
  subtitle,
  width,
  selectable,
  children,
  footer,
}: Props) {
  const t = useT();
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const dragStart = useRef<number | null>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const onHeaderPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === 'mouse') return;
    if ((e.target as HTMLElement).closest('button')) return;
    dragStart.current = e.clientY;
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onHeaderPointerMove = (e: React.PointerEvent) => {
    if (dragStart.current === null || !ref.current) return;
    const distance = Math.max(0, e.clientY - dragStart.current);
    ref.current.style.transform = `translateY(${distance}px)`;
  };

  const onHeaderPointerEnd = (e: React.PointerEvent) => {
    if (dragStart.current === null || !ref.current) return;
    const distance = e.clientY - dragStart.current;
    dragStart.current = null;
    ref.current.style.transform = '';
    if (distance > DISMISS_DISTANCE_PX) onClose();
  };

  return (
    <dialog
      ref={ref}
      className={`sheet ${selectable ? 'selectable' : ''}`}
      style={width ? ({ '--sheet-width': width } as React.CSSProperties) : undefined}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        // Klick auf den Dialog selbst = Klick auf den Hintergrund.
        if (e.target === ref.current) onClose();
      }}
    >
      {open && (
        <>
          <header
            className="shrink-0 touch-none px-4 pb-2 pt-2"
            onPointerDown={onHeaderPointerDown}
            onPointerMove={onHeaderPointerMove}
            onPointerUp={onHeaderPointerEnd}
            onPointerCancel={onHeaderPointerEnd}
          >
            <div
              className="mx-auto mb-1.5 h-1 w-9 rounded-full bg-pressed regular:hidden"
              aria-hidden="true"
            />
            <div className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <h2 id={titleId} className="truncate text-lg font-semibold text-ink">
                  {title}
                </h2>
                {subtitle && <p className="text-sm text-ink-mute">{subtitle}</p>}
              </div>
              <button
                onClick={onClose}
                className="tap -mr-2 flex shrink-0 items-center justify-center rounded-full text-ink-mute active:bg-raised"
                aria-label={t('modal.close')}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">{children}</div>
          {footer && (
            <div className="shrink-0 border-t border-line px-4 pb-safe-2 pt-3">
              {footer}
            </div>
          )}
          {!footer && <div className="pb-safe shrink-0" />}
        </>
      )}
    </dialog>
  );
}
