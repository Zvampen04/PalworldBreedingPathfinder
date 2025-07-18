/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        palworld: {
          blue: '#4A90E2',
          green: '#7ED321',
          orange: '#F5A623',
          red: '#D0021B',
          purple: '#9013FE',
        }
      },
      fontFamily: {
        'game': ['Orbitron', 'monospace'],
      }
    },
  },
  plugins: [],
} 