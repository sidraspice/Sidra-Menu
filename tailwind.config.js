/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#1e382b',
          primary: '#2d533e',
          light: '#4d7c60',
          accent: '#c89d56',
          bg: '#fbf9f4',
          card: '#ffffff',
          border: '#e8e2d5'
        }
      }
    },
  },
  plugins: [],
}
