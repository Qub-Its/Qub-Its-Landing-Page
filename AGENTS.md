# Qub-Its-Landing-Page

## Repo Structure

Two parallel implementations of the same corporate landing page:

| Directory | Stack | Status |
|-----------|-------|--------|
| `landing-page-svelte/` | Svelte 5 + Vite + Tailwind v4 | Active development |
| `HTML/` | Bootstrap + jQuery + custom CSS | Production |

The root `package.json` (Tailwind/PostCSS/Autoprefixer) only serves the `HTML/` static site. The Svelte project has its own `package.json` and `node_modules`.

## Developer Commands

**Svelte project:**
```bash
cd landing-page-svelte
npm run dev      # dev server
npm run build    # production build
npm run preview  # preview production build
```

**Static HTML project** (CSS processing via PostCSS):
```bash
npx postcss HTML/css/*.css -o HTML/css/output.css  # or similar
```

## Stack Notes

- **Svelte 5**: uses `mount()` API (not `new App()`), runes syntax likely in components
- **Tailwind v4**: configured in `tailwind.config.js` with `darkMode: "class"`
- **jsconfig.json**: `checkJs: true` — Svelte files are type-checked
- No test framework, no ESLint/Prettier, no CI

## Contact Form

The `HTML/` version submits to Web3Forms. Do not commit access keys — the one present (`53269194-6475-4891-a617-a0363b8ddb30`) is already public but should still be treated as a secret.
