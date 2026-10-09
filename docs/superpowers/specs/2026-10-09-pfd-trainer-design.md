# PFD Trainer — design

Date: 2026-10-09
Status: approved in conversation (MVP1 in build, MVP2/MVP3 planned)

## Goal

A second Qub-its Lab next to the MCDU Trainer: an interactive trainer that teaches how to read and use the
**Primary Flight Display of the Airbus A320**. Same audience and tone as the MCDU Trainer (student pilots,
sim enthusiasts), same "explain" and "exercises" learning model, bilingual ES/EN, fictional data, not for real
flight training.

## Decisions

| Topic | Decision | Reason |
|---|---|---|
| Route | `/labs/pfd-trainer/` and `/en/labs/pfd-trainer/` | Mirrors `/labs/mcdu-trainer/`. |
| Stack | Svelte 5 page as a **second Vite entry** (multi-page), not an SPA route | Own HTML/head for SEO, light load, native `import.meta.env`, reuse of the parent framework. |
| Rendering | Reactive **SVG** driven by runes; no canvas or chart lib | Crisp at any size, every element is clickable for "explain", cheap. |
| State | One reactive flight state object; pure simulation logic in plain JS | 2D PFD, FCU, exercises and the future 3D view all read the same source; logic testable in Node. |
| Aircraft | A320 only in MVP1; layout/rules isolated so a 737 "skin" fits in MVP3 | Coherent with the MCDU Trainer. |
| MCDU Trainer | Untouched in MVP1 except the promo tab | Avoid risk on a production page. Light migration to Vite in MVP2. |
| 3D | Threlte (Three.js for Svelte) in MVP2, lazy-loaded | Keeps MVP1 small; 3D only downloads on demand. |
| Feedback | Reuse the MCDU feedback panel module (public file) with the same key | One implementation, one key. |
| Branding | "A320" as a nominative reference only; no Airbus/Boeing logos or liveries | Trademark safety. |

## Modes (MVP1)

1. **Explorar / Explore** — the PFD runs live. With "Modo explicar" on, clicking or tapping any element
   (speed tape, VLS strip, FMA column, FD bars…) shows a card with what it is, how to read it and why it
   matters. Elements are marked with `data-part="<id>"` in the SVG.
2. **Volar / Fly** — the user flies with an on-screen sidestick (pointer drag) or keyboard (arrows), thrust
   levers (IDLE / CL / FLX-MCT / TOGA) and a simplified **FCU** (SPD/MACH, HDG, ALT, V/S knobs with
   push = managed and pull = selected, AP1, AP2, A/THR, LOC, APPR). The PFD reacts.
3. **Ejercicios / Exercises** — level-based tasks like the MCDU Trainer, each with task, hint and "why".
   They are checked live against the flight state.

Explore and Fly are one live screen: "Modo explicar" toggles whether a click explains or not. Exercises are a
side-panel tab. MVP2 adds **Construir / Build** (assemble the PFD piece by piece).

## PFD content (A320, MVP1)

- **Attitude:** sky/ground sphere, pitch ladder (every 2.5°, labels every 10°), bank scale (0/10/20/30/45° +
  67° marks), yellow fixed aircraft symbol, roll index + sideslip index, FD bars (green), FD and bank/pitch
  protection marks (green `=` at 67° bank and +30/−15° pitch).
- **Speed tape (left):** moving scale, yellow speed reference line and readout window, speed trend arrow
  (yellow, value = IAS in 10 s), target speed (magenta triangle when managed, cyan when selected), VLS
  (amber strip), Vα prot (amber/black barber), Vα max (red strip), VMAX (red/black barber), green dot,
  S / F characteristic speeds, Mach readout under the tape when ≥ M .50.
- **Altitude tape (right):** moving scale (hundreds), drum readout in the center window, selected altitude
  (cyan, shown in the tape or as a number above/below when off-scale; magenta when constrained — not in
  MVP1), baro reference box under the tape (`QNH 1013` or `STD`), landing elevation (blue bar) when RA shown.
- **VSI (far right):** analog scale ±6000 fpm (non-linear: 1/2/6), green needle, digital value in hundreds
  when |VS| ≥ 200 fpm. Amber when |VS| > 6000 or > 2000 below 2500 ft RA (simplified).
- **Heading tape (bottom):** moving scale, yellow heading reference line, green track diamond, selected heading
  (cyan triangle) when selected.
- **FMA (top, 5 columns × 3 rows):** col1 A/THR mode (SPEED, MACH, THR CLB, THR IDLE, MAN TOGA, MAN FLX…),
  col2 vertical (SRS, CLB, OP CLB, DES, OP DES, ALT*, ALT, ALT CST, V/S ±xxxx, G/S*, G/S), col3 lateral
  (RWY, NAV, HDG, LOC*, LOC), col4 approach capability (CAT 1/CAT 3 DUAL — only when APPR armed or active),
  col5 engagement (AP1/AP2/AP1+2, `1 FD 2`, A/THR in white when active, cyan when armed). Row 1 = active
  (green), row 2 = armed (cyan), row 3 = messages. A **white box** surrounds a newly engaged mode for 10 s.
- **ILS:** LOC deviation scale under the attitude, G/S scale right of it (magenta diamonds), ILS ident/freq
  bottom-left when LS pressed (MVP1: shown when APPR/LOC armed or when the ILS scenario starts).
- **Radio altimeter:** readout under the aircraft symbol when RA < 2500 ft (green, amber below DH — not in
  MVP1).

## Simulation model (deliberately simple)

- Normal law flavour: stick roll commands roll rate (max 15°/s), neutral stick holds bank; bank > 33° returns
  to 33° with neutral stick; bank limited to 67°. Stick pitch commands flight path change (≈ load factor);
  neutral holds flight path. Pitch limited to +30/−15°.
- Pitch = flight path angle + AoA; AoA derived from IAS and configuration (lower speed → higher AoA).
- Speed: thrust minus drag minus gravity component along the path. IAS/TAS/Mach conversions approximate (ISA).
- Heading: turn rate from bank and TAS (coordinated turn). Track = heading (no wind in MVP1).
- Autoflight (AP on): lateral HDG/NAV/LOC tracking, vertical ALT hold, OP CLB/OP DES (thrust CLB/IDLE, speed on
  elevator), V/S, ALT* capture, G/S capture. A/THR: SPEED/MACH modes hold target with thrust, THR CLB/IDLE
  in OP CLB/OP DES. NAV follows a fixed fictional heading in MVP1 (no flight plan yet).
- Characteristic speeds from a simple table by flaps configuration and weight (fixed 64 t).
- The loop runs on `requestAnimationFrame` with a fixed 1/30 s step and pauses when the tab is hidden.

## Promo on the MCDU Trainer

- A small tab fixed to the **left edge** (vertically centered on desktop, lower on phones so it never covers the
  bottom sheets) with a mini PFD icon (blue/brown horizon + yellow aircraft symbol).
- **Expands once per session** to show "Nuevo · Aprende a leer el PFD →" / "New · Learn to read the PFD →"
  after the user completes the first exercise, or after 45 s on the page, whichever comes first. Flag in
  `sessionStorage` (`qubits.pfdPromo.expanded`), every access wrapped in try/catch.
- After 8 s, on × or on Esc it collapses back to the mini tab, which **stays** as a permanent shortcut.
- Never steals focus; the expanded label is announced with `aria-live="polite"`; honours
  `prefers-reduced-motion`; keyboard reachable; link localized to `/en/` when the trainer is in English.
- Vercel Analytics custom events: `pfd_promo_shown`, `pfd_promo_click` (guarded `window.va?.('event', …)`).
- Reciprocal link in the PFD Trainer header: "Programa la ruta en el MCDU →".

## Landing

- Second item in `labs` (ES/EN) in `src/App.svelte`: "PFD Trainer", "Simulador aeronáutico" /
  "Aviation simulator", description, `/labs/pfd-trainer/`.
- SEO: `seo.pfd` in `src/seo.js`, `localize-heads.mjs` writes `dist/en/labs/pfd-trainer/index.html`,
  `sitemap.xml` entries, Vercel rewrites, JSON-LD `WebApplication` + breadcrumb.

## Visual design

The PFD Trainer shares the MCDU Trainer's "single dark cockpit world": same tokens (`--bg #141a1f`,
`--panel #1d252c`, `--line #34414c`, cyan accent), fonts B612 / B612 Mono / IBM Plex Sans, header with the
cyan plate label. The PFD itself sits in a dark bezel with screws, like the MCDU hardware. Display colours
follow Airbus conventions:

| Token | Use | Value |
|---|---|---|
| `sky` | upper sphere | `#1b8fd6` |
| `ground` | lower sphere | `#8a5a2b` |
| `white` | scales, labels | `#ffffff` |
| `yellow` | aircraft symbol, reference lines, trend | `#fff23c` |
| `green` | active modes, FD, needles, track | `#3ff27c` |
| `cyan` | selected targets, armed modes | `#30d3f2` |
| `magenta` | managed targets, ILS | `#ff5cf6` |
| `amber` | VLS, cautions | `#ffa31a` |
| `red` | Vα max, VMAX | `#ff2a1a` |
| `tape` | tape background | `#4a4f55` |

Layout (desktop ≥ 980px): PFD (bezel) + FCU/controls stacked on the left, side panel (Guía / Ejercicios /
explain card) on the right. Phone: PFD full width, controls below, panel as bottom sheet (same pattern as the
MCDU Trainer).

## Out of scope for MVP1

Build mode, 3D, 737 skin, flight plan from the MCDU, wind, failures, alternate/direct law, ECAM.

## Roadmap

- **MVP2:** (MCDU migration done 2026-10-08, see `2026-10-08-mcdu-vite-migration-design.md`) light migration of the MCDU Trainer to a Vite entry (shared feedback module, no inject script);
  3D "exterior view" (done 2026-10-08 with plain three.js, not Threlte — see 2026-10-08-pfd-exterior-3d-design.md) 3D aircraft synced with the PFD attitude + FPV/AoA vectors, 3D F-PLN in the MCDU
  Trainer, shared cockpit fly-in intro; Build mode.
- **MVP3:** Boeing 737 skin and A320/737 comparison; MCDU flight plan flown by the PFD (shared
  `localStorage` state); advanced scenarios (unusual attitudes, alpha floor, go-around).
