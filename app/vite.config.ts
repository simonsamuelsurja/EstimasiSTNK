import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // Jalur berkas dibuat relatif supaya aplikasi bisa dibuka dari folder mana
  // pun, bukan hanya dari akar domain.
  base: './',
  plugins: [react()],
})
