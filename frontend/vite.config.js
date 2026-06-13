import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Any request to /api/* gets forwarded to your FastAPI server
      // This means your frontend calls /api/auth/login
      // and Vite secretly sends it to http://localhost:8000/api/auth/login
      // No CORS issues during development
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      }
    }
  }
})