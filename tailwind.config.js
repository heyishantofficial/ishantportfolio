/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fdf2f8',
          100: '#fce7f3',
          500: '#ec4899',
          600: '#db2777',
          900: '#831843',
        },
        cyber: {
          bg: '#0a0a12',
          card: 'rgba(18, 18, 32, 0.75)',
          border: 'rgba(255, 255, 255, 0.12)',
          pink: '#ff2a85',
          purple: '#9d4edd',
          cyan: '#00f0ff',
          gold: '#ffd700'
        }
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s infinite ease-in-out',
        'float': 'float 4s infinite ease-in-out',
        'wave': 'wave 1.2s infinite ease-in-out',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 15px rgba(255, 42, 133, 0.4)' },
          '50%': { boxShadow: '0 0 30px rgba(0, 240, 255, 0.7)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        wave: {
          '0%, 100%': { transform: 'scaleY(0.3)' },
          '50%': { transform: 'scaleY(1.0)' },
        }
      }
    },
  },
  plugins: [],
}
