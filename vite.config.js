import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Si vas a servir la app dentro de una subcarpeta (ej. GitHub Pages),
  // cambia 'base' a '/nombre-del-repo/'
  base: './',
})
