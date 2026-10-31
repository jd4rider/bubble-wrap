import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // Relative asset paths so the bundled app loads over file:// inside Electron.
  base: './',
  plugins: [react()],
})
