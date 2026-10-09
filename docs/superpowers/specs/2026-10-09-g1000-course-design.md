# G1000 Course — design

Date: 2026-10-09
Status: approved in conversation (MVP1 to build, MVP2/MVP3 planned)

## Goal

A fourth Qub-its Lab: a **guided course with a built-in simulator** that teaches the Garmin G1000 integrated flight
deck as installed in a Cessna 172 NAV III. Same audience and tone as the MCDU, PFD and E6B trainers (student pilots,
sim enthusiasts), bilingual ES/EN, fictional data, not for real flight training.

The syllabus follows the Garmin G1000 Pilot's Training Guide (190-00368-05, 13 ground lessons), ordered with the
CAP G1000 transition course progression (VFR knobology → VFR navigation → failures → IFR → autopilot) and the
FAA FITS scenario-based style. Source summary: `docs/g1000/pensum.md`.

## Decisions

| Topic | Decision | Reason |
|---|---|---|
| Format | Guided course (lessons of steps: 3D scene → explain → tasks → quiz) **plus** a free "Simulator" tab | Chosen by the user over a plain trainer or a narrative-only course. |
| Route | `/labs/g1000-trainer/` and `/en/labs/g1000-trainer/` | Mirrors the other labs. |
| Stack | Svelte 5 page as a new Vite entry (`labs/g1000-trainer/index.html` → `src/labs/g1000/`) | Same pattern as PFD/E6B. |
| Practice surface | The G1000 is drawn in reactive **SVG** (2D); all practice happens there | Crisp, accessible, mobile friendly, every element clickable (`data-part`). |
| 3D | One lazy module tree `view3d/` (the only code importing `three`, by name); three scenes: cockpit, exploded architecture, exterior flight (MVP2) | 3D orients and explains; it never blocks a lesson. |
| Aircraft | Cessna 172 NAV III G1000 (no AFCS in MVP1) | Most common G1000 installation. |
| Who flies | MVP1: "the instructor flies, you run the avionics" — the sim follows HDG bug or GPS/OBS course and holds the selected altitude | Lets Direct-To/OBS/radials work without asking the user to hand-fly. Own piloting arrives with the GFC 700 (MVP3). |
| Progress | Lessons freely navigable, completion marked, not gated | Same as E6B. |
| World | Fictional airports (`SQxx`), VORs, waypoints, frequencies | No real navigation data. |
| Branding | "G1000", "C172" as nominative references only; no Garmin/Cessna logos | Trademark safety. |
| Feedback | Shared lazy panel, `VITE_WEB3FORMS_FEEDBACK_KEY` | One implementation, one key. |
| Cockpit intro | Not used in MVP1 | Lesson 1 already opens with 3D. |

## Structure

```
src/labs/g1000/
  main.js, App.svelte, g1000.css, i18n.js
  lib/
    g1000.svelte.js   the ONLY reactive store: avionics state + aircraft state; applyState, resetState, dispatch(event)
    avionics.js       pure (state, event) → state for every bezel control (knobs, keys, softkeys, audio panel)
    sim.js            pure kinematic C172: lat/lon, HDG, ALT, IAS/TAS, VS, coordinated turn, wind; instructor pilot
    nav.js            pure geodesy: bearing/distance, Direct-To, DTK/XTK, OBS course, VOR radial/CDI, FPL sequencing
    world.js          fictional airports, VORs, waypoints, frequencies
    course.js         progress (localStorage qubits.g1000.progress.v1)
  components/
    gdu/   Bezel, Pfd, Mfd, Eis, Softkeys, Knob, AudioPanel   (pure SVG views of the store, data-part="<id>")
    course/ LessonList, LessonView, StepCard, Quiz, DemoBar, ExplainCard, Glossary, Panel, PanelRail
    Stage.svelte      hosts 3D canvas and 2D G1000, crossfades between them
  view3d/             (lazy; only importer of three)
    director.js       one renderer/canvas, one active scene, visibility gating, debug hooks
    cockpit.js        C172 panel scene, camera scripts, live screen textures
    explode.js        exploded LRU scene, animated data buses, raycast picking
    exterior.js       (MVP2) aircraft, low-res terrain, FPL ribbon
  content/
    lessons.js, parts.js, glossary.js   (ES/EN)
src/labs/shared/three/
  c172-panel.js       procedural flight-deck panel (2 GDUs, audio panel, standby instruments, yoke, glareshield)
  c172.js             (MVP2) procedural low-poly exterior
```

Other state in localStorage: `qubits.g1000.panelCollapsed`. The modules in `lib/` except the store are plain JS,
testable in Node.

## Lesson contract

```js
{ id, title: {es,en}, objectives: [{es,en}], steps: Step[] }
Step =
  | { kind: 'scene3d', scene: 'cockpit'|'explode'|'exterior', script: CameraCue[], caption }
  | { kind: 'explain', part?, text }
  | { kind: 'task', setup?, part?, task, hint, why, check(s, ctx), demo? }
  | { kind: 'quiz', question, options[], answer, why }
```

- `check` is evaluated by `App.svelte` in an `$effect` on the store, and on part clicks (`ctx.lastPart`) — same
  pattern as the E6B. In the exploded scene, picking a LRU sets `ctx.lastPart` to the LRU id.
- `demo` (Show me) is a list of avionics events and/or state patches with a caption, played by `DemoBar.svelte`
  with a visible press animation on the bezel control.
- `setup` is a state patch applied when the step opens (e.g. aircraft in cruise near `SQ04`, COM1 standby set).
- `CameraCue` = `{ focus: '<node id>', label?, pulse?, t }`; the director tweens the camera to the node's framing.

## Layout

- Desktop: stage on the left (3D or 2D G1000, crossfade), lesson panel on the right (current step, progress, next),
  collapsible to a rail. Header: lesson list, "Simulator", "3D", glossary, feedback.
- ≤ 980px: lesson panel becomes a bottom sheet; the G1000 shows one GDU at a time (PFD / MFD tabs), audio panel in a
  drawer.
- **Simulator** tab: full G1000, sim running, "Modo explicar" (click a part → card).

## G1000 fidelity (MVP1)

Faithful layout, colours and button flow; simplified depth. Anything not simulated shows a toast "No disponible en
este curso / Not available in this course"; no silent dead buttons.

**Bezel (both GDUs):** NAV VOL/ID, dual NAV, HDG, dual ALT, COM VOL/SQ, dual COM, CRS/BARO, RANGE + joystick, dual
FMS (push = cursor), D→ MENU FPL PROC CLR ENT, 12 softkeys. Knobs: drag or wheel on desktop, +/- buttons on touch,
keyboard when focused.

**PFD:** NAV1/2 and COM1/2 (active/standby, swap), navigation status (active leg, DIS, DTK); attitude with roll
pointer and slip/skid; IAS tape with C172 colour arcs and trend vector; ALT tape with selected-altitude bug and BARO;
VSI; 360° HSI with HDG bug, CDI (GPS/VOR1/VOR2), OBS, BRG1/BRG2 pointers; XPDR, OAT, time boxes. Softkeys: INSET,
PFD (BRG1/2, units), OBS, CDI, XPDR (STBY/ON/ALT/VFR/CODE/IDENT), TMR/REF (minimums only), NRST.

**MFD:** EIS strip (ENGINE/LEAN/SYSTEM: RPM, fuel, oil, EGT, volts/amps); page groups MAP / WPT / AUX / NRST with
the page indicator; pages MAP Navigation Map (orientation, range, pan, declutter), WPT Airport Info (frequencies,
runways), AUX GPS Status and System Setup (simplified), NRST Airports; active FPL window (create, insert, delete,
activate leg); D→ from identifier, NRST or FPL; MENU with 2–3 options per page.

**Power-up:** animated self-test; red X's clear as AHRS and ADC align; database page, ENT to continue.

**Out of MVP1:** PROC/approaches, VNAV, TAWS/traffic/weather alerts, reversionary mode, AFCS, electronic
checklist, SVT.

## Sim

Kinematic C172 at a fixed step (e.g. 20 Hz, accumulated): standard-rate coordinated turns toward the target track,
climb/descent at a fixed rate toward selected altitude, IAS from a phase table, TAS/GS from altitude and wind,
fuel burn from a constant flow. Instructor pilot target: HDG bug when the CDI source has no active leg or the user
picks "heading", otherwise the GPS desired track (Direct-To/FPL leg, with turn anticipation and leg sequencing) or
the VOR/OBS course intercept. A visible "Instructor a los mandos / Instructor flying" tag. Scenarios: on ground
(cold), pattern, en route.

## 3D scenes

All in `view3d/`, loaded on the first `scene3d` step or the "3D" button.

1. **Cockpit** (`cockpit.js` + `shared/three/c172-panel.js`): low-poly panel with both GDUs (bezel, raised knobs and
   keys), audio panel, standby airspeed/attitude/altimeter, yoke, glareshield, warm cabin light. Camera cues fly to
   named nodes (`fms`, `com`, `softkeys`, `audio`, `pfd`, `mfd`, `master`…) with a cyan pulse halo and a 3D label.
   Entering a `task` step: camera pushes into the screen and the live 2D G1000 crossfades in. Screen textures: SVG
   serialized to an image and drawn to a `CanvasTexture`, refreshed ~4 fps only while the scene is active; on
   failure a static snapshot.
2. **Exploded architecture** (`explode.js`) — lesson 1 (and 9 in MVP2): LRU boxes (GDU ×2, GIA 63 ×2, GRS 77 AHRS,
   GDC 74 ADC, GEA 71, GTX 33, GMA 1347, GMU 44, antennas, pitot/static) fly out of the panel/airframe. Data buses
   are lines with travelling pulses (e.g. pitot/static → ADC → GDU → airspeed tape). Click a LRU → card (what it
   does, what is lost if it fails). Only in-3D interaction: raycast over ~12 boxes.
3. **Exterior flight** (`exterior.js`, MVP2): C172 model, low-res terrain coloured TAWS-style, magenta FPL ribbon,
   pose from the same sim. MVP1 keeps the contract (sim → pose) but ships no scene.

**Gating and fallbacks** (same rules as PFD/intro): render only while a scene is active, the canvas is on screen and
the tab is visible; DPR capped at 2. No WebGL (or `?debug3d=nowebgl`): a static SVG illustration per scene with the
same caption — a lesson never blocks. `prefers-reduced-motion`: camera moves become cuts, the explosion a fade.
`?debug3d` exposes `window.__g1000_3d()` (scene, frame count).

## MVP1 lessons

| # | Lesson | 3D | Tasks |
|---|---|---|---|
| 1 | The G1000 system | Exploded LRUs + data flows | Pick the LRU feeding attitude, heading, airspeed; quiz WAAS/LPV/RAIM |
| 2 | From six-pack to PFD | Cockpit: standby → PFD | Identify IAS, ALT, VSI, HSI, slip; read values |
| 3 | Power-up and self-test | Cockpit: MASTER/AVIONICS | Power up, wait AHRS alignment, ENT on database page, check EIS |
| 4 | Transponder | Softkey row | Squawk 4721, VFR (1200), ALT mode, IDENT |
| 5 | COM and audio | COM knobs + audio panel | Tune standby and swap; load frequency from WPT/NRST with ENT; COM1 MIC / COM2 listen |
| 6 | Navigation | FMS, D→, HSI | VOR: tune, ident, radial with OBS. GPS: D→ airport, D→ from NRST, OBS on waypoint |
| 7 | The MFD | Cockpit → MFD | Page groups, range/orientation, pan, WPT Airport Info, FPL create/insert/activate leg |
| 8 | Advanced PFD | PFD softkeys | Inset map, BRG1/BRG2, CDI GPS↔VOR, minimums, CLR-hold on MFD |

Each lesson: objectives, steps, 3–5 quiz questions. Lessons 9–13 listed as "Próximamente / Coming soon".
Glossary and parts ES/EN for every `data-part` and term (WAAS, LPV, RAIM, AHRS, ADC, DTK, XTK, OBS, CDI…).

## Checks (Node, from `landing-page-svelte/`)

- `scripts/check-g1000.mjs`: sim (turns, climbs, wind), nav (Direct-To, DTK/XTK, radial, FPL sequencing), avionics
  (key sequences → expected state: FMS cursor, D→ flow, COM swap, XPDR code entry, page groups).
- `scripts/check-g1000-content.mjs`: ES/EN coverage; every `task` is solvable by replaying its `demo` against
  `avionics`/`sim`; quizzes valid; every referenced part, camera node and LRU id exists.
- `scripts/check-g1000-3d.mjs`: procedural models build in Node with `three`; camera cues reference existing nodes;
  LRU list matches `content`.

## Landing, SEO, docs

- Fourth item in `labs` (ES/EN) in `src/App.svelte`: "G1000 Course / Curso G1000".
- `seo.g1000` in `src/seo.js`; `localize-heads.mjs` writes the English head; `sitemap.xml`; Vercel rewrites (both
  `vercel.json`); JSON-LD `Course` + breadcrumb.
- Vite input `g1000: labs/g1000-trainer/index.html`.
- AGENTS.md: new "G1000 Course" section.
- Disclaimer in the page footer: educational material, fictional data, not for real flight training.

## Roadmap

- **MVP2:** lesson 9 failures and reversionary (DISPLAY BACKUP, AHRS/ADC/GPS failures, red X's, exploded scene
  showing the lost flow), lesson 10 TAWS, 11 traffic, 12 weather (datalink METAR/TAF), exterior flight 3D scene.
- **MVP3:** IFR — PROC (departures, ILS/LPV/LNAV approaches, missed approach, SUSPEND, holds), VNAV; lesson 13
  GFC 700 AFCS (FD, HDG/NAV/APR/ALT/VS/FLC/VNV, armed/captured, disconnect) with user hand-flying; promo tabs from the
  other labs.
