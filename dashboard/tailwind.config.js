/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        vcamp: {
          dark: '#080d1a',
          navy: '#0f172a',
          surface: '#1e293b',
          cyan: '#06b6d4',
          glow: '#00f2fe',
        }
      }
    },
  },
  plugins: [],
}
