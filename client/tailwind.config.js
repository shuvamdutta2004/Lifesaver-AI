/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        // Brand blacks
        'bg-primary':   '#0a0a0f',
        'bg-card':      '#13131a',
        'bg-elevated':  '#1c1c27',
        // Emergency type colors
        'sos-red':      '#ff1744',
        'sos-red-dark': '#b71c1c',
        'women-pink':   '#e91e8c',
        'fire-orange':  '#ff6d00',
        'flood-blue':   '#0288d1',
        'quake-brown':  '#8d6e63',
        'medical-green':'#00c853',
        // Helpers / safe
        'safe-green':   '#00e676',
        'warning-amber':'#ffd740',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-sos':  'pulse-sos 1.5s ease-in-out infinite',
        'ping-slow':  'ping 2s cubic-bezier(0,0,0.2,1) infinite',
        'slide-up':   'slide-up 0.4s ease-out',
        'fade-in':    'fade-in 0.3s ease-out',
      },
      keyframes: {
        'pulse-sos': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(255,23,68,0.7)' },
          '50%':      { boxShadow: '0 0 0 24px rgba(255,23,68,0)' },
        },
        'slide-up': {
          from: { transform: 'translateY(20px)', opacity: 0 },
          to:   { transform: 'translateY(0)',    opacity: 1 },
        },
        'fade-in': {
          from: { opacity: 0 },
          to:   { opacity: 1 },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
