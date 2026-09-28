/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  plugins: [
    // Edge shadows that appear only while a horizontally scrollable region
    // actually has content off-screen, so wide tables signal they can be
    // swiped on narrow viewports. Pure CSS, driven by `background-attachment:
    // local` vs `scroll` - no JS scroll listeners.
    function ({ addUtilities }) {
      addUtilities({
        '.scroll-x': {
          overflowX: 'auto',
          backgroundImage:
            'linear-gradient(to right, #fff 30%, rgba(255,255,255,0)),' +
            'linear-gradient(to right, rgba(255,255,255,0), #fff 70%),' +
            'linear-gradient(to right, rgba(15,23,42,0.08), rgba(15,23,42,0)),' +
            'linear-gradient(to left, rgba(15,23,42,0.08), rgba(15,23,42,0))',
          backgroundPosition: 'left center, right center, left center, right center',
          backgroundRepeat: 'no-repeat',
          backgroundSize: '36px 100%, 36px 100%, 12px 100%, 12px 100%',
          backgroundAttachment: 'local, local, scroll, scroll',
        },
      });
    },
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
      colors: {
        brand: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
      },
      boxShadow: {
        card: '0 1px 2px 0 rgb(15 23 42 / 0.04), 0 1px 3px 0 rgb(15 23 42 / 0.04)',
        lifted:
          '0 4px 6px -1px rgb(15 23 42 / 0.06), 0 2px 4px -2px rgb(15 23 42 / 0.04)',
        pop: '0 20px 45px -12px rgb(15 23 42 / 0.25), 0 8px 16px -8px rgb(15 23 42 / 0.12)',
        'brand-glow': '0 4px 14px -4px rgb(16 185 129 / 0.45)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-in-up': {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'slide-in-right': {
          '0%': { opacity: '0', transform: 'translateX(12px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.2s ease-out both',
        'slide-in-up': 'slide-in-up 0.25s ease-out both',
        'scale-in': 'scale-in 0.2s ease-out both',
        'slide-in-right': 'slide-in-right 0.25s ease-out both',
        shimmer: 'shimmer 1.6s linear infinite',
      },
    },
  },
};