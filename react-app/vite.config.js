import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    fs: {
      allow: [
        // search up for workspace root
        '..',
      ],
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Only the libraries every page needs go in the shared chunk; heavy admin-only ones (quill, mammoth...) stay with their lazy routes.
          if (/node_modules[/](react|react-dom|react-router|react-router-dom|scheduler|framer-motion|motion-dom|motion-utils)[/]/.test(id)) return 'vendor';
        },
      },
    },
  },
})
