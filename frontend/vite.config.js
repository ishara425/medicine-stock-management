import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // increase chunk size warning threshold (optional)
    chunkSizeWarningLimit: 1000, // KB

    rollupOptions: {
      output: {
        // split vendor code (node_modules) into a separate chunk
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return 'vendor'
          }
        },
      },
    },
  },
  // optional: define environment variables prefix if needed
  envPrefix: 'VITE_',
})
