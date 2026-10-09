import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { resolve } from 'node:path'

// https://vite.dev/config/
// Multi-page: the landing (index.html) and the PFD trainer (labs/pfd-trainer/index.html) are separate entries.
// The MCDU trainer is still a static page in public/ and is copied as-is.
export default defineConfig({
  plugins: [svelte()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        pfd: resolve(import.meta.dirname, 'labs/pfd-trainer/index.html'),
      },
    },
  },
})
