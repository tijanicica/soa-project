/** @type {import('tailwindcss').Config} */
export default {
  // OVAJ 'content' DEO JE NAJVAŽNIJI
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}", // Kažemo mu da gleda u SVE .jsx fajlove unutar src
  ],
  theme: {
    extend: {
      // Ovde možeš dodati custom boje, fontove, itd. kasnije
    },
  },
  plugins: [],
}