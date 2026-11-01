import type { Drink, PfandType } from './types';
import { parseConfig } from './configIO';

const STORAGE_KEY = 'bierwagen-kasse:config:v1';

type StoredShape = {
  version: 1;
  pfandTypes: PfandType[];
  drinks: Drink[];
};

const isAvailable = (): boolean => {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return false;
    const probe = '__bk_probe__';
    window.localStorage.setItem(probe, probe);
    window.localStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
};

export function loadStoredConfig(): {
  pfandTypes: PfandType[];
  drinks: Drink[];
} | null {
  if (!isAvailable()) return null;
  let raw: string | null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
  if (!raw) return null;
  const result = parseConfig(raw);
  if (!result.ok) return null;
  return { pfandTypes: result.pfandTypes, drinks: result.drinks };
}

export function saveStoredConfig(
  pfandTypes: PfandType[],
  drinks: Drink[],
): void {
  if (!isAvailable()) return;
  const data: StoredShape = { version: 1, pfandTypes, drinks };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* quota exceeded or other error — silently ignore */
  }
}

export function clearStoredConfig(): void {
  if (!isAvailable()) return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* noop */
  }
}

export function hasStoredConfig(): boolean {
  if (!isAvailable()) return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) !== null;
  } catch {
    return false;
  }
}
