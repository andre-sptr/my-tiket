import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Editorial aviation palette — "Twilight Departures"
        cream: {
          50:  '#FBF8F2',
          100: '#F7F3EB',
          200: '#EFE8D9',
          300: '#E3D8BF',
        },
        midnight: {
          400: '#3A4A66',
          500: '#1E2A44',
          600: '#13203B',
          700: '#0B1426',
          800: '#070D1B',
          900: '#040711',
        },
        amber: {
          50:  '#FDF6EB',
          100: '#FAE9C9',
          200: '#F4D08A',
          300: '#EDB155',
          400: '#E8862A',
          500: '#D8721C',
          600: '#B05A14',
          700: '#824311',
        },
        sky: {
          200: '#BDE5F0',
          300: '#7DD3FC',
          400: '#5EC2D9',
          500: '#3BA6BF',
        },
        ink: {
          400: '#6B6E78',
          500: '#3C4150',
          600: '#262A38',
          700: '#1A1F2E',
        },
        // Keep legacy "brand" alias mapped to amber for backwards compat
        brand: {
          50:  '#FDF6EB',
          100: '#FAE9C9',
          300: '#EDB155',
          500: '#E8862A',
          600: '#D8721C',
          700: '#B05A14',
          900: '#824311',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        sans:    ['var(--font-body)', 'system-ui', 'sans-serif'],
        mono:    ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      letterSpacing: {
        tightest: '-0.045em',
        widest:   '0.28em',
      },
      boxShadow: {
        pass:  '0 1px 0 0 rgba(11,20,38,0.04), 0 24px 48px -16px rgba(11,20,38,0.18)',
        stamp: 'inset 0 0 0 2px currentColor',
      },
      animation: {
        'fade-up':     'fadeUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) both',
        'fade-in':     'fadeIn 0.6s ease-out both',
        'marquee':     'marquee 38s linear infinite',
        'taxi':        'taxi 9s linear infinite',
        'pulse-soft':  'pulseSoft 2.6s ease-in-out infinite',
      },
      keyframes: {
        fadeUp: {
          '0%':   { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        marquee: {
          '0%':   { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        taxi: {
          '0%':   { transform: 'translateX(-10%) rotate(-2deg)' },
          '100%': { transform: 'translateX(110%) rotate(-2deg)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '0.55' },
          '50%':      { opacity: '1' },
        },
      },
      backgroundImage: {
        'noise':  "url(\"data:image/svg+xml;utf8,<svg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.06 0 0 0 0 0.08 0 0 0 0 0.14 0 0 0 0.22 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>\")",
        'paper':  "radial-gradient(circle at 20% 0%, rgba(232,134,42,0.07), transparent 55%), radial-gradient(circle at 95% 18%, rgba(94,194,217,0.09), transparent 50%)",
      },
    },
  },
  plugins: [],
};

export default config;
