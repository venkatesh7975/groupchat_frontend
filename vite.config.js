import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: "/", // important for Vercel
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
  define: {
    // Make environment variables available to the client
    'process.env': process.env
  },
  server: {
    port: 5173,
    host: true
  }
})
