import { createContext, useContext, type ReactNode } from 'react';
import type { Lang } from '../settings';
import { de, en, fr, it, type TranslationKey, type Translations } from './translations';

const dictionaries: Record<Lang, Translations> = { de, en, fr, it };

const I18nContext = createContext<Lang>('de');

type ProviderProps = {
  lang: Lang;
  children: ReactNode;
};

export function I18nProvider({ lang, children }: ProviderProps) {
  return <I18nContext.Provider value={lang}>{children}</I18nContext.Provider>;
}

export function useT() {
  const lang = useContext(I18nContext);
  return (key: TranslationKey): string => {
    const dict = dictionaries[lang] ?? dictionaries.de;
    return dict[key] ?? dictionaries.de[key] ?? key;
  };
}

export function useLang(): Lang {
  return useContext(I18nContext);
}

export const LANG_OPTIONS: { value: Lang; label: string }[] = [
  { value: 'de', label: 'Deutsch' },
  { value: 'en', label: 'English' },
  { value: 'fr', label: 'Français' },
  { value: 'it', label: 'Italiano' },
];
