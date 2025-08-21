import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// Ako pratite vodič koji koristi @tailwindcss/vite plugin,
// onda ga prvo instalirajte: npm install -D @tailwindcss/vite
// i dodajte ovaj import:
import tailwindcss from "@tailwindcss/vite"
 
// https://vite.dev/config/
export default defineConfig({
  // Ako koristite @tailwindcss/vite, dodajte ga u niz pluginova:
  plugins: [react(), tailwindcss()],

  // OVAJ DEO JE NAJVAŽNIJI ZA VAS
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})