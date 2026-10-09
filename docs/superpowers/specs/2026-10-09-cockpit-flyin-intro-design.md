# Labs — cockpit fly-in intro (MVP2, part 4)

Status: implemented (2026-10-09). Implementation notes: overlay classes are `labs-intro*` (`.intro` already styles the
level cards); `buildA320`'s nose cone is open-ended, because its base disc walled off the flight deck from inside.
After visual review the path changed: the flight deck faces aft, so flying in through the windshield forced a
180° turn of the view. The camera now flies up to the glass, a dark veil (`veilAt`) hides a cut to the captain's
eye point, and it moves in to the target screen. The target screen shows a stylised PFD / MCDU MENU texture (not
plain green), the other displays a dim "powered" tint, a nose `bulkhead` closes the cabin below the glareshield,
and portrait screens widen the vertical FOV (`fovFor`, ≤ 80°). Time starts at the first animation frame, and the
overlay always fades out (it catches the click after a skipping tap). Fourth MVP2 sub-project from `2026-10-09-pfd-trainer-design.md`
(done: MCDU Vite migration, PFD 3D exterior view, MCDU 3D F-PLN map; later: PFD Build mode).

All paths are relative to `landing-page-svelte/` unless stated.

## Goal

A short 3D intro, shared by both trainers, places the instrument in its context: the camera starts outside
the A320, flies to the nose, passes through the windshield and stops in front of the instrument the page
teaches (captain's PFD on the PFD trainer, captain's MCDU on the MCDU trainer). The target screen lights up,
then the overlay fades out and reveals the real page.

Success means:

- First visit to either trainer plays the intro once (≈ 3.5 s + 0.4 s fade); later visits do not.
- An "Intro" header button replays it on demand, on both pages.
- It can be skipped at any moment (button, Esc, any key, click) and focus returns to the page.
- It never blocks the page: no WebGL, `prefers-reduced-motion: reduce`, or `three` not loaded within 2 s →
  no intro, page as today.
- `three` is still lazy: the page's own entry chunk does not import it.

## Decisions

| Topic | Decision | Why |
|---|---|---|
| Form | Full-screen overlay with a WebGL canvas; final cross-fade to the page | Robust across layouts (collapsed panel, bottom sheet, scroll). A "match cut" to the real element's rectangle was rejected as fragile. |
| Model | `buildA320` (existing) + new procedural `buildCockpit(THREE)` | No assets, shared with the other 3D views. |
| Trigger | Auto on first visit (`localStorage` `qubits.labs.introSeen`, shared by both trainers) + header button | One impression per user; three's download cost only once. |
| Overrides | `?intro=1` forces, `?intro=0` suppresses; `?debug3d=nowebgl` makes the view fail like the other 3D views | Testing and sharing links. |
| Code | Vanilla JS in `src/labs/shared/intro/`, used by the Svelte PFD and the vanilla MCDU | Same pattern as `shared/three/aircraft.js` and the feedback panel. |

## Modules

```
src/labs/shared/three/cockpit.js   buildCockpit(THREE): THREE.Group
src/labs/shared/intro/path.js      pure camera path, no three import
src/labs/shared/intro/flyin.js     createFlyin(canvas, opts) — the only module importing three
src/labs/shared/intro/intro.js     maybeIntro(opts) — eager, three-free overlay + decision
src/labs/shared/intro/intro.css    overlay styles (imported by intro.js)
```

### `cockpit.js`

`export function buildCockpit(THREE)` returns a `Group` named `flightDeck` (not `cockpit`: `buildA320` already has a `cockpit` window mesh), in the same metres/axes as
`buildA320` (nose −z, right +x, up +y), meant to be added to the aircraft group as is. Children (all named):

- `shell`: dark interior (`BackSide` cylinder, radius 1.9 m) from z = −12.5 to −15.6 so the cabin is closed
  when the camera is inside the fuselage.
- `glareshield`: dark box across the panel top.
- `panel`: main instrument panel, a box facing +z (towards the pilots) at z ≈ −15.2.
- Six displays as thin boxes on the panel face, left to right: `pfdL`, `ndL`, `ewd`, `sd` (below `ewd`),
  `ndR`, `pfdR`. Size ≈ 0.2 × 0.2 m, unlit near-black screens (`MeshBasicMaterial`, colour `0x0b1015`).
- Pedestal with `mcduL`, `mcduR` (screens on the pedestal's sloped face, ≈ 0.12 × 0.10 m).
- Every display mesh has `userData.screen = true`; `flyin.js` lights the target by switching its material
  colour to the trainer green (`0x45df80`) at the end of the path.

All parts lie inside the fuselage radius (2 m) and between z = −12.5 and −15.6.

`export const SCREENS = { pfd: 'pfdL', mcdu: 'mcduL' }` maps targets to part names.

### `path.js`

No three import (runs in Node).

- `export const DURATION = 3.5` (seconds) and `export const FADE = 0.4`.
- `export function keyframes(target, screenPos, screenNormal)` → array of
  `{ t, pos: [x, y, z], look: [x, y, z] }` with t strictly increasing from 0 to 1:
  1. t = 0: outside, front-left 3/4, ≈ 45 m from the CG, looking at the aircraft centre;
  2. t ≈ 0.45: ahead of the nose and slightly above (≈ 8 m in front of the windshield), looking at the windshield;
  3. t ≈ 0.7: just through the windshield, above the glareshield and behind the panel (≈ (0, 1.0, −14.3), inside
     the fuselage), looking down at the panel;
  4. t = 1: 0.45 m in front of the target screen along its normal (0.35 m for `mcdu`), looking at its centre.
- `export function cameraAt(frames, t)` → `{ pos, look }`: clamps t to [0, 1], applies smoothstep easing
  to the overall t, then interpolates position with Catmull-Rom through the keyframes and `look` linearly
  between neighbouring keyframes.

### `flyin.js`

`export async function createFlyin(canvas, { target = 'pfd', debugFail = false } = {})` dynamically imports
`three` by name, builds renderer (pixel ratio `min(dpr, 2)`, antialias), scene (sky colour, hemisphere +
directional light, ground grid far below), `buildA320` with `buildCockpit` added, and a perspective camera
(fov 50). Throws `Error('webgl-unavailable')` if no WebGL context (or `debugFail`). Returns:

- `play()` → `Promise<void>`: runs the path with `requestAnimationFrame` over `DURATION`; in the last 15 %
  of t the target screen lights up; resolves when t reaches 1. The exterior `cockpit` window mesh of
  `buildA320` is hidden once the camera reaches it (camera z > −16.4) so it does not cover the view.
- `skip()`: stops the loop and resolves the pending `play()`.
- `resize(w, h)`, `dispose()` (renderer, geometries, materials).
- `frames` getter (frames rendered) for checks.

### `intro.js`

`export async function maybeIntro({ target, lang = 'es', force = false } = {})`:

1. Decide: `?intro=0` → return. Show if `force` or `?intro=1` or `introSeen` not set. Skip (and do not mark
   seen) if `matchMedia('(prefers-reduced-motion: reduce)').matches` and not forced by the user (button or
   `?intro=1`).
2. Mount the overlay at once (dark background, title "Entrando a la cabina del A320…" / "Entering the A320
   cockpit…", "Saltar intro" / "Skip intro" button), `role="dialog"`, `aria-modal="true"`, `aria-label`,
   focus on the skip button. Remember `document.activeElement` to restore later.
3. Race `import('./flyin.js').then(m => m.createFlyin(...))` against a 2 s timeout. On timeout, WebGL
   failure or import error: remove the overlay, restore focus, return (no error UI — the intro is optional).
   Mark `introSeen` in every outcome where the overlay was shown, so a slow network does not retry forever.
4. `await play()` (or until skipped by the button, Esc, any keydown, or pointerdown on the overlay), then
   add a fade class (opacity → 0 over `FADE`), remove the overlay, `dispose()`, restore focus.
5. Only one intro at a time: a second call while one is running returns immediately.
6. `localStorage` access in try/catch (private mode); without storage the intro behaves as first visit
   only when forced, never auto (avoids replaying on every load).

Under `?debug3d`, `window.__intro = () => ({ state: 'idle'|'loading'|'playing'|'done', frames })`.

## Page integration

- PFD (`src/labs/pfd/main.js`): after `mount`, `maybeIntro({ target: 'pfd', lang })` with the language from
  `detectLang()`. `App.svelte`: header button "Intro" (`data-intro`, title "Ver intro de cabina" /
  "Watch cockpit intro") calling `maybeIntro({ target: 'pfd', lang, force: true })`. Strings in `i18n.js`.
- MCDU (`src/labs/mcdu/main.js`): `maybeIntro({ target: 'mcdu', lang })` with `lang` from
  `document.documentElement.lang` (set by `trainer.js`). `labs/mcdu-trainer/index.html`: header button
  `#introBtn` with `data-i18n="intro"` / `data-i18n-attr="title:introTitle"`; keys added to `STATIC_EN` in
  `trainer.js`; click handler wired in `main.js`.
- The overlay is above everything (z-index over the bottom sheet and the glossary), covers the viewport with
  `position: fixed; inset: 0`, and prevents page scroll while shown.

## Testing

- `node scripts/check-intro.mjs`:
  - `buildCockpit(THREE)`: all named parts exist; every part's bounding box lies within radius 2 m of the
    fuselage axis and z ∈ [−15.7, −12.4]; `SCREENS` names exist and are screens.
  - `keyframes`: t strictly increasing, first at 0, last at 1; first position farther than 30 m from the CG and
    outside the fuselage; last position within 0.6 m of the target screen and in front of it (dot with normal
    > 0); `cameraAt(frames, 1).look` = screen centre; `cameraAt` with t < 0 or > 1 clamps; all outputs finite.
  - Combined with the real model: the screen positions taken from `buildCockpit` added to `buildA320`.
- CDP smoke (scratch): first load of each trainer with a clean profile shows the overlay and requests the
  three chunk; after it ends the overlay is gone, `introSeen` is set and focus is on the page; reload → no
  overlay and no three chunk; header button replays it; Esc skips (frames stop growing); `?debug3d=nowebgl`
  → no overlay left, no console errors; emulated reduced motion → no auto intro; 390 px: overlay covers the
  viewport, no horizontal overflow.
- Regression: MCDU DOM-diff baseline differs only by the new header button; existing checks and smoke
  scripts pass; `npm run build` without warnings.

## Out of scope

Sound, photo-real cockpit, interactive cockpit hub (choosing PFD/MCDU in 3D), match cut to the real element,
showing live PFD/MCDU content on the 3D screens.
