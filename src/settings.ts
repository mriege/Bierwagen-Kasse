export type Lang = 'de' | 'en' | 'fr' | 'it';
export type Theme = 'system' | 'dark' | 'light';

export type AppSettings = {
  version: 1;
  features: {
    trinkgeld: boolean;
    tagesbilanz: boolean;
    bestand: boolean;
  };
  language: Lang;
  theme: Theme;
  /** Töne bei Eingaben. */
  sound: boolean;
  /** Bildschirm bleibt an, solange die App sichtbar ist. Schützt auch die Sync-Verbindung. */
  keepAwake: boolean;
  cashStartCents: number;
  /** Stabile UUID pro Gerät — wird einmalig beim ersten Start erzeugt. */
  deviceId: string;
  /** User-editierbarer Anzeige-Name (z.B. "Theke", "Hilfsstand").
   *  Wird in der Tagesbilanz pro Eintrag und beim Sync-Pairing gezeigt. */
  deviceName: string;
  /** Wenn true: dieses Gerät läuft als reines Kundendisplay — zeigt nur die
   *  aktuelle Bestellung des gepairten Kassen-Geräts, kein Bedien-UI. */
  displayMode: boolean;
};

/** Lokale Einstellungen — bleiben pro Gerät unabhängig (auch bei aktiver Sync). */
export type LocalSettings = {
  version: 1;
  language: Lang;
  theme: Theme;
  sound: boolean;
  keepAwake: boolean;
  deviceId: string;
  deviceName: string;
  displayMode: boolean;
};

/** Geteilte Einstellungen — werden bei aktiver Sync zwischen Geräten synchronisiert. */
export type SharedSettings = {
  version: 1;
  features: {
    trinkgeld: boolean;
    tagesbilanz: boolean;
    bestand: boolean;
  };
  cashStartCents: number;
};

/** Erzeugt einen UUID v4 (mit Fallback). */
function generateDeviceId(): string {
  const c =
    typeof globalThis !== 'undefined' &&
    (globalThis as unknown as { crypto?: Crypto }).crypto
      ? ((globalThis as unknown as { crypto: Crypto }).crypto as Crypto & {
          randomUUID?: () => string;
        })
      : null;
  if (c && typeof c.randomUUID === 'function') return c.randomUUID();
  const bytes = new Uint8Array(16);
  if (c && typeof c.getRandomValues === 'function') c.getRandomValues(bytes);
  else for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/** Default-Anzeigename auf Basis der deviceId (erste 4 Hex-Zeichen). */
function defaultDeviceName(id: string): string {
  const suffix = id.replace(/-/g, '').slice(0, 4).toUpperCase();
  return `Gerät ${suffix}`;
}

export const DEFAULT_SETTINGS: AppSettings = {
  version: 1,
  features: {
    trinkgeld: false,
    tagesbilanz: false,
    bestand: false,
  },
  language: 'de',
  theme: 'system',
  sound: true,
  keepAwake: true,
  cashStartCents: 0,
  // Werden in loadSettings() überschrieben — DEFAULT bleibt hier nur als Schema.
  deviceId: '',
  deviceName: '',
  displayMode: false,
};

export const DEFAULT_SHARED_SETTINGS: SharedSettings = {
  version: 1,
  features: { ...DEFAULT_SETTINGS.features },
  cashStartCents: DEFAULT_SETTINGS.cashStartCents,
};

const KEY = 'bierwagen-kasse:settings:v1';

const isAvailable = (): boolean => {
  try {
    return typeof window !== 'undefined' && !!window.localStorage;
  } catch {
    return false;
  }
};

/**
 * Lädt die Einstellungen. Bestehende Installationen behalten ihren gespeicherten
 * Stand, neue Felder bekommen den Standardwert.
 */
export function loadSettings(): AppSettings {
  const fallbackId = generateDeviceId();
  const fallbackSettings: AppSettings = {
    ...DEFAULT_SETTINGS,
    deviceId: fallbackId,
    deviceName: defaultDeviceName(fallbackId),
  };

  if (!isAvailable()) return fallbackSettings;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) {
      // Sofort speichern: Die Geräte-ID muss über den ersten Start hinaus stabil sein.
      saveSettings(fallbackSettings);
      return fallbackSettings;
    }
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.version !== 1) return fallbackSettings;
    const merged: AppSettings = {
      ...DEFAULT_SETTINGS,
      ...parsed,
      features: {
        ...DEFAULT_SETTINGS.features,
        ...(parsed.features || {}),
      },
      // Falls Geräte-ID/Name fehlen (Migration von älterer Version): generieren.
      deviceId:
        typeof parsed.deviceId === 'string' && parsed.deviceId.length > 0
          ? parsed.deviceId
          : fallbackId,
      deviceName:
        typeof parsed.deviceName === 'string' && parsed.deviceName.length > 0
          ? parsed.deviceName
          : defaultDeviceName(parsed.deviceId || fallbackId),
      displayMode:
        typeof parsed.displayMode === 'boolean' ? parsed.displayMode : false,
    };
    return merged;
  } catch {
    return fallbackSettings;
  }
}

export function saveSettings(settings: AppSettings): void {
  if (!isAvailable()) return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(settings));
  } catch {
    /* ignore quota */
  }
}

export function clearSettings(): void {
  if (!isAvailable()) return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

/** Trennt ein vereinheitlichtes AppSettings in lokal vs. geteilt. */
export function splitSettings(settings: AppSettings): {
  local: LocalSettings;
  shared: SharedSettings;
} {
  return {
    local: {
      version: 1,
      language: settings.language,
      theme: settings.theme,
      sound: settings.sound,
      keepAwake: settings.keepAwake,
      deviceId: settings.deviceId,
      deviceName: settings.deviceName,
      displayMode: settings.displayMode,
    },
    shared: {
      version: 1,
      features: { ...settings.features },
      cashStartCents: settings.cashStartCents,
    },
  };
}

/** Setzt LocalSettings + SharedSettings wieder zu einem AppSettings zusammen. */
export function mergeSettings(
  local: LocalSettings,
  shared: SharedSettings,
): AppSettings {
  return {
    version: 1,
    language: local.language,
    theme: local.theme,
    sound: local.sound,
    keepAwake: local.keepAwake,
    deviceId: local.deviceId,
    deviceName: local.deviceName,
    displayMode: local.displayMode,
    features: { ...shared.features },
    cashStartCents: shared.cashStartCents,
  };
}

const darkQuery = (): MediaQueryList | null =>
  typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-color-scheme: dark)')
    : null;

/** Setzt das Farbschema auf <html>, inklusive Farbe der Browser-Leiste. */
export function applyTheme(theme: Theme): void {
  const resolved =
    theme === 'system' ? (darkQuery()?.matches === false ? 'light' : 'dark') : theme;
  document.documentElement.dataset.theme = resolved;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', resolved === 'dark' ? '#120f0e' : '#f5f1ea');
}

/** Folgt dem System, solange `theme` auf 'system' steht. Liefert die Abmeldung. */
export function watchSystemTheme(theme: Theme): () => void {
  applyTheme(theme);
  const query = darkQuery();
  if (theme !== 'system' || !query) return () => {};
  const onChange = () => applyTheme('system');
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}
