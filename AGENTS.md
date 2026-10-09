# Qub-Its-Landing-Page

## Repo Structure

Two parallel implementations of the same corporate landing page:

| Directory | Stack | Status |
|-----------|-------|--------|
| `landing-page-svelte/` | Svelte 5 + Vite + Tailwind v4 | Active development |
| `HTML/` | Bootstrap + jQuery + custom CSS | Production |

The root `package.json` (Tailwind/PostCSS/Autoprefixer) only serves the `HTML/` static site. The Svelte project has its own `package.json` and `node_modules`.

## Developer Commands

**Node:** 22 LTS (`.nvmrc` at the root and in `landing-page-svelte/`, `engines.node: "22.x"` for Vercel). Vite 8 needs ≥ 20.19 and the check scripts use `import.meta.dirname`; run `nvm use` first.

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
- Vite is multi-page: `index.html` (landing), `labs/mcdu-trainer/index.html` (MCDU trainer, vanilla JS in `src/labs/mcdu/`) and `labs/pfd-trainer/index.html` (PFD trainer) and `labs/e6b-trainer/index.html` (E6B trainer) are separate entries in `vite.config.js`
- No test framework, no ESLint/Prettier, no CI

## Contact Form

The `HTML/` version submits to Web3Forms. Do not commit access keys — the one present (`53269194-6475-4891-a617-a0363b8ddb30`) is already public but should still be treated as a secret.

## Feedback Panel

Both trainers have a "Feedback" button that submits to Web3Forms. Shared module in `src/labs/shared/feedback/`: panel UI `feedback-panel.js` (`mountFeedback({ key })`), logic `feedback.js`.

- Key: `VITE_WEB3FORMS_FEEDBACK_KEY` (Vercel env vars, or `landing-page-svelte/.env.local`). Read through `import.meta.env` at build time. Without a key the button stays hidden; a new key needs a new build/deploy. Never commit the key.
- Use a dedicated feedback key with **hCaptcha enabled** in the Web3Forms dashboard — it is the only anti-spam layer a direct API caller cannot skip. Rotate the key if it gets abused.
- Logic checks: `node scripts/check-feedback.mjs` (from `landing-page-svelte/`).

## MCDU Trainer

`/labs/mcdu-trainer/` is a vanilla-JS Vite entry (`labs/mcdu-trainer/index.html` → `src/labs/mcdu/`, logic in `trainer.js`).

- 3D map tab ("Mapa 3D"): `trainer.js` publishes a plain-data `mcdu:plan` snapshot after every interaction (also `window.__mcduPlan`) and fires `mcdu:tab` from `setTab`. `src/labs/mcdu/fpln3d/`: `route.js` (pure projection + simplified profile, `node scripts/check-mcdu-fpln3d.mjs`), `map.js` (the only module importing `three`, lazy), `tab.js` (eager, three-free wiring). Renders only while the tab is selected, on screen and visible; `?debug3d` exposes `window.__mcduMap()`, `?debug3d=nowebgl` forces the fallback.

## PFD Trainer

`/labs/pfd-trainer/` is a Svelte 5 page (Vite entry `labs/pfd-trainer/index.html` → `src/labs/pfd/`); the MCDU trainer is a vanilla-JS Vite entry (`src/labs/mcdu/`). Design: `docs/superpowers/specs/2026-10-09-pfd-trainer-design.md`; plan: `docs/superpowers/plans/2026-10-09-pfd-trainer.md`.

- Contracts: `lib/schema.js` (flight state shape) and `lib/layout.js` (SVG regions, scales, Airbus colours). Instruments in `components/pfd/` are pure views of the state and draw only in their region; clickable parts carry `data-part="<id>"` (content in `content/parts.js`).
- Simulation is plain JS (`lib/sim.js`, `lib/autoflight.js`, `lib/scenarios.js`); `lib/flight.svelte.js` is the only reactive store and runs the fixed-step loop.
- Desktop panel collapses to a right-edge rail (`components/PanelRail.svelte`, state in `localStorage` `qubits.pfd.panelCollapsed`); starting a Fly/Automation level collapses it so PFD and controls sit side by side (≥ 1100px, PFD sticky).
- 3D exterior view: header "3D" toggles `components/Exterior3d.svelte`, which lazy-loads `view3d/exterior.js` (the only module importing `three`, by name so it tree-shakes); pose math in `view3d/pose.js`, procedural model in `src/labs/shared/three/aircraft.js` (takes `THREE` as a parameter, reusable by vanilla pages). Renders only while open, on screen and with the tab visible. `?debug3d` exposes a frame counter, `?debug3d=nowebgl` forces the fallback.
- The English page is written by `scripts/localize-heads.mjs` from `seo.pfd`; in `vite dev`, `/en/labs/pfd-trainer/` falls back to the landing, so test English on a build (`npm run build && npm run preview`).
- Feedback: with `VITE_WEB3FORMS_FEEDBACK_KEY` set, the page lazy-loads the shared panel (`src/labs/shared/feedback/`).
- The MCDU trainer promotes the PFD from a left-edge tab (`src/labs/shared/pfd-promo.js`, expands once per session; `?pfdPromo=expand` forces it).
- Checks (from `landing-page-svelte/`): `node scripts/check-pfd.mjs` (flight model/autoflight), `node scripts/check-pfd-content.mjs` (ES/EN content coverage), `node scripts/check-pfd-exercises.mjs` (plays every Fly/Automation exercise against the sim), `node scripts/check-pfd-3d.mjs` (3D pose math + procedural model).

## E6B Trainer

`/labs/e6b-trainer/` is a Svelte 5 page (Vite entry `labs/e6b-trainer/index.html` → `src/labs/e6b/`), a mechanical E6B flight computer (both faces) built as interactive SVG. Docs: spec `docs/superpowers/specs/2026-10-09-e6b-trainer-design.md`, plan `docs/superpowers/plans/2026-10-09-e6b-trainer.md`, traditional use `docs/e6b/uso-tradicional-e6b.md`.

- Structure: `lib/` (pure JS: `scales.js` log scales + ISA, `wind.js` wind triangle and wind-face geometry, `answers.js` typed-answer parsing/tolerance, `practice.js` seeded problem generator), `content/` (`parts.js`, `guide.js`, `glossary.js`, `exercises.js`), `components/` (instrument `E6b.svelte`, `CalcFace`, `WindFace`, `Lupa`; shell `Panel`, `PanelRail`, `Exercises`, `Practice`, `TaskBar`, `AnswerFields`, `DemoBar`, `ExplainCard`, `Glossary`).
- Store: `lib/e6b.svelte.js` (`e6b`: face, rot, cursor, dir, slide, dots, pencil, dragging; `applyState`, `resetState`, `animateTo`) is the only reactive module. Instruments are pure views of it and mark clickable parts with `data-part="<id>"`.
- Exercise contract: `{ id, level, setup?, part?, explain?, task, hint, why, check?(s, ctx) | quiz | answers[], demo? }`. `check` is evaluated by `App.svelte` in an `$effect` only while `e6b.dragging` is false (and on part clicks, `ctx.lastPart`); typed `answers` use `parseAnswer`/`isClose`; `demo` (Show me) is a list of state patches with a caption, played by `DemoBar.svelte` through `animateTo` (also used by Practice).
- Practice: `lib/practice.js` `generate(kind, seed)` is deterministic per seed (kinds tsd, fuel, conv, tas, da, wind, navlog); streak and best streak live in `localStorage` `qubits.e6b.practice.v1`, progress in `qubits.e6b.progress.v1`, panel state in `qubits.e6b.panelCollapsed`.
- Shell mirrors the PFD trainer (header, collapsible panel/rail, bottom sheet ≤ 980px, glossary, toast, lazy feedback panel with `VITE_WEB3FORMS_FEEDBACK_KEY`). English head is written by `scripts/localize-heads.mjs` from `seo.e6b`.
- Checks (from `landing-page-svelte/`): `node scripts/check-e6b.mjs` (scales, atmosphere, wind, answers, generator), `node scripts/check-e6b-content.mjs` (content coverage, exercises and demos against the model).
