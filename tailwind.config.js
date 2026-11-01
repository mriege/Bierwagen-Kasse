const token = (name) => `rgb(var(--${name}) / <alpha-value>)`;

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    // Bewusst nur semantische Farben: Eine Farbe bedeutet überall dasselbe und
    // hat für Hell und Dunkel jeweils eigene Werte (siehe index.css).
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      white: '#ffffff',
      black: '#000000',
      canvas: token('canvas'),
      surface: token('surface'),
      raised: token('raised'),
      pressed: token('pressed'),
      line: token('line'),
      ink: token('ink'),
      'ink-soft': token('ink-soft'),
      'ink-mute': token('ink-mute'),
      accent: token('accent'),
      'accent-press': token('accent-press'),
      'accent-line': token('accent-line'),
      'accent-ink': token('accent-ink'),
      'accent-soft': token('accent-soft'),
      'on-accent': token('on-accent'),
      positive: token('positive'),
      'positive-ink': token('positive-ink'),
      'positive-soft': token('positive-soft'),
      negative: token('negative'),
      'negative-ink': token('negative-ink'),
      'negative-soft': token('negative-soft'),
      promo: token('promo'),
      'promo-ink': token('promo-ink'),
      'promo-soft': token('promo-soft'),
      'on-solid': token('on-solid'),
    },
    extend: {
      screens: {
        // Breites Layout hängt am verfügbaren Platz, nicht am Gerätetyp:
        // Tablet quer ebenso wie ein Handy im Querformat.
        regular: { raw: '(min-width: 1024px), (min-width: 600px) and (max-height: 520px)' },
      },
      keyframes: {
        pour: {
          '0%': { transform: 'scaleY(0)', opacity: '1' },
          '60%': { transform: 'scaleY(1)', opacity: '1' },
          '100%': { transform: 'scaleY(1)', opacity: '0' },
        },
        'toast-in': {
          from: { transform: 'translateY(12px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
      },
      animation: {
        pour: 'pour 620ms cubic-bezier(0.2, 0.8, 0.2, 1) both',
        'toast-in': 'toast-in 200ms ease-out both',
      },
    },
  },
  plugins: [],
};
