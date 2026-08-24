/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        base: {
          950: '#080B10',
          900: '#F9FAFB',
          800: '#F1F3F6',
          700: '#E4E7EC',
          600: '#D6DBE3',
        },
        ingreso: '#32E993',
        egreso: '#FF5D6C',
        brand: {
          primary: '#0C90FA',
          secondary: '#1ADEB0',
          deep: '#034CD2',
        },
      },
      fontFamily: {
        display: ['"Sora"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 0 0 rgba(255,255,255,0.04) inset, 0 8px 24px -12px rgba(0,0,0,0.6)',
      },
    },
  },
  plugins: [],
}
