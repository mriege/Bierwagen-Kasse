import {
  BookOpen,
  Package,
  RadioTower,
  Settings2,
  ShoppingCart,
  type LucideIcon,
} from 'lucide-react';
import { useT } from '../i18n';
import type { TranslationKey } from '../i18n/translations';
import type { PeerStatus } from '../sync/webrtc';
import { syncTone, type SyncTone } from './SyncIndicators';

export type Tab = 'order' | 'bilanz' | 'sortiment' | 'devices' | 'settings';

const TABS: Array<{ id: Tab; label: TranslationKey; icon: LucideIcon }> = [
  { id: 'order', label: 'nav.order', icon: ShoppingCart },
  { id: 'bilanz', label: 'nav.bilanz', icon: BookOpen },
  { id: 'sortiment', label: 'nav.sortiment', icon: Package },
  { id: 'devices', label: 'nav.devices', icon: RadioTower },
  { id: 'settings', label: 'nav.settings', icon: Settings2 },
];

const DOT: Record<SyncTone, string> = {
  none: '',
  ok: 'bg-positive-ink',
  busy: 'bg-accent',
  problem: 'bg-negative-ink',
};

type Props = {
  tab: Tab;
  onChange: (tab: Tab) => void;
  syncStatus: PeerStatus;
};

/** Zustandspunkt am Geräte-Tab. Die Form ergänzt die Farbe, damit Farbe nicht allein trägt. */
function SyncDot({ status }: { status: PeerStatus }) {
  const tone = syncTone(status);
  if (tone === 'none') return null;
  return (
    <span
      className={`absolute -right-1 -top-1 h-2.5 w-2.5 ring-2 ring-surface ${DOT[tone]} ${
        tone === 'problem' ? 'rotate-45 rounded-[2px]' : 'rounded-full'
      }`}
      aria-hidden="true"
    />
  );
}

/** Tab-Leiste unten für schmale Layouts: mit dem Daumen erreichbar. */
export function BottomTabBar({ tab, onChange, syncStatus }: Props) {
  const t = useT();
  return (
    <nav
      className="pb-safe flex shrink-0 border-t border-line bg-surface regular:hidden"
      aria-label={t('nav.label')}
    >
      {TABS.map(({ id, label, icon: Icon }) => {
        const active = tab === id;
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            aria-current={active ? 'page' : undefined}
            className={`flex min-h-[3.25rem] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-0.5 ${
              active ? 'text-accent-ink' : 'text-ink-mute'
            }`}
          >
            <span className="relative">
              <Icon className="h-6 w-6" strokeWidth={active ? 2.4 : 1.8} />
              {id === 'devices' && <SyncDot status={syncStatus} />}
            </span>
            <span className="w-full truncate text-center text-[0.6875rem] font-medium leading-tight">
              {t(label)}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

/** Tab-Leiste oben für breite Layouts, wie auf dem iPad. */
export function TopTabBar({ tab, onChange, syncStatus }: Props) {
  const t = useT();
  return (
    <nav
      className="hidden min-w-0 gap-1 rounded-xl bg-surface p-1 regular:flex"
      aria-label={t('nav.label')}
    >
      {TABS.map(({ id, label, icon: Icon }) => {
        const active = tab === id;
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            aria-current={active ? 'page' : undefined}
            aria-label={t(label)}
            className={`tap flex items-center justify-center gap-2 rounded-lg px-2.5 text-sm font-semibold transition-colors lg:px-3.5 ${
              active ? 'bg-raised text-accent-ink' : 'text-ink-soft active:bg-raised'
            }`}
          >
            <span className="relative">
              <Icon className="h-5 w-5" strokeWidth={active ? 2.4 : 1.8} />
              {id === 'devices' && <SyncDot status={syncStatus} />}
            </span>
            <span className={active ? '' : 'hidden lg:inline'}>{t(label)}</span>
          </button>
        );
      })}
    </nav>
  );
}
