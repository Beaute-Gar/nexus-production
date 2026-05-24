/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'text-primary': '#f1f5f9',
        'text-secondary': '#94a3b8',
        'text-muted': '#64748b',
        'surface': '#1e293b',
        'raised': '#0f172a',
        'border': '#334155',
        'border-bright': '#475569',
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
}