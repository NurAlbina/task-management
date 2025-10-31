import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'


export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    proxy: {
      // '/api' ile başlayan her isteği
      // backend sunucusuna (localhost:5000) yönlendir
      '/api': {
        target: 'http://localhost:5000', 
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
