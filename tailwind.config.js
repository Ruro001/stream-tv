/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'netflix-red': '#E50914',
        'prime-blue': '#00A8E1',
        'dark-bg': '#141414',
      },
    },
  },
  plugins: [],
}
