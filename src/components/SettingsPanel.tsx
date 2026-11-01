import {
  ChevronRight,
  FileText,
  HandCoins,
  BookOpen,
  Lock,
  MonitorSmartphone,
  Moon,
  Package,
  Shield,
  Sun,
  Volume2,
  Zap,
} from 'lucide-react';
import type { AppSettings, Lang, Theme } from '../settings';
import { useT, LANG_OPTIONS } from '../i18n';
import { beepLong } from '../sound';
import { centsToInputString, parseEURToCents } from '../utils';

type Props = {
  settings: AppSettings;
  onChange: (next: AppSettings) => void;
  /** Wenn true: Feature-Toggles + cashStartCents sind gesperrt (Nebenkasse).
   *  Sprache & Erscheinungsbild bleiben editierbar, weil sie pro Gerät lokal sind. */
  readOnly?: boolean;
  onOpenAbout: () => void;
  onOpenPrivacy: () => void;
  onOpenImprint: () => void;
};

const SEGMENT = 'tap flex items-center justify-center gap-2 rounded-lg px-3 text-sm font-semibold transition-colors';
const SEGMENT_ON = 'bg-accent text-on-accent';
const SEGMENT_OFF = 'text-ink-soft active:bg-raised';

export function SettingsPanel({
  settings,
  onChange,
  readOnly = false,
  onOpenAbout,
  onOpenPrivacy,
  onOpenImprint,
}: Props) {
  const t = useT();

  const setFeature = (key: keyof AppSettings['features'], value: boolean) => {
    if (readOnly) return;
    onChange({
      ...settings,
      features: { ...settings.features, [key]: value },
    });
  };

  const setLanguage = (lang: Lang) => onChange({ ...settings, language: lang });
  const setTheme = (theme: Theme) => onChange({ ...settings, theme });
  const setCashStart = (cents: number) => {
    if (readOnly) return;
    onChange({ ...settings, cashStartCents: cents });
  };

  const themes: Array<{ value: Theme; label: string; icon: typeof Sun }> = [
    { value: 'system', label: t('settings.themeSystem'), icon: MonitorSmartphone },
    { value: 'light', label: t('settings.themeLight'), icon: Sun },
    { value: 'dark', label: t('settings.themeDark'), icon: Moon },
  ];

  return (
    <div className="flex flex-col gap-3">
      <section className="flex flex-col gap-3 rounded-2xl bg-surface p-4">
        <div>
          <h3 className="mb-1.5 text-sm font-medium text-ink-soft">{t('settings.theme')}</h3>
          <div className="grid grid-cols-3 gap-1 rounded-xl bg-canvas p-1">
            {themes.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setTheme(value)}
                aria-pressed={settings.theme === value}
                className={`${SEGMENT} ${settings.theme === value ? SEGMENT_ON : SEGMENT_OFF}`}
              >
                <Icon className="hidden h-4 w-4 shrink-0 min-[430px]:block" aria-hidden="true" />
                <span className="truncate">{label}</span>
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-xs text-ink-mute">{t('settings.themeHint')}</p>
        </div>
        <div>
          <h3 className="mb-1.5 text-sm font-medium text-ink-soft">{t('settings.language')}</h3>
          <div className="grid grid-cols-2 gap-1 rounded-xl bg-canvas p-1 sm:grid-cols-4">
            {LANG_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setLanguage(opt.value)}
                aria-pressed={settings.language === opt.value}
                className={`${SEGMENT} ${settings.language === opt.value ? SEGMENT_ON : SEGMENT_OFF}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-2xl bg-surface p-2">
        <Toggle
          icon={<Volume2 className="h-5 w-5 text-ink-mute" />}
          label={t('settings.sound')}
          hint={t('settings.soundHint')}
          enabled={settings.sound}
          onToggle={(v) => {
            onChange({ ...settings, sound: v });
            if (v) beepLong();
          }}
        />
        <Toggle
          icon={<Zap className="h-5 w-5 text-ink-mute" />}
          label={t('settings.keepAwake')}
          hint={t('settings.keepAwakeHint')}
          enabled={settings.keepAwake}
          onToggle={(v) => onChange({ ...settings, keepAwake: v })}
        />
      </section>

      <section className="rounded-2xl bg-surface p-2" aria-label={t('settings.features')}>
        <h3 className="px-2 pb-1 pt-2 text-sm font-medium text-ink-soft">
          {t('settings.features')}
        </h3>
        <Toggle
          icon={<HandCoins className="h-5 w-5 text-promo-ink" />}
          label={t('settings.featureTip')}
          hint={t('settings.featureTipHint')}
          enabled={settings.features.trinkgeld}
          onToggle={(v) => setFeature('trinkgeld', v)}
          disabled={readOnly}
        />
        <Toggle
          icon={<BookOpen className="h-5 w-5 text-positive-ink" />}
          label={t('settings.featureBilanz')}
          hint={t('settings.featureBilanzHint')}
          enabled={settings.features.tagesbilanz}
          onToggle={(v) => setFeature('tagesbilanz', v)}
          disabled={readOnly}
        />
        <Toggle
          icon={<Package className="h-5 w-5 text-accent-ink" />}
          label={t('settings.featureStock')}
          hint={t('settings.featureStockHint')}
          enabled={settings.features.bestand}
          onToggle={(v) => setFeature('bestand', v)}
          disabled={readOnly}
        />
        {settings.features.tagesbilanz && (
          <label className="flex items-center gap-3 rounded-xl p-2">
            <span className="min-w-0 flex-1">
              <span className="block font-semibold text-ink">{t('settings.cashStart')}</span>
              <span className="block text-sm text-ink-mute">{t('settings.cashStartHint')}</span>
            </span>
            <span className="flex shrink-0 items-center gap-1.5">
              <input
                type="text"
                inputMode="decimal"
                defaultValue={centsToInputString(settings.cashStartCents)}
                key={settings.cashStartCents}
                onBlur={(e) => setCashStart(parseEURToCents(e.target.value))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                }}
                disabled={readOnly}
                className="tap w-24 rounded-xl bg-raised px-2 text-right font-semibold tabular-nums text-ink focus:outline-none focus:ring-2 focus:ring-accent-line disabled:text-ink-mute"
              />
              <span className="font-medium text-ink-mute">€</span>
            </span>
          </label>
        )}
      </section>

      <section className="rounded-2xl bg-surface p-2" aria-label={t('settings.legal')}>
        <LinkRow icon={<Shield className="h-5 w-5 text-ink-mute" />} label={t('settings.about')} onClick={onOpenAbout} />
        <LinkRow icon={<Lock className="h-5 w-5 text-ink-mute" />} label={t('settings.privacy')} onClick={onOpenPrivacy} />
        <LinkRow icon={<FileText className="h-5 w-5 text-ink-mute" />} label={t('settings.imprint')} onClick={onOpenImprint} />
        <div className="px-2 pb-1 pt-2 text-xs tabular-nums text-ink-mute">
          {t('settings.version')} {__APP_VERSION__}
        </div>
      </section>
    </div>
  );
}

function LinkRow({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="tap flex w-full items-center gap-3 rounded-xl p-2 text-left font-medium text-ink active:bg-raised"
    >
      <span className="shrink-0" aria-hidden="true">{icon}</span>
      <span className="min-w-0 flex-1 truncate">{label}</span>
      <ChevronRight className="h-5 w-5 shrink-0 text-ink-mute" aria-hidden="true" />
    </button>
  );
}

function Toggle({
  icon,
  label,
  hint,
  enabled,
  onToggle,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  hint: string;
  enabled: boolean;
  onToggle: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      role="switch"
      aria-checked={enabled}
      aria-label={label}
      onClick={() => !disabled && onToggle(!enabled)}
      disabled={disabled}
      className={`flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors ${
        disabled ? 'cursor-not-allowed opacity-60' : 'active:bg-raised'
      }`}
    >
      <span className="shrink-0" aria-hidden="true">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold text-ink">{label}</span>
        <span className="block text-sm text-ink-mute">{hint}</span>
      </span>
      <span
        className={`flex h-7 w-12 shrink-0 items-center rounded-full p-0.5 transition-colors ${
          enabled ? 'bg-positive' : 'bg-pressed'
        }`}
        aria-hidden="true"
      >
        <span
          className={`h-6 w-6 rounded-full bg-white shadow transition-transform ${
            enabled ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </span>
    </button>
  );
}
