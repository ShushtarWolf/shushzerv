import type { Config } from 'tailwindcss'

export default {
  content: [
    './app/components/**/*.{vue,js,ts}',
    './app/layouts/**/*.vue',
    './app/pages/**/*.vue',
    './app/app.vue',
    './app/**/*.{vue,js,ts}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'SF Pro Display',
          'SF Pro Text',
          'Segoe UI',
          'Vazirmatn',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
      colors: {
        brand: {
          green: '#34c759',
          teal: '#30b0c7',
          blue: '#007aff',
          indigo: '#5856d6',
          orange: '#ff9500',
          pink: '#ff2d55',
          gray: {
            50: '#f2f2f7',
            100: '#e5e5ea',
            200: '#d1d1d6',
            300: '#c7c7cc',
            400: '#aeaeb2',
            500: '#8e8e93',
            600: '#636366',
            700: '#48484a',
            800: '#3a3a3c',
            900: '#1c1c1e',
          },
        },
      },
      borderRadius: {
        ios: '1.25rem',
        'ios-lg': '1.75rem',
        'ios-xl': '2.25rem',
      },
      boxShadow: {
        glass: '0 8px 32px rgba(0, 0, 0, 0.08)',
        card: '0 2px 16px rgba(0, 0, 0, 0.06)',
        float: '0 12px 40px rgba(0, 0, 0, 0.12)',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        'slide-up': 'slideUp 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config
