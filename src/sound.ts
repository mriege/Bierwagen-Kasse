type AC = AudioContext;

let ctx: AC | null = null;

const getCtx = (): AC | null => {
  if (typeof window === 'undefined') return null;
  if (ctx) return ctx;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  try {
    ctx = new Ctor();
  } catch {
    return null;
  }
  return ctx;
};

type BeepOptions = {
  freq?: number;
  duration?: number;
  volume?: number;
  type?: OscillatorType;
};

export function beep(opts: BeepOptions = {}): void {
  const c = getCtx();
  if (!c) return;
  if (c.state === 'suspended') {
    c.resume().catch(() => {});
  }
  const { freq = 880, duration = 0.06, volume = 0.18, type = 'sine' } = opts;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  const t0 = c.currentTime;
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(volume, t0 + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(gain).connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
}

export const beepAdd = () => beep({ freq: 880, duration: 0.05, volume: 0.18 });
export const beepRemove = () => beep({ freq: 360, duration: 0.06, volume: 0.18, type: 'triangle' });
export const beepLong = () => beep({ freq: 660, duration: 0.12, volume: 0.18, type: 'square' });
