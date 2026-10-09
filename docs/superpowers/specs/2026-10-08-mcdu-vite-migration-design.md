# MCDU Trainer — light migration to a Vite entry (MVP2, part 1)

Status: implemented (2026-10-08). First of the MVP2 sub-projects listed in
`2026-10-09-pfd-trainer-design.md` (then: 3D exterior view, 3D F-PLN, cockpit fly-in intro, Build mode — each
with its own spec).

All paths are relative to `landing-page-svelte/` unless stated.

## Goal

Move the MCDU Trainer from a static page in `public/` into the Vite build so it can share modules with the PFD
trainer (feedback now, 3D later) and read `import.meta.env` directly. The user-facing page does not change.

Success means:

- `scripts/inject-feedback-key.mjs` is gone; both trainers get the Web3Forms key from `import.meta.env`.
- The feedback panel and the PFD promo live in `src/labs/shared/` and are bundled, not served from `public/`.
- `/labs/mcdu-trainer/` and `/en/labs/mcdu-trainer/` behave exactly as today (levels, tasks, glossary, tooltips,
  explain notes, ES/EN, feedback, PFD promo, analytics) and keep the same `<head>` metadata.

## Decisions

| Topic | Decision | Why |
|---|---|---|
| Scope | Light: vanilla JS in Vite, no logic rewrite, no Svelte port | Production page; minimum risk. |
| Code layout | Extract inline CSS and the inline IIFE into files | The 1745-line HTML mixes three languages; files are needed later anyway. |
| Splitting `trainer.js` | Not now | Copy the IIFE body as-is so the diff is reviewable as a move. |
| Feedback key | Passed as a parameter from `import.meta.env` | Removes the `<meta>` + post-build injection step. |
| Analytics | `inject()` from `@vercel/analytics` | Same as the landing and PFD; drops the plain `/_vercel/insights` snippet. |
| `.fb-*` styles | Stay duplicated in each page's CSS | Out of scope; no behaviour gain now. |

## Structure

```
labs/mcdu-trainer/index.html              moved from public/labs/mcdu-trainer/index.html; markup + <head> only
src/labs/mcdu/main.js                     imports mcdu.css, trainer.js; inject(); mounts feedback; imports promo
src/labs/mcdu/mcdu.css                    the inline <style> block, verbatim
src/labs/mcdu/trainer.js                  the inline IIFE body, verbatim (wrapper removed: modules are scoped)
src/labs/shared/feedback/feedback.js      moved from public/labs/mcdu-trainer/feedback.js, unchanged
src/labs/shared/feedback/feedback-panel.js moved from public/labs/mcdu-trainer/feedback-panel.js
src/labs/shared/pfd-promo.js              moved from public/labs/shared/pfd-promo.js, unchanged
```

Deleted: `public/labs/mcdu-trainer/` and `public/labs/shared/` (whole directories), `scripts/inject-feedback-key.mjs`.

- `labs/mcdu-trainer/index.html` keeps the full `<head>` (SEO, JSON-LD, Google Fonts `<link>`s) and the body
  markup. Its only script is `<script type="module" src="/src/labs/mcdu/main.js"></script>`. The
  `<meta name="feedback-key">` tag is removed.
- `vite.config.js`: add the entry `mcdu: resolve(import.meta.dirname, 'labs/mcdu-trainer/index.html')`; update the
  comment that says the MCDU is a static page.
- `package.json` `build`: `vite build && node scripts/localize-heads.mjs`.
- The built page stays at `dist/labs/mcdu-trainer/index.html`, so `scripts/localize-heads.mjs` and `vercel.json`
  need no change. `localize-heads` must still find the Spanish `<head>` values from `src/seo.js` in it.

## Feedback module

`feedback-panel.js` stops reading `<meta name="feedback-key">` and running at import. It exports:

```js
/** Wires #feedbackBtn to the feedback dialog. No-op without a key or without the button. */
export function mountFeedback({ key }: { key?: string }): void;
```

The body is today's `init()`; language detection and copy stay as they are. Callers:

- MCDU `main.js`: `mountFeedback({ key: import.meta.env.VITE_WEB3FORMS_FEEDBACK_KEY })`. The button already exists
  in the markup and stays hidden until the panel shows it (current behaviour).
- PFD `App.svelte`: replace the `<meta>` write and the `@vite-ignore` import with
  `import('../shared/feedback/feedback-panel.js').then((m) => m.mountFeedback({ key: feedbackKey }))` after
  `tick()`, still only when `feedbackKey` is set (keeps the panel in a lazy chunk). Remove the
  `<meta name="feedback-key">` from `labs/pfd-trainer/index.html`.

`scripts/check-feedback.mjs` imports from `../src/labs/shared/feedback/feedback.js`.

## Unchanged on purpose

- The promo `sessionStorage` key `qubits.pfdPromo.expanded`. (MCDU progress is in-memory only and resets on reload,
  as today.)
- The `mcdu:task-complete` event and the promo behaviour (`?pfdPromo=expand` still forces it).
- Language detection (`/en/…` or `?lang=en` in dev) and the runtime English copy in `trainer.js`.
- URLs. The only URLs that disappear are `/labs/mcdu-trainer/feedback-panel.js`, `/labs/mcdu-trainer/feedback.js`
  and `/labs/shared/pfd-promo.js`; nothing outside these two pages references them.

## Risks

- **Strict mode / module scope:** the IIFE becomes module code (strict, deferred). The script was already at the end
  of `<body>`, so DOM timing is the same; check for sloppy-mode patterns (implicit globals, `this` at top level)
  while moving.
- **Vite asset rewriting:** Vite rewrites absolute URLs in the HTML/CSS. `/favicon.ico` and `/images/…` stay in
  `public/` and must still resolve; check the built HTML.
- **`<head>` drift:** compare the built ES and EN `<head>` with today's `dist` output; only the asset tags may
  differ.

## Verification

1. `npm run build` passes; `node scripts/check-feedback.mjs`, `check-pfd.mjs`, `check-pfd-content.mjs`,
   `check-pfd-exercises.mjs` pass.
2. Diff `dist/labs/mcdu-trainer/index.html` and `dist/en/labs/mcdu-trainer/index.html` `<head>` against a build
   from `main`.
3. In Chromium (`npm run build && npm run preview`, desktop and ~390px phone), ES and EN: complete a task in each
   level, glossary dialog and tooltips, explain/why notes, panel/bottom sheet, PFD promo
   expands (`?pfdPromo=expand`), no console errors.
4. With `VITE_WEB3FORMS_FEEDBACK_KEY` in `.env.local`: the Feedback button shows on both trainers and the dialog
   opens (do not submit to the real endpoint); without it the button stays hidden.
5. `npm run dev`: `/labs/mcdu-trainer/` loads with HMR.
6. Update `AGENTS.md` (Feedback panel and PFD sections; MCDU is no longer static).

## Out of scope

Svelte port, splitting `trainer.js`, sharing `.fb-*` styles, UI or content changes.
