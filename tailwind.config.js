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
          950: '#0A1410',
          900: '#0E1D17',
          800: '#142921',
          700: '#1C382D',
          600: '#274B3D',
          500: '#34614F',
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
          50: '#FBF6EE',
          100: '#F5E8D4',
          200: '#EBD0AC',
          300: '#DFB47F',
          400: '#D19655',
          500: '#B8783A',
          600: '#9B5F2A',
          700: '#7B4720',
        },
        terracotta: {
          500: '#B85D3B',
          600: '#9E4A2A',
        }
      },
      fontFamily: {
        serif: ['Newsreader', 'Georgia', 'Cambria', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      letterSpacing: {
        tighter: '-0.035em',
        tight: '-0.02em',
        wide: '0.04em',
        wider: '0.08em',
        widest: '0.14em',
      },
      boxShadow: {
        'soft-sm': '0 2px 8px -2px rgba(14, 29, 23, 0.05)',
        'soft': '0 8px 30px -4px rgba(14, 29, 23, 0.07)',
        'soft-lg': '0 20px 45px -10px rgba(14, 29, 23, 0.10)',
        'editorial': '0 25px 60px -15px rgba(14, 29, 23, 0.12)',
      }
    },
  },
  plugins: [],
}
