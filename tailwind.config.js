/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'bg-primary': '#0f0f1a',
        'bg-secondary': '#1a1a2e',
        'bg-tertiary': '#252542',
        'ob-bullish': '#22c55e',
        'ob-bearish': '#ef4444',
        'fvg': '#a855f7',
        'bos': '#3b82f6',
        'choch': '#f97316',
        'liquidity': '#eab308',
      },
    },
  },
  plugins: [],
}