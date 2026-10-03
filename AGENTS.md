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

## Feedback Panel

The MCDU trainer (`public/labs/mcdu-trainer/`) has a "Feedback" button in its header that submits to Web3Forms. Panel UI: `feedback-panel.js`; logic: `feedback.js` (both plain ES modules, no bundler).

- Key: `VITE_WEB3FORMS_FEEDBACK_KEY` (Vercel env vars, or `landing-page-svelte/.env.local`). The trainer is static, so `scripts/inject-feedback-key.mjs` writes the key into its `<meta name="feedback-key">` during `npm run build`. Without a key the button stays hidden; a new key needs a new build/deploy. Never commit the key.
- Use a dedicated feedback key with **hCaptcha enabled** in the Web3Forms dashboard — it is the only anti-spam layer a direct API caller cannot skip. Rotate the key if it gets abused.
- Logic checks: `node scripts/check-feedback.mjs` (from `landing-page-svelte/`).
