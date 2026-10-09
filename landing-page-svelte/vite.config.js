import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { resolve } from 'node:path'

// https://vite.dev/config/
// Multi-page: the landing (index.html), the MCDU, PFD and E6B trainers are separate entries.
export default defineConfig({
  plugins: [svelte()],
  build: {
    // The PFD's lazy 3D chunk (three.js WebGLRenderer, ~570 kB / ~145 kB gzip) is loaded only on demand.
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        mcdu: resolve(import.meta.dirname, 'labs/mcdu-trainer/index.html'),
        pfd: resolve(import.meta.dirname, 'labs/pfd-trainer/index.html'),
        e6b: resolve(import.meta.dirname, 'labs/e6b-trainer/index.html'),
      },
    },
  },
})
