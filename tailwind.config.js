/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ivory: {
          50: '#FDFCF9',
          100: '#FAF8F3',
          200: '#F4EFE6',
          300: '#EAE2D5',
          400: '#DDD2C1',
        },
        forest: {
          950: '#05211D',
          900: '#0A332C',
          800: '#0D4A40',
          700: '#135C50',
          600: '#1C7060',
          500: '#2A8672',
        },
        sage: {
          50: '#F4F7F4',
          100: '#E6ECE6',
          200: '#D2DCD2',
          300: '#B0C2B1',
          400: '#8A9F8B',
          500: '#69816B',
          600: '#526653',
          700: '#3F4E40',
        },
        ochre: {
          50: '#FFF5ED',
          100: '#FFE6D2',
          200: '#FFCBA6',
          300: '#FFA870',
          400: '#FF8A45',
          500: '#F5701F',
          600: '#D95A10',
          700: '#A8410C',
          800: '#7C300A',
        },
        /* Vibrant brand orange — secondary accent, used sparingly for emphasis */
        ember: {
          50: '#FFF5EE',
          100: '#FFE7D6',
          200: '#FFCBA6',
          300: '#FFA870',
          400: '#FB8440',
          500: '#EC6417',
          600: '#CC4E0C',
          700: '#A33D0C',
          800: '#7C2F0B',
        },
        terracotta: {
          500: '#B85D3B',
          600: '#9E4A2A',
        },
        /* Semantic signal colours tuned to the editorial palette */
        signal: {
          crimson: '#9F2F2F',
          crimsonSoft: '#FBEDED',
          amber: '#8A5A12',
          amberSoft: '#FCF3E2',
        },
      },
      fontFamily: {
        serif: ['Newsreader', 'Georgia', 'Cambria', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      /**
       * Tailwind's default opacity scale only steps in fives, so colour
       * modifiers like `border-forest-900/12` or `bg-ivory-100/92` silently
       * produced no CSS — which is why the sticky header had no background and
       * several hairline borders were invisible. These are the in-between
       * values the design actually uses.
       */
      opacity: {
        2: '0.02',
        4: '0.04',
        6: '0.06',
        8: '0.08',
        12: '0.12',
        14: '0.14',
        16: '0.16',
        18: '0.18',
        22: '0.22',
        92: '0.92',
        94: '0.94',
        96: '0.96',
        98: '0.98',
      },
      letterSpacing: {
        tighter: '-0.035em',
        tight: '-0.02em',
        wide: '0.04em',
        wider: '0.08em',
        widest: '0.14em',
      },
      borderRadius: {
        'card': '0.875rem',
      },
      boxShadow: {
        'soft-sm': '0 2px 8px -2px rgba(10, 51, 44, 0.05)',
        'soft': '0 8px 30px -4px rgba(10, 51, 44, 0.07)',
        'soft-lg': '0 20px 45px -10px rgba(10, 51, 44, 0.10)',
        'editorial': '0 25px 60px -15px rgba(10, 51, 44, 0.12)',
        'lift': '0 18px 40px -16px rgba(10, 51, 44, 0.22)',
        'inner-hair': 'inset 0 1px 0 0 rgba(255,255,255,0.65)',
      },
      transitionTimingFunction: {
        'editorial': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      screens: {
        'xs': '420px',
        '3xl': '1800px',
      },
    },
  },
  plugins: [],
}
