import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import { applyTheme, loadSettings } from './settings';

/**
 * Übernimmt die iOS-Textgröße (Dynamic Type), denn Safari gibt sie nur über diese
 * Systemschrift preis. Auf 22 px begrenzt: Bis dahin bleibt die Kasse bedienbar,
 * darüber hilft Pinch-Zoom. Andere Browser skalieren die rem-Basis selbst.
 */
function applyDynamicType(): void {
  if (!CSS.supports('font', '-apple-system-body')) return;
  const probe = document.createElement('span');
  probe.style.font = '-apple-system-body';
  document.body.append(probe);
  const systemPx = parseFloat(getComputedStyle(probe).fontSize);
  probe.remove();
  if (!Number.isFinite(systemPx)) return;
  const rootPx = Math.min(22, Math.max(16, (systemPx / 17) * 16));
  document.documentElement.style.fontSize = `${rootPx}px`;
}

applyTheme(loadSettings().theme);
applyDynamicType();
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') applyDynamicType();
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/app/sw.js', { scope: '/app/' })
      .catch((err) => {
        console.warn('Service Worker registration failed:', err);
      });
  });
}
