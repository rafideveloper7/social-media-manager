/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkBg: "#0f172a", // Slate 900 for a clean modern dark mode look
        cardBg: "#1e293b", // Slate 800
      }
    },
  },
  plugins: [],
}