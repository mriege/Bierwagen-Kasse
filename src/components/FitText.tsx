import { useLayoutEffect, useRef, type ReactNode } from 'react';

type Props = {
  children: ReactNode;
  className?: string;
  /** Maximale Schriftgröße in px (Default: 32) */
  maxSizePx?: number;
  /** Minimale Schriftgröße in px (Default: 12) */
  minSizePx?: number;
  /** Reserve am Rand, damit nicht ganz an der Kante geschrieben wird (px) */
  paddingPx?: number;
};

/**
 * Schriftgröße passt sich automatisch an die Container-Breite an:
 * Misst die Textbreite via offscreen-DOM und schrumpft den Font, bis er passt.
 * Reagiert auf Container-Resize via ResizeObserver.
 */
export function FitText({
  children,
  className = '',
  maxSizePx = 32,
  minSizePx = 12,
  paddingPx = 4,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    const text = textRef.current;
    if (!wrap || !text) return;

    const measure = () => {
      const target = wrap.clientWidth - paddingPx;
      if (target <= 0) return;
      // Start groß, dann schrumpfen bis es passt (binäre Suche wäre schneller,
      // linear ist hier ausreichend, da maxSizePx-minSizePx ≤ ~20).
      let s = maxSizePx;
      text.style.fontSize = `${s}px`;
      while (s > minSizePx && text.scrollWidth > target) {
        s -= 1;
        text.style.fontSize = `${s}px`;
      }
    };

    measure();

    const ro = new ResizeObserver(measure);
    ro.observe(wrap);
    return () => ro.disconnect();
  });

  return (
    <div
      ref={wrapRef}
      className={`overflow-hidden ${className}`}
      style={{ minWidth: 0 }}
    >
      <span
        ref={textRef}
        style={{
          fontSize: `${maxSizePx}px`,
          whiteSpace: 'nowrap',
          display: 'inline-block',
          lineHeight: 1.1,
        }}
      >
        {children}
      </span>
    </div>
  );
}
