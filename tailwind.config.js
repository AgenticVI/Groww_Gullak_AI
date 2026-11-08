/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#44475B',
        mute: '#6B6E7E',
        brand: '#00D09C',
        deep: '#00875F',
        tint: '#E5FAF5',
        line: '#E9E9EB',
        storm: '#C2410C',
      },
      fontFamily: { sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'] },
      borderRadius: { card: '12px', btn: '8px' },
    },
  },
  plugins: [],
}
