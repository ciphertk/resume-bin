/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{ts,tsx,html}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        rb: {
          bg:           'hsl(var(--rb-bg) / <alpha-value>)',
          surface:      'hsl(var(--rb-surface) / <alpha-value>)',
          surface2:     'hsl(var(--rb-surface2) / <alpha-value>)',
          surface3:     'hsl(var(--rb-surface3) / <alpha-value>)',
          border:       'hsl(var(--rb-border) / <alpha-value>)',
          border2:      'hsl(var(--rb-border2) / <alpha-value>)',
          text:         'hsl(var(--rb-text) / <alpha-value>)',
          muted:        'hsl(var(--rb-muted) / <alpha-value>)',
          dim:          'hsl(var(--rb-dim) / <alpha-value>)',
          accent:       'hsl(var(--rb-accent) / <alpha-value>)',
          'accent-soft':'hsl(var(--rb-accent-soft) / <alpha-value>)',
          'accent-ink': 'hsl(var(--rb-accent-ink) / <alpha-value>)',
        },
      },
      fontFamily: {
        sans:    ["'Geist Mono'", 'ui-monospace', 'monospace'],
        mono:    ["'JetBrains Mono'", 'ui-monospace', 'monospace'],
        display: ["'Instrument Serif'", 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
};
