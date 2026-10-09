# MCDU Trainer Vite Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the static MCDU Trainer (`public/labs/mcdu-trainer/`) into the Vite build as a multi-page entry, with the feedback panel and PFD promo as shared bundled modules, and without any user-visible change.

**Architecture:** The 1745-line HTML is split verbatim into markup (`labs/mcdu-trainer/index.html`), CSS (`src/labs/mcdu/mcdu.css`) and the IIFE body (`src/labs/mcdu/trainer.js`), loaded by `src/labs/mcdu/main.js`. The feedback panel exports `mountFeedback({ key })` and both trainers pass `import.meta.env.VITE_WEB3FORMS_FEEDBACK_KEY`, so the post-build key injection script goes away. Equivalence is proven by diffing the rendered DOM (headless Chrome) and the `<head>` against a baseline build taken before any change.

**Tech Stack:** Vite 8 multi-page, vanilla ES modules, Svelte 5 (PFD consumer only), `@vercel/analytics`, Node 22, headless Google Chrome for DOM dumps.

**Spec:** `docs/superpowers/specs/2026-10-08-mcdu-vite-migration-design.md`

## Global Constraints

- Node 22 (`nvm use` in the repo; `.nvmrc` = `22`). All commands run from `landing-page-svelte/` unless stated.
- Light migration: CSS and trainer JS are moved **verbatim**; no logic, copy or UI change. No Svelte port, no splitting `trainer.js`, `.fb-*` styles stay duplicated.
- No new dependencies.
- Never commit the Web3Forms key. Use `.env.local` (gitignored by `*.local`) for local testing and delete it afterwards; never submit the form to the real endpoint.
- Built page must stay at `dist/labs/mcdu-trainer/index.html`; `scripts/localize-heads.mjs`, `vercel.json` and `src/seo.js` are not changed.
- The promo `sessionStorage` key `qubits.pfdPromo.expanded`, the `mcdu:task-complete` event and `?pfdPromo=expand` keep working.
- Commit messages end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

- **English page:** `/en/labs/mcdu-trainer/` must render the English UI (runtime copy) with the English `<head>` from `localize-heads`. Pinned by the EN DOM and head diffs in Task 4.
- **No feedback key:** both trainers must build and hide the Feedback button when `VITE_WEB3FORMS_FEEDBACK_KEY` is unset (the default for local builds and preview deploys). Pinned in Task 2 Step 7 and Task 4.
- **With feedback key:** the button appears and the dialog opens on both trainers. Pinned in Task 4 Step 4.
- **Dev server:** `npm run dev` must serve `/labs/mcdu-trainer/` and `?lang=en` must switch to English. Pinned in Task 4 Step 5.
- **PFD promo:** `?pfdPromo=expand` must still expand the tab on the MCDU page, and on the English page the promo must link to `/en/labs/pfd-trainer/`. Pinned in Task 4 Step 3.

## File map

| Path | Change | Responsibility |
|---|---|---|
| `labs/mcdu-trainer/index.html` | moved (git mv) from `public/labs/mcdu-trainer/index.html`, trimmed | `<head>` SEO + body markup, one module script |
| `src/labs/mcdu/mcdu.css` | new (verbatim lines 38–246 of the old HTML) | page styles |
| `src/labs/mcdu/trainer.js` | new (verbatim lines 366–1735 of the old HTML) | MCDU trainer logic |
| `src/labs/mcdu/main.js` | new | entry: css, trainer, analytics, feedback, promo |
| `src/labs/shared/feedback/feedback.js` | git mv from `public/labs/mcdu-trainer/feedback.js` | form logic (unchanged) |
| `src/labs/shared/feedback/feedback-panel.js` | git mv from `public/labs/mcdu-trainer/feedback-panel.js`, edited | `mountFeedback({ key })` |
| `src/labs/shared/pfd-promo.js` | git mv from `public/labs/shared/pfd-promo.js` | promo tab (unchanged) |
| `vite.config.js` | modify | add `mcdu` entry |
| `package.json` | modify | drop `inject-feedback-key` from `build` |
| `scripts/inject-feedback-key.mjs` | delete | — |
| `scripts/check-feedback.mjs` | modify | new import path |
| `src/labs/pfd/App.svelte` | modify (~lines 166–182) | bundled lazy import of `mountFeedback` |
| `labs/pfd-trainer/index.html` | modify (line 9) | drop `feedback-key` meta |
| `AGENTS.md`, `docs/superpowers/specs/2026-10-09-pfd-trainer-design.md` (roadmap) | modify | docs |

Scratch directory for baseline artifacts (outside the repo):
`BASE=/private/tmp/claude-501/-Users-n001-Documents-Development-Qubits-dev-Qub-Its-Landing-Page/264fed7a-09fa-40d3-a3e4-6170862727c6/scratchpad/mcdu-baseline`
If that path is unavailable, use any empty temp dir and set `BASE` accordingly in every task.

---

### Task 1: Capture the baseline (before any code change)

**Files:** none in the repo; writes into `$BASE`.

**Interfaces:**
- Produces: `$BASE/dist/` (baseline build), `$BASE/dump.sh` (DOM dump + normalize helper), `$BASE/es.dom`, `$BASE/en.dom`, `$BASE/promo.dom` (normalized DOMs), `$BASE/es.head`, `$BASE/en.head`. Tasks 2 and 4 use all of them.

- [ ] **Step 1: Confirm a clean tree on the feature branch**

Run: `git status --short && git branch --show-current`
Expected: no output from status; branch `claude/mcdu-vite-migration`.

- [ ] **Step 2: Build and copy the baseline**

```bash
BASE=/private/tmp/claude-501/-Users-n001-Documents-Development-Qubits-dev-Qub-Its-Landing-Page/264fed7a-09fa-40d3-a3e4-6170862727c6/scratchpad/mcdu-baseline
rm -rf "$BASE" && mkdir -p "$BASE"
npm run build && cp -R dist "$BASE/dist"
```
Expected: build succeeds, log shows `inject-feedback-key: no VITE_WEB3FORMS_FEEDBACK_KEY…` (no key locally).

- [ ] **Step 3: Write the dump helper**

Create `$BASE/dump.sh`:

```bash
#!/bin/bash
# Usage: dump.sh <url> <out-file>
# Renders the page in headless Chrome, writes the normalized DOM to <out-file>,
# and prints console errors / uncaught exceptions to stdout.
CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
url="$1"; out="$2"
"$CHROME" --headless=new --disable-gpu --no-first-run --user-data-dir="$(mktemp -d)" \
  --virtual-time-budget=4000 --enable-logging=stderr --v=0 --dump-dom "$url" \
  2> "$out.log" > "$out.raw"
# Drop everything that legitimately differs between the static page and the Vite build:
# <style>/<script> blocks, stylesheet/modulepreload links, the feedback-key meta, blank lines.
perl -0pe 's/<style\b.*?<\/style>//gs; s/<script\b.*?<\/script>//gs; s/<link rel="(stylesheet|modulepreload)"[^>]*>//g; s/<meta name="feedback-key"[^>]*>//g; s/^\s*\n//mg' "$out.raw" > "$out"
grep -E 'CONSOLE.*(error|Error)|Uncaught' "$out.log" || true
```

Run: `chmod +x "$BASE/dump.sh"`

- [ ] **Step 4: Serve the baseline and dump ES, EN and promo**

```bash
npx vite preview --outDir "$BASE/dist" --port 4173 --strictPort > "$BASE/preview.log" 2>&1 &
PREVIEW=$!; sleep 3
"$BASE/dump.sh" http://localhost:4173/labs/mcdu-trainer/ "$BASE/es.dom"
"$BASE/dump.sh" http://localhost:4173/en/labs/mcdu-trainer/ "$BASE/en.dom"
"$BASE/dump.sh" "http://localhost:4173/en/labs/mcdu-trainer/?pfdPromo=expand" "$BASE/promo.dom"
kill $PREVIEW
```
Expected: no console error lines printed. `grep -c 'class=' "$BASE/es.dom"` > 100 (the trainer rendered). `grep -o 'href="/en/labs/pfd-trainer/"' "$BASE/promo.dom"` prints one match.

- [ ] **Step 5: Save the heads**

```bash
for l in es en; do
  f="$BASE/dist/$([ $l = en ] && echo en/)labs/mcdu-trainer/index.html"
  perl -0ne 'print $1 if /(<head>.*?<\/head>)/s' "$f" | perl -0pe 's/<style\b.*?<\/style>//gs; s/<script type="module"[^>]*><\/script>//g; s/<link rel="(stylesheet|modulepreload)" crossorigin[^>]*>//g; s/<meta name="feedback-key"[^>]*>//g; s/^\s*\n//mg' > "$BASE/$l.head"
done
wc -l "$BASE"/*.head
```
Expected: both heads ~35 lines; `grep -c 'hreflang' "$BASE/en.head"` = 3.

No commit (nothing in the repo changed).

---

### Task 2: Move the MCDU trainer and shared modules into the Vite build

**Files:**
- Move: `public/labs/mcdu-trainer/index.html` → `labs/mcdu-trainer/index.html`
- Move: `public/labs/mcdu-trainer/feedback.js` → `src/labs/shared/feedback/feedback.js`
- Move: `public/labs/mcdu-trainer/feedback-panel.js` → `src/labs/shared/feedback/feedback-panel.js`
- Move: `public/labs/shared/pfd-promo.js` → `src/labs/shared/pfd-promo.js`
- Create: `src/labs/mcdu/mcdu.css`, `src/labs/mcdu/trainer.js`, `src/labs/mcdu/main.js`
- Modify: `vite.config.js`, `package.json`, `scripts/check-feedback.mjs`
- Delete: `scripts/inject-feedback-key.mjs`

**Interfaces:**
- Consumes: `$BASE/dump.sh`, `$BASE/es.dom`, `$BASE/en.dom` (Task 1).
- Produces: `export function mountFeedback({ key }: { key?: string }): void` in `src/labs/shared/feedback/feedback-panel.js` — wires `#feedbackBtn` to the dialog and un-hides it; no-op when `key` is empty/undefined or `#feedbackBtn` is missing. Task 3 calls it from the PFD.

- [ ] **Step 1: Extract CSS and trainer JS verbatim (before moving the HTML)**

```bash
OLD=public/labs/mcdu-trainer/index.html
sed -n '37p;247p;364,365p;1736p' "$OLD"
```
Expected exactly, in order: `<style>`, `</style>`, `(function(){`, `'use strict';`, `})();`. If any line differs, stop: the line numbers below are wrong.

```bash
mkdir -p src/labs/mcdu src/labs/shared/feedback
sed -n '38,246p' "$OLD" > src/labs/mcdu/mcdu.css
{ printf '%s\n' '// MCDU trainer logic, moved verbatim from the inline script of labs/mcdu-trainer/index.html.' \
    '// ES module = strict mode and module scope, so the former IIFE wrapper and "use strict" are gone.'; \
  sed -n '366,1735p' "$OLD"; } > src/labs/mcdu/trainer.js
node --check src/labs/mcdu/trainer.js
```
Expected: `node --check` prints nothing (parses as an ES module; `package.json` has `"type": "module"`).

- [ ] **Step 2: Move the files with history**

```bash
git mv public/labs/mcdu-trainer/index.html labs/mcdu-trainer/index.html
git mv public/labs/mcdu-trainer/feedback.js src/labs/shared/feedback/feedback.js
git mv public/labs/mcdu-trainer/feedback-panel.js src/labs/shared/feedback/feedback-panel.js
git mv public/labs/shared/pfd-promo.js src/labs/shared/pfd-promo.js
git rm -q scripts/inject-feedback-key.mjs
ls public/labs 2>/dev/null
```
Expected: `ls` prints nothing (both `public/labs/` subdirectories are empty and gone).

- [ ] **Step 3: Trim the HTML**

In `labs/mcdu-trainer/index.html`:
1. Delete line 9 `<meta name="feedback-key" content="">`.
2. Delete the whole `<style>…</style>` block (old lines 37–247).
3. Replace everything from the inline `<script>` (old line 363) through the Vercel insights script (old line 1742) with one line:

```html
<script type="module" src="/src/labs/mcdu/main.js"></script>
```

Do it with:

```bash
f=labs/mcdu-trainer/index.html
perl -0pi -e 's/<meta name="feedback-key" content="">\n//; s/<style>\n.*?<\/style>\n//s; s/<script>\n\(function\(\)\{.*?<script defer src="\/_vercel\/insights\/script.js"><\/script>\n/<script type="module" src="\/src\/labs\/mcdu\/main.js"><\/script>\n/s' "$f"
grep -c '<style\|<script' "$f"; tail -4 "$f"; wc -l "$f"
```
Expected: count `2` (the JSON-LD script and the module script); tail shows the module script, a blank line, `</body>`, `</html>`; about 150 lines.

- [ ] **Step 4: Make `mountFeedback` the panel's API**

In `src/labs/shared/feedback/feedback-panel.js` replace lines 1–2 (header comment) with:

```js
// Feedback panel shared by the MCDU and PFD trainers (Web3Forms). Call mountFeedback({ key }) once the page has a
// hidden #feedbackBtn; without a key (VITE_WEB3FORMS_FEEDBACK_KEY unset) it does nothing and the button stays hidden.
```

Replace lines 26–30:

```js
const accessKey = document.querySelector('meta[name="feedback-key"]')?.content.trim();
const openButton = document.getElementById('feedbackBtn');
if (accessKey && openButton) init();

function init() {
```

with:

```js
/** Wires #feedbackBtn to the feedback dialog. No-op without a key or without the button. */
export function mountFeedback({ key } = {}) {
  const accessKey = (key || '').trim();
  const openButton = document.getElementById('feedbackBtn');
  if (accessKey && openButton) init(accessKey, openButton);
}

function init(accessKey, openButton) {
```

`init`'s body is unchanged: it already refers to `accessKey` (submit payload) and `openButton` (click handler, `hidden = false`), now as parameters.

Run: `node --check src/labs/shared/feedback/feedback-panel.js && grep -n 'feedback-key\|^if (' src/labs/shared/feedback/feedback-panel.js`
Expected: no grep output.

- [ ] **Step 5: Write the entry**

Create `src/labs/mcdu/main.js`:

```js
// MCDU trainer entry. The trainer is vanilla JS; this only wires styles, analytics and the shared lab modules.
import { inject } from '@vercel/analytics'
import './mcdu.css'
import './trainer.js'
import { mountFeedback } from '../shared/feedback/feedback-panel.js'
import '../shared/pfd-promo.js'

mountFeedback({ key: import.meta.env.VITE_WEB3FORMS_FEEDBACK_KEY })
inject()
```

Import order matters: `trainer.js` runs first (it translates the static markup for `/en/`), then the panel and the promo, which add their own DOM — the same order as the old script tags.

- [ ] **Step 6: Wire build config and the feedback check**

`vite.config.js` — replace the comment and the `input` block:

```js
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
```

`package.json` `scripts.build`:

```json
"build": "vite build && node scripts/localize-heads.mjs",
```

`scripts/check-feedback.mjs` line 1 → `// Assertions for src/labs/shared/feedback/feedback.js. Run: node scripts/check-feedback.mjs` and line 5 → `} from '../src/labs/shared/feedback/feedback.js';`

- [ ] **Step 7: Build, check, and diff the DOM against the baseline**

```bash
BASE=/private/tmp/claude-501/-Users-n001-Documents-Development-Qubits-dev-Qub-Its-Landing-Page/264fed7a-09fa-40d3-a3e4-6170862727c6/scratchpad/mcdu-baseline
npm run build && node scripts/check-feedback.mjs
ls dist/labs/mcdu-trainer/index.html dist/en/labs/mcdu-trainer/index.html
grep -c 'feedback-key' dist/labs/mcdu-trainer/index.html
npx vite preview --port 4173 --strictPort > /dev/null 2>&1 & PREVIEW=$!; sleep 3
"$BASE/dump.sh" http://localhost:4173/labs/mcdu-trainer/ "$BASE/new-es.dom"
"$BASE/dump.sh" http://localhost:4173/en/labs/mcdu-trainer/ "$BASE/new-en.dom"
kill $PREVIEW
diff "$BASE/es.dom" "$BASE/new-es.dom" && diff "$BASE/en.dom" "$BASE/new-en.dom" && echo DOM-EQUAL
grep -o 'id="feedbackBtn"[^>]*' "$BASE/new-es.dom"
```
Expected: build OK with `localize-heads: wrote dist/en/labs/mcdu-trainer/index.html`; `check-feedback: all assertions passed`; both files listed; `feedback-key` count `0`; no console errors; `DOM-EQUAL`; the feedback button line still contains `hidden` (no key). If the diff is not empty, fix the move (do not edit the baseline) and re-run.

- [ ] **Step 8: Commit**

```bash
git add -A labs/mcdu-trainer src/labs/mcdu src/labs/shared public scripts vite.config.js package.json
git status --short
git commit -m "refactor: build the MCDU trainer with Vite

Move the static page into a Vite entry: markup in labs/mcdu-trainer/,
CSS and trainer logic extracted verbatim to src/labs/mcdu/. The feedback
panel and PFD promo move to src/labs/shared/ and are bundled; the panel
takes the Web3Forms key from import.meta.env via mountFeedback(), so the
post-build inject-feedback-key script is gone.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
Expected: status before commit lists only the paths from this task's **Files** block.

---

### Task 3: PFD trainer uses the bundled feedback panel

**Files:**
- Modify: `src/labs/pfd/App.svelte` (feedback block, ~lines 166–182)
- Modify: `labs/pfd-trainer/index.html` (line 9)

**Interfaces:**
- Consumes: `mountFeedback({ key })` from `src/labs/shared/feedback/feedback-panel.js` (Task 2).

- [ ] **Step 1: Confirm the current PFD import is now broken**

Run: `grep -n "panelUrl\|feedback-key" src/labs/pfd/App.svelte labs/pfd-trainer/index.html`
Expected: hits for `/labs/mcdu-trainer/feedback-panel.js` (a file that no longer exists after Task 2) and the `feedback-key` meta/attribute.

- [ ] **Step 2: Replace the runtime import**

In `src/labs/pfd/App.svelte` change the comment

```js
  // ---- feedback (shared module of the MCDU trainer, same Web3Forms key)
```
to
```js
  // ---- feedback (shared with the MCDU trainer, same Web3Forms key; lazy chunk, only when a key is set)
```

and replace

```js
    if (feedbackKey) {
      document.querySelector('meta[name="feedback-key"]')?.setAttribute('content', feedbackKey);
      // Path in a variable: it is a public/ file, so Vite must not try to analyse (dev) or bundle (build) the import.
      const panelUrl = '/labs/mcdu-trainer/feedback-panel.js';
      tick().then(() => import(/* @vite-ignore */ panelUrl)).catch(() => {});
    }
```
with
```js
    if (feedbackKey) {
      tick()
        .then(() => import('../shared/feedback/feedback-panel.js'))
        .then((m) => m.mountFeedback({ key: feedbackKey }))
        .catch(() => {});
    }
```

In `labs/pfd-trainer/index.html` delete line 9: `<meta name="feedback-key" content="">`.

- [ ] **Step 3: Build and check**

```bash
npm run build 2>&1 | grep -iE 'error|warn|feedback-panel'
grep -rn "feedback-key\|@vite-ignore\|mcdu-trainer/feedback" src labs scripts
for s in check-feedback check-pfd check-pfd-content check-pfd-exercises; do node scripts/$s.mjs | tail -1; done
```
Expected: no build errors or warnings; the grep finds nothing; all four checks pass. (Without a key the panel import is dead code behind `if (feedbackKey)` but Vite still emits it as its own chunk — that is fine.)

- [ ] **Step 4: Commit**

```bash
git add src/labs/pfd/App.svelte labs/pfd-trainer/index.html
git commit -m "refactor: load the shared feedback panel as a bundled chunk in the PFD trainer

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: End-to-end verification and docs

**Files:**
- Modify: `AGENTS.md`, `docs/superpowers/specs/2026-10-09-pfd-trainer-design.md` (roadmap line), `docs/superpowers/specs/2026-10-08-mcdu-vite-migration-design.md` (status line)
- Temporary (never committed): `landing-page-svelte/.env.local`

**Interfaces:**
- Consumes: `$BASE/*` (Task 1), the build from Tasks 2–3.

- [ ] **Step 1: Head diff against the baseline**

```bash
BASE=/private/tmp/claude-501/-Users-n001-Documents-Development-Qubits-dev-Qub-Its-Landing-Page/264fed7a-09fa-40d3-a3e4-6170862727c6/scratchpad/mcdu-baseline
npm run build >/dev/null
for l in es en; do
  f="dist/$([ $l = en ] && echo en/)labs/mcdu-trainer/index.html"
  perl -0ne 'print $1 if /(<head>.*?<\/head>)/s' "$f" | perl -0pe 's/<style\b.*?<\/style>//gs; s/<script type="module"[^>]*><\/script>//g; s/<link rel="(stylesheet|modulepreload)" crossorigin[^>]*>//g; s/<meta name="feedback-key"[^>]*>//g; s/^\s*\n//mg' > "$BASE/new-$l.head"
  diff "$BASE/$l.head" "$BASE/new-$l.head" && echo "$l head equal"
done
```
Expected: `es head equal`, `en head equal`. Any remaining difference must be explained (e.g. Vite re-serialising an attribute) and listed in the final report; SEO tags (title, description, canonical, hreflang, og/twitter, JSON-LD) must be identical.

- [ ] **Step 2: Re-run DOM diffs and all checks on the final build**

```bash
npx vite preview --port 4173 --strictPort > /dev/null 2>&1 & PREVIEW=$!; sleep 3
"$BASE/dump.sh" http://localhost:4173/labs/mcdu-trainer/ "$BASE/new-es.dom"
"$BASE/dump.sh" http://localhost:4173/en/labs/mcdu-trainer/ "$BASE/new-en.dom"
"$BASE/dump.sh" "http://localhost:4173/en/labs/mcdu-trainer/?pfdPromo=expand" "$BASE/new-promo.dom"
"$BASE/dump.sh" http://localhost:4173/labs/pfd-trainer/ "$BASE/new-pfd.dom"
kill $PREVIEW
diff "$BASE/es.dom" "$BASE/new-es.dom" && diff "$BASE/en.dom" "$BASE/new-en.dom" && diff "$BASE/promo.dom" "$BASE/new-promo.dom" && echo DOM-EQUAL
for s in check-feedback check-pfd check-pfd-content check-pfd-exercises; do node scripts/$s.mjs | tail -1; done
```
Expected: no console errors (including the PFD page); `DOM-EQUAL`; all checks pass.

- [ ] **Step 3: Manual browser pass (Chrome, `npm run preview`)**

At 1280px and at 390px (DevTools device mode), on `/labs/mcdu-trainer/` and `/en/labs/mcdu-trainer/`:
- complete the first task of level 1 → toast shows, level progress advances;
- open a task hint and its "why" note; hover a glossary-marked term (desktop) → tooltip;
- open the Glossary dialog, search a term, close with Esc;
- on 390px open and close the bottom sheet;
- `?pfdPromo=expand` → promo tab expands and links to the PFD trainer in the page language;
- DevTools console: no errors; Network: no 404s.

- [ ] **Step 4: Feedback with a key (never submit)**

```bash
echo 'VITE_WEB3FORMS_FEEDBACK_KEY=local-test-key' > .env.local
npm run build >/dev/null && npx vite preview --port 4173 --strictPort > /dev/null 2>&1 & sleep 6
```
In Chrome: on `/labs/mcdu-trainer/` and `/labs/pfd-trainer/` the Feedback button is visible; clicking it opens the dialog; Esc closes it. Do **not** press Send. Then:

```bash
kill %1 2>/dev/null; pkill -f 'vite preview' ; rm .env.local && git status --short
```
Expected: `git status` shows no `.env.local` and no other changes.

- [ ] **Step 5: Dev server**

```bash
npx vite --port 5173 --strictPort > /dev/null 2>&1 & DEV=$!; sleep 3
BASE=/private/tmp/claude-501/-Users-n001-Documents-Development-Qubits-dev-Qub-Its-Landing-Page/264fed7a-09fa-40d3-a3e4-6170862727c6/scratchpad/mcdu-baseline
"$BASE/dump.sh" "http://localhost:5173/labs/mcdu-trainer/?lang=en" "$BASE/dev-en.dom"
kill $DEV
grep -c 'lang="en"' "$BASE/dev-en.dom"
```
Expected: no console errors; count ≥ 1 (the `<html lang="en">` set by the trainer).

- [ ] **Step 6: Update docs**

`AGENTS.md`:
- Repo table row stays; in **Stack Notes** replace the Vite multi-page bullet with:
  `- Vite is multi-page: \`index.html\` (landing), \`labs/mcdu-trainer/index.html\` (MCDU trainer, vanilla JS in \`src/labs/mcdu/\`) and \`labs/pfd-trainer/index.html\` (PFD trainer) are separate entries in \`vite.config.js\``
- Replace the **Feedback Panel** section body with:

```markdown
Both trainers have a "Feedback" button that submits to Web3Forms. Shared module in `src/labs/shared/feedback/`: panel UI `feedback-panel.js` (`mountFeedback({ key })`), logic `feedback.js`.

- Key: `VITE_WEB3FORMS_FEEDBACK_KEY` (Vercel env vars, or `landing-page-svelte/.env.local`), read through `import.meta.env` at build time. Without a key the button stays hidden; a new key needs a new build/deploy. Never commit the key.
- Use a dedicated feedback key with **hCaptcha enabled** in the Web3Forms dashboard — it is the only anti-spam layer a direct API caller cannot skip. Rotate the key if it gets abused.
- Logic checks: `node scripts/check-feedback.mjs` (from `landing-page-svelte/`).
```

- In **PFD Trainer**: replace the feedback bullet with `- Feedback: with \`VITE_WEB3FORMS_FEEDBACK_KEY\` set, the page lazy-loads the shared panel (\`src/labs/shared/feedback/\`).` and change `public/labs/shared/pfd-promo.js` to `src/labs/shared/pfd-promo.js`; replace "unlike the static MCDU trainer" with "the MCDU trainer is a vanilla-JS Vite entry".

`docs/superpowers/specs/2026-10-09-pfd-trainer-design.md` roadmap: prefix the MVP2 migration item with `(done 2026-10-08, see 2026-10-08-mcdu-vite-migration-design.md)`.

`docs/superpowers/specs/2026-10-08-mcdu-vite-migration-design.md`: change the `Status:` line to `Status: implemented (2026-10-08).`

Run: `grep -rn "inject-feedback-key\|public/labs" ../AGENTS.md src labs scripts vite.config.js package.json`
Expected: nothing.

- [ ] **Step 7: Commit**

```bash
cd .. && git add AGENTS.md docs/superpowers/specs && git commit -m "docs: document the MCDU trainer as a Vite entry

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
