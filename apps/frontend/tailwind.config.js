/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Aptos Display', 'Aptos', 'Segoe UI', 'sans-serif'],
        body: ['Aptos', 'Segoe UI', 'sans-serif']
      },
      colors: {
        ink: '#18213f',
        moss: '#0f7ea8',
        gold: '#38c4c8',
        sand: '#f6f9fc',
        clay: '#ef6f5c'
      },
      boxShadow: {
        soft: '0 22px 60px rgba(15, 126, 168, 0.13)',
        panel: '0 18px 48px rgba(15, 126, 168, 0.18), 0 4px 14px rgba(24, 33, 63, 0.08)'
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(12px) scale(0.97)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' }
        }
      },
      animation: {
        'fade-in': 'fade-in 0.2s ease-out'
      }
    }
  },
  plugins: []
}
