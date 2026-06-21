/**
 * File: tailwind.config.ts
 * Purpose: Design-token source of truth for Project Zenith.
 *
 * Design language — "Celestial Intelligence":
 *  - Base is a deep space void; panels are layered glass over it.
 *  - One luminous accent (aurora teal) carries "good / live / favorable".
 *  - A periwinkle signal blue carries orbital paths and interactive links.
 *  - Amber ember is reserved for caution (cloud cover, meteor windows).
 *
 * Every color is exposed as a CSS variable in globals.css so runtime theming
 * (e.g. a future light/observatory "red-light" mode) is a variable swap, not a
 * class rewrite.
 */
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        void: 'hsl(var(--void) / <alpha-value>)',
        abyss: 'hsl(var(--abyss) / <alpha-value>)',
        nebula: 'hsl(var(--nebula) / <alpha-value>)',
        frost: 'hsl(var(--frost) / <alpha-value>)',
        haze: 'hsl(var(--haze) / <alpha-value>)',
        aurora: 'hsl(var(--aurora) / <alpha-value>)',
        signal: 'hsl(var(--signal) / <alpha-value>)',
        ember: 'hsl(var(--ember) / <alpha-value>)',
        hairline: 'hsl(var(--hairline) / <alpha-value>)',
      },
      fontFamily: {
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        sans: ['var(--font-body)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      letterSpacing: {
        eyebrow: '0.22em',
      },
      borderRadius: {
        panel: '20px',
      },
      backgroundImage: {
        'glass-sheen':
          'linear-gradient(180deg, hsl(var(--frost) / 0.06) 0%, hsl(var(--frost) / 0) 40%)',
        'aurora-glow':
          'radial-gradient(120% 120% at 50% 0%, hsl(var(--aurora) / 0.18), transparent 60%)',
      },
      boxShadow: {
        panel: '0 24px 60px -24px hsl(var(--void) / 0.9), inset 0 1px 0 hsl(var(--frost) / 0.05)',
        glow: '0 0 0 1px hsl(var(--aurora) / 0.35), 0 0 32px hsl(var(--aurora) / 0.25)',
      },
      keyframes: {
        'radar-sweep': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        twinkle: {
          '0%, 100%': { opacity: '0.2' },
          '50%': { opacity: '1' },
        },
      },
      animation: {
        'radar-sweep': 'radar-sweep 6s linear infinite',
        twinkle: 'twinkle 4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
