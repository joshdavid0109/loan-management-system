import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  root: ".",                 // 👈 index.html lives here
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
  plugins: [react()],
  css: {
    postcss: './postcss.config.cjs',
  },
})
