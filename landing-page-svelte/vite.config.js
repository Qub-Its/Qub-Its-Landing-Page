import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { resolve } from 'node:path'

// https://vite.dev/config/
// Multi-page: the landing (index.html), the MCDU trainer and the PFD trainer are separate entries.
export default defineConfig({
  plugins: [svelte()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        mcdu: resolve(import.meta.dirname, 'labs/mcdu-trainer/index.html'),
        pfd: resolve(import.meta.dirname, 'labs/pfd-trainer/index.html'),
      },
    },
  },
})
