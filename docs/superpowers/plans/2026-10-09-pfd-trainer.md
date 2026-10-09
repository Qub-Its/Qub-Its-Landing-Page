# PFD Trainer — MVP1 implementation plan

Status: MVP1 implemented (2026-10-09). Deviations: Task B added `setLever`, `setFlaps`, `toggleGearLever` and a
`flight.lever` field; integration added `scripts/check-pfd-exercises.mjs`.

Spec: `docs/superpowers/specs/2026-10-09-pfd-trainer-design.md`. All paths below are relative to
`landing-page-svelte/`. Svelte 5 runes only (`$state`, `$derived`, `$props`, `$effect`); no new runtime
dependencies unless the task says so. Plain JS with JSDoc (`checkJs` is on).

## Done (foundation, by the design owner)

- Vite multi-page entry `labs/pfd-trainer/index.html` → `src/labs/pfd/main.js` (`vite.config.js`).
- `src/seo.js` (`seo.pfd`), `scripts/localize-heads.mjs` (English head), `vercel.json` rewrites,
  `public/sitemap.xml`, home Labs entry in `src/App.svelte`.
- Contracts: `src/labs/pfd/lib/schema.js` (flight state shape) and `src/labs/pfd/lib/layout.js`
  (SVG regions, scales, colours). **Do not change these two files**; if a task truly needs a new state
  field, add it in your own module and report it.
- `src/labs/pfd/components/pfd/Pfd.svelte` composes the instruments; each instrument receives `{ s }`
  (the live `FlightState`) and draws only inside its region.

## Shared conventions

- Every clickable PFD element is wrapped in `<g data-part="<id>">`. Part ids (content for each one is
  written in `content/parts.js`):

  | Instrument | Part ids |
  |---|---|
  | Attitude | `attitude`, `pitchLadder`, `bankScale`, `aircraftSymbol`, `fdBars`, `sideslip`, `protections` |
  | Speed | `speedTape`, `speedReadout`, `speedTrend`, `speedTarget`, `vls`, `vaProt`, `vaMax`, `vmax`, `greenDot`, `sfSpeeds`, `v1`, `mach` |
  | Altitude | `altTape`, `altReadout`, `altSelected`, `baro`, `landingElev` |
  | VSI | `vsi` |
  | Heading | `headingTape`, `trackDiamond`, `hdgSelected` |
  | FMA | `fma`, `fmaAthr`, `fmaVertical`, `fmaLateral`, `fmaApproach`, `fmaEngagement` |
  | ILS / RA | `locScale`, `gsScale`, `ilsInfo`, `radioAlt` |

  Nest specific parts inside the general one (e.g. `vls` inside `speedTape`); `closest('[data-part]')`
  then picks the most specific.
- Text in the SVG uses `C.font` and `FONT` sizes from `layout.js`; colours only from `C`.
- Instruments are pure views: they never mutate `s`.

## Store API — `src/labs/pfd/lib/flight.svelte.js` (Task B)

```js
export const flight;                         // $state(createInitialState()) — mutated in place, never reassigned
export function start(): void;               // rAF loop, fixed 1/30 s steps, pauses on document.hidden
export function stop(): void;
export function togglePause(): void;
export function loadScenario(id: string): void;   // ids from SCENARIOS
export function setStick(pitch: number, roll: number): void;   // −1…1; AP disconnects if |input| > 0.5
export function setThrust(detent: 'IDLE'|'CL'|'FLX'|'TOGA'): void;
export function onTick(fn: (s, dt) => void): () => void;       // after every sim step; returns unsubscribe
export const fcu: {
  spdTurn(d), spdPush(), spdPull(), spdMachToggle(),
  hdgTurn(d), hdgPush(), hdgPull(),
  altTurn(d /* ±1 click */, big /* true = 1000 ft, false = 100 ft */), altPush(), altPull(),
  vsTurn(d /* ±1 click = 100 fpm */), vsPush() /* level off: V/S 0 */, vsPull(),
  ap1(), ap2(), athr(), fd(), loc(), appr()
};
export const SCENARIOS: { id: string, name: {es: string, en: string} }[];
```

Pure logic lives in `lib/sim.js` (`step(state, dt)`), `lib/autoflight.js` (modes, FMA, FD, A/THR) and
`lib/scenarios.js` (`SCENARIO_LIST`, `applyScenario(state, id)`), importable from Node.

Scenarios: `cruise` (FL100, 250 kt, AP1 + A/THR, HDG 090), `climb` (5000 ft, 250 kt, flaps 0, CLB),
`approach` (3000 ft QNH, 160 kt, flaps 2, gear down, HDG 040 intercepting a LOC on course 070 at ~10 NM,
ILS IMRC 109.30 visible), `takeoff` (runway, 0 kt, flaps 1+F, thrust IDLE, FD on, AP off; TOGA starts the
roll, SRS/RWY on FMA, V1/VR/V2 = 140/145/150), `manual` (FL100, AP and A/THR off, for hand-flying).

## Tasks (parallel, disjoint files)

### A1 — Attitude, heading, FMA, ILS/RA instruments
Files: `components/pfd/Attitude.svelte`, `HeadingTape.svelte`, `Fma.svelte`, `Ils.svelte`.
Spec section "PFD content". Attitude: sphere rotated by bank and translated by pitch (clipPath to the
region, Airbus-style shape: rectangle with the top/bottom cut as arcs is fine), ladder every 2.5° (labels
10/20/30), bank scale arc with ticks 0/10/20/30/45, green `=` protection marks at ±67° and on the ladder at
+30/−15, yellow fixed aircraft symbol (wings + center square) at (CX, CY), roll index triangle + sideslip
trapezoid, green FD bars from `s.fd`. Heading tape with 5°/10° ticks and labels every 10° (`09`, `10`…
style), yellow reference line, green track diamond, cyan selected-heading triangle (or number at edge when
off-scale) when `!s.fcu.hdgManaged`. FMA: 5 columns separated by grey vertical lines, rows per schema, green
active / cyan armed / white engagement, white box for 10 s after `changedAt`. ILS: LOC scale (horizontal)
and G/S scale (vertical, right of the sphere) with magenta diamonds clamped at ±2 dots, ident/freq at
`ilsInfo` region, radio altitude readout under the aircraft symbol when `s.radioAlt !== null`.

### A2 — Speed, altitude and VSI instruments
Files: `components/pfd/SpeedTape.svelte`, `AltitudeTape.svelte`, `Vsi.svelte`.
Speed tape: grey tape, ticks every 10 kt, labels every 20 kt (3 digits), no scale below 30 kt, yellow
reference line + readout window at CY, trend arrow from `s.iasTrend`, target speed (magenta when
`s.fcu.spdManaged`, cyan otherwise; number above/below the tape when off-scale), VLS amber strip, Vα prot
amber/black barber, Vα max red strip, VMAX red/black barber (from vmax upward), green dot (green circle),
S/F letters, V1 (`1` cyan), Mach readout in `mach` region when `s.mach ≥ 0.5`. Altitude tape: ticks every
100 ft, labels every 500 ft (hundreds, e.g. `100` for 10 000 ft, `95`…), drum window at CY with the
thousands/hundreds and a rolling 20-ft drum, selected altitude cyan (in tape, or numeric above/below
when off-scale; `FL100` style when `s.baro.std`), baro box (`QNH 1013` cyan-ish / `STD` cyan), landing
elevation blue bar when radio altitude is shown. VSI: Airbus non-linear scale (0, ±500/1000, ±1500/2000,
±6000), labels 1 2 6, green needle from a pivot off the right edge, digital value (hundreds) in a box when
|vs| ≥ 200, amber beyond 6000.

### B — Simulation, autoflight, store, FCU and controls
Files: `lib/sim.js`, `lib/autoflight.js`, `lib/scenarios.js`, `lib/flight.svelte.js` (replace stub),
`components/Fcu.svelte`, `components/Controls.svelte`, `scripts/check-pfd.mjs`.
Spec section "Simulation model". FCU UI: a dark FCU strip with 4 windows (SPD/MACH, HDG, ALT, V/S) in
B612 Mono amber-on-black LED style (dashes + white dot when managed), each with −/+ buttons, a "push"
and a "pull" button (mobile friendly), plus AP1, AP2, A/THR, LOC, APPR, FD pushbuttons with a green bar
when on. Mouse wheel over a window turns the knob. Controls: a sidestick pad (pointer drag inside a
circle, springs back to 0 on release, keyboard arrows also drive it while the page has focus and no input
is focused), thrust lever detents IDLE/CL/FLX/TOGA as a segmented control, a scenario picker and
pause/reset. Labels via a `lang` prop (`'es'|'en'`) with a small local copy table.
`node scripts/check-pfd.mjs` asserts at least: level flight is stable for 60 s in `cruise`; turning the
ALT knob to 12000 and pulling gives OP CLB then ALT* then ALT around 12000 ±50 within 4 min; HDG select
270 with AP turns to 270 ±2; bank with neutral stick > 33° returns to 33°; `approach` with APPR armed
reaches LOC and G/S active; speeds table sane (vaMax < vaProt < vls < vmax).

### C — Page shell, explain mode, guide, exercises, glossary, feedback
Files: `App.svelte` (replace stub), `pfd.css` (replace stub), `i18n.js`, `content/parts.js`,
`content/glossary.js`, `content/exercises.js`, `content/guide.js`, `components/ExplainCard.svelte`,
`components/Panel.svelte`, `components/Exercises.svelte`, `components/Glossary.svelte`,
`components/TaskBar.svelte`, `scripts/check-pfd-content.mjs`.
Layout and look as the MCDU trainer (`public/labs/mcdu-trainer/index.html` — copy its header, panel,
bottom-sheet, glossary dialog, toast and level-card styles). Header: plate `LABS`, title "Entrenador PFD
A320", subtitle, buttons `? Modo explicar`, `Glosario`, `Feedback` (hidden without key), ES/EN link,
"MCDU →" link to the MCDU trainer, `← Qub-its` (to `/#labs` or `/en/#labs`). Main: Pfd + Fcu + Controls
on the left; panel with tabs Guía / Ejercicios on the right (bottom sheet ≤ 980px). Explain mode: click a
part → `ExplainCard` in the panel (title, what, how to read, why) and `highlight` on the PFD. Language from
path (`/en/…`), update `document.title`/`lang` from `seo.pfd` like the landing does. Exercises: ≥ 6 tasks in
3 levels (Leer / Volar / Automatismos) with `check(state, ctx)` pure functions and optional `hold`
seconds, evaluated via `onTick`; each has task, hint, why, the scenario it loads and optional `part` to
highlight. Progress in `localStorage` (try/catch). Feedback: if `import.meta.env.VITE_WEB3FORMS_FEEDBACK_KEY`
is set, write it to `<meta name="feedback-key">`, render a `#feedbackBtn` and dynamically
`import(/* @vite-ignore */ '/labs/mcdu-trainer/feedback-panel.js')`; copy the `.fb-*` styles. Disclaimer
footer (fictional data, not for real flight training). Calls `start()` on mount.
`node scripts/check-pfd-content.mjs`: every part id used in the table above has ES+EN content, every
exercise has ES+EN text and a scenario that exists, glossary terms unique.

### D — Promo tab in the MCDU trainer
Files: `public/labs/shared/pfd-promo.js` (new, self-contained ES module that injects its own `<style>`),
one `<script type="module">` tag in `public/labs/mcdu-trainer/index.html`, and one line where the MCDU
trainer marks a task complete: `document.dispatchEvent(new CustomEvent('mcdu:task-complete'))`.
Behaviour: spec section "Promo on the MCDU Trainer".

## Integration (design owner)

Wire everything, `npm run build`, run both check scripts, check the page in Chromium (desktop + phone),
review against the spec, update `AGENTS.md`, commit.
