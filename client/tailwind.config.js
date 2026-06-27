/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#0f1c2e',
          2: '#162236',
          3: '#1e3352',
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Inter', 'Helvetica', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
