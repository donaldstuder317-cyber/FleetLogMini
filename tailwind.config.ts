import type { Config } from 'tailwindcss';

// Design tokens come from docs/style-guide.md — never use raw hex in components.
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#070B14',
        surface: '#0E1524',
        raised: '#152036',
        sunken: '#0A101C',
        line: '#24314A',
        ink: '#E8EEF8',
        muted: '#8A9AB5',
        accent: { DEFAULT: '#2E8BFF', strong: '#1F6FE5', soft: '#7DB6FF' },
        good: '#34D399',
        warn: '#FBBF24',
        danger: '#F87171',
      },
      fontFamily: {
        sans: ['"Inter Variable"', 'Inter', 'system-ui', 'sans-serif'],
        display: ['"Barlow Semi Condensed"', 'Inter', 'sans-serif'],
      },
      boxShadow: { lip: 'inset 0 -3px 0 rgb(0 0 0 / 0.35)' },
      borderRadius: { xl: '0.75rem' },
      keyframes: {
        'slide-in': {
          from: { opacity: '0', transform: 'translateY(-8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'badge-pulse': {
          '0%': { transform: 'scale(1)' },
          '40%': { transform: 'scale(1.12)' },
          '100%': { transform: 'scale(1)' },
        },
      },
      animation: {
        'slide-in': 'slide-in 200ms ease-out both',
        'badge-pulse': 'badge-pulse 400ms ease-out both',
      },
    },
  },
  plugins: [],
} satisfies Config;
