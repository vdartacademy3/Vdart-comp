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
          bg: '#FFFFFF',
          surface: '#F8FAFC',
          primary: '#1769D2',
          primaryHover: '#1254A8',
          secondary: '#EAF3FF',
          text: '#172B4D',
          muted: '#64748B',
          border: '#E2E8F0',
          success: '#16A34A',
          warning: '#D97706',
          error: '#DC2626',
        }
      }
    },
  },
  plugins: [],
}
