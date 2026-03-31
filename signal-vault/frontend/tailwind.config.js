/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        deep: '#0a0e1a',
        surface: 'rgba(255,255,255,0.06)',
        'surface-hover': 'rgba(255,255,255,0.10)',
        'border-subtle': 'rgba(255,255,255,0.10)',
        gold: '#d4a843',
        'gold-glow': 'rgba(212,168,67,0.3)',
        violet: '#7c6cf0',
        emerald: '#34d399',
        amber: '#f59e0b',
        rose: '#f43f5e',
        'text-primary': '#e8e6e3',
        'text-muted': '#8b8a88',
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'serif'],
        body: ['"DM Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      backdropBlur: {
        xl: '24px',
      },
    },
  },
  plugins: [],
}
