/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paksoc: {
          deep:   '#012B1E',  // deep forest
          mid:    '#01411C',  // Pakistan flag green
          bright: '#00FF66',  // neon electric green
          gold:   '#C9A84C',  // Pakistani embroidery gold
        },
      },
      fontFamily: {
        sans: ["'Segoe UI'", 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
