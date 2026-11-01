const eurFormatter = new Intl.NumberFormat('de-DE', {
  style: 'currency',
  currency: 'EUR',
});

export const formatEUR = (cents: number): string => eurFormatter.format(cents / 100);

export const parseEURToCents = (input: string): number => {
  const normalized = input.trim().replace(/\s/g, '').replace(/€/g, '').replace(',', '.');
  if (normalized === '' || normalized === '-') return 0;
  const value = Number(normalized);
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * 100);
};

export const centsToInputString = (cents: number): string =>
  (cents / 100).toFixed(2).replace('.', ',');

export const generateId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
};

export const minutesToTimeString = (minutes: number): string => {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

export const timeStringToMinutes = (s: string): number | null => {
  const m = s.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const h = Number(m[1]);
  const mm = Number(m[2]);
  if (h < 0 || h > 23 || mm < 0 || mm > 59) return null;
  return h * 60 + mm;
};

export const currentMinutes = (now: Date = new Date()): number =>
  now.getHours() * 60 + now.getMinutes();
