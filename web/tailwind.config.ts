import type { Config } from 'tailwindcss'

/**
 * I colori/spaziature sono guidati dalle CSS custom properties definite in
 * src/styles/theme.css (copiate dal prototipo di design). Qui le mappiamo su
 * utility Tailwind così da avere classi coerenti SENZA perdere il tema dinamico
 * (light/dark gestito da [data-theme] su <html>).
 */
const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: 'var(--brand)',
          600: 'var(--brand-600)',
          700: 'var(--brand-700)',
          300: 'var(--brand-300)',
          100: 'var(--brand-100)',
          soft: 'var(--brand-soft)',
        },
        cat: {
          cultura: 'var(--cat-cultura)',
          'cultura-soft': 'var(--cat-cultura-soft)',
          concerti: 'var(--cat-concerti)',
          'concerti-soft': 'var(--cat-concerti-soft)',
          mostre: 'var(--cat-mostre)',
          'mostre-soft': 'var(--cat-mostre-soft)',
          sport: 'var(--cat-sport)',
          'sport-soft': 'var(--cat-sport-soft)',
          workshop: 'var(--cat-workshop)',
          'workshop-soft': 'var(--cat-workshop-soft)',
          conferenze: 'var(--cat-conferenze)',
          'conferenze-soft': 'var(--cat-conferenze-soft)',
        },
        hype: {
          DEFAULT: 'var(--hype)',
          deep: 'var(--hype-deep)',
        },
        bg: {
          DEFAULT: 'var(--bg)',
          tint: 'var(--bg-tint)',
        },
        surface: {
          DEFAULT: 'var(--surface)',
          2: 'var(--surface-2)',
          3: 'var(--surface-3)',
        },
        border: {
          DEFAULT: 'var(--border)',
          strong: 'var(--border-strong)',
        },
        ink: {
          DEFAULT: 'var(--ink)',
          2: 'var(--ink-2)',
          3: 'var(--ink-3)',
          inv: 'var(--ink-inv)',
        },
      },
      borderRadius: {
        xs: 'var(--r-xs)',
        sm: 'var(--r-sm)',
        md: 'var(--r-md)',
        lg: 'var(--r-lg)',
        xl: 'var(--r-xl)',
        pill: 'var(--r-pill)',
      },
      spacing: {
        's-1': 'var(--s-1)',
        's-2': 'var(--s-2)',
        's-3': 'var(--s-3)',
        's-4': 'var(--s-4)',
        's-5': 'var(--s-5)',
        's-6': 'var(--s-6)',
        's-7': 'var(--s-7)',
        's-8': 'var(--s-8)',
        's-9': 'var(--s-9)',
        's-10': 'var(--s-10)',
      },
      fontFamily: {
        display: 'var(--font-display)',
        body: 'var(--font-body)',
        mono: 'var(--font-mono)',
      },
      maxWidth: {
        content: 'var(--maxw)',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
      },
      transitionTimingFunction: {
        ease: 'var(--ease)',
        'ease-back': 'var(--ease-back)',
      },
    },
  },
  plugins: [],
}

export default config
