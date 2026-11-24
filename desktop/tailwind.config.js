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
          accent: '#3b82f6',
          border: 'rgba(6, 182, 212, 0.25)',
        }
      },
      boxShadow: {
        'glow-cyan': '0 0 15px rgba(6, 182, 212, 0.4), 0 0 30px rgba(0, 242, 254, 0.2)',
        'glow-sm': '0 0 8px rgba(6, 182, 212, 0.5)',
      },
      animation: {
        'pulse-glow': 'pulseGlow 2.5s infinite ease-in-out',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: '0.4', transform: 'scale(1)' },
          '50%': { opacity: '0.9', transform: 'scale(1.05)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        }
      }
    },
  },
  plugins: [],
}
