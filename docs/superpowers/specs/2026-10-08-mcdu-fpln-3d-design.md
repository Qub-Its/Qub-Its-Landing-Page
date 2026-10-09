# MCDU Trainer — 3D flight plan map (MVP2, part 3)

Status: approved in conversation (2026-10-08). Third MVP2 sub-project from `2026-10-09-pfd-trainer-design.md`
(done: MCDU Vite migration, PFD 3D exterior view; later: cockpit fly-in intro, PFD Build mode).

All paths are relative to `landing-page-svelte/` unless stated.

## Goal

A "Mapa 3D" / "3D map" tab in the MCDU trainer's side panel draws the flight plan the user is typing as a 3D
route with its vertical profile, updated live after every key press. It links what is typed (INIT A, F-PLN,
LAT REV, SIDs, approaches) with what it means geographically and vertically. A "Volar ruta ▶" / "Fly route ▶"
button animates the A320 from origin to destination.

Success means:

- Typing a route in the MCDU changes the 3D route next to it without any extra action.
- The temporary plan (TMPY) is drawn yellow and the active plan green, as on the MCDU screen.
- The vertical profile shows climb to the CRZ FL (TOC), cruise and descent (TOD); with no CRZ FL the route is
  flat and a note says to enter it in INIT A.
- `three` is downloaded only when the tab is opened; the trainer's behaviour is otherwise unchanged.

## Decisions

| Topic | Decision | Why |
|---|---|---|
| Integration | `trainer.js` emits `mcdu:plan` events; the map is a separate lazy module | Minimal change to the production trainer (same pattern as `mcdu:task-complete`); map math testable in Node. |
| Placement | Third panel tab next to Guía / Ejercicios (bottom sheet on phones) | Visible next to the MCDU while typing. |
| Library | three.js `~0.186.1` (already a dependency), named imports, `buildA320` from `src/labs/shared/three/aircraft.js` | Same stack as the PFD exterior view. |
| Base map | None: dark ground plane + grid | No map tiles, licences or network; out of scope. |
| Vertical scale | Exaggerated ×20, stated on screen | 35 000 ft ≈ 5.8 NM against routes of ~1000 NM. |
| Profile | Simplified: climb 2.5 NM per 1000 ft, descent 3 NM per 1000 ft (3:1 rule) | Teaching approximation; no performance model. |
| Persistence | None | The map rebuilds from the latest plan event. |

## Data contract — `mcdu:plan`

`trainer.js` dispatches, at the end of `after()` (after every interaction) and once on start:

```js
document.dispatchEvent(new CustomEvent('mcdu:plan', { detail: planSnapshot() }));
```

and keeps the last snapshot in a module variable exposed as `window.__mcduPlan` (read by the map when it is
opened after the event). `planSnapshot()` returns plain data (deep copy):

```js
{
  items: [{ t: 'wpt', id: 'MROC', kind: 'orig', lat, lon } | { t: 'wpt', id, lat, lon } | { t: 'disco' }],
  tmpy: boolean,               // items come from S.tmpy
  crz: number | null,          // S.init.crz (FL)
  depRwy: string | null,       // S.dep.rwy
  arrRwy: string | null,       // runway of S.arr.appr (from APPRS), if any
  airports: { [icao]: { lat, lon, el, rwys: [[id, lengthM], …] } }   // origin and destination only
}
```

Only these trainer changes are allowed: `planSnapshot()`, the dispatch in `after()` and on start, and `setTab`
generalised to three tabs. Plan building, pages and exercises are not touched.

## Pure math — `src/labs/mcdu/fpln3d/route.js`

No three.js import (runs in Node).

- `project(points) → { toXZ(lat, lon) → [x, z], center: {lat, lon} }` — local equirectangular around the mean
  lat/lon of the route; units NM; **+x = east, −z = north** (same convention as the PFD view);
  `x = (lon − lon0) · 60 · cos(lat0)`, `z = −(lat − lat0) · 60`.
- `buildRoute(snapshot) → { legs, points, toc, tod, totalNm, flat }`:
  - `points`: route points in order, each `{ id, kind, x, z, distNm, altFt }`. `distNm` is cumulative
    great-circle distance (same haversine as the trainer's `dist()`, R = 3440.065 NM).
  - Altitude: origin and destination at airport elevation. With `crz`: climb at 1000 ft per 2.5 NM from the
    origin, cruise at `crz · 100` ft, descend at 1000 ft per 3 NM to the destination. If climb and descent meet
    before reaching cruise, the profile peaks where they cross. Without `crz`: every point at the origin
    elevation and `flat: true`.
  - `toc` / `tod`: `{ distNm, x, z, altFt }` along the route, or null when there is no cruise segment.
  - `legs`: consecutive point pairs; a `disco` between two waypoints produces a leg with `disco: true` (drawn
    dashed) instead of being skipped.
  - Fewer than two waypoints → `{ points: [...], legs: [], toc: null, tod: null, totalNm: 0, flat: true }`.
- `profileAt(route, distNm) → altFt` and `pointAt(route, t ∈ [0, 1]) → { x, z, altFt, headingDeg }` (linear
  along `distNm`, heading from the current leg; used by "Fly route").
- `runwayHeading(id) → deg` (`'08R'` → 80, `'27'` → 270).

## Scene — `src/labs/mcdu/fpln3d/map.js`

`createPlanMap(canvas, { onLabels }) → Promise<{ setPlan(snapshot), fly(), pause(), resize(w, h), start(), stop(),
dispose(), readonly frames, readonly debug }>`; rejects with `Error('webgl-unavailable')` like the PFD view.

- Units: 1 world unit = 1 NM horizontally; altitude in world units = `altFt / 6076 · 20` (×20 exaggeration).
- Ground: dark plane (`#1d252c`-ish) with a grid every 50 NM; light fog.
- Route: thick line through the 3D points, green `#45df80` (active) or yellow `#f3e24c` (TMPY); discontinuity
  legs dashed grey. Thin vertical drop lines from each waypoint to the ground, and the route's ground shadow as
  a faint line.
- Airports: ring marker at origin/destination; runway bars through the airport centre oriented by
  `runwayHeading`, drawn ×4 length so they are visible at route scale; the selected runway (dep/arr) cyan.
- TOC / TOD: small white markers on the route.
- Labels (`onLabels(list)`): the map projects waypoint, airport, TOC and TOD positions to canvas pixels each
  frame and passes `[{ id, text, x, y, kind }]`; the tab renders them as HTML (no 3D text).
- Camera: fixed tilted overview (looking north-east-down at ~35°) fitted to the route's bounding box; re-fitted
  on every `setPlan` whose bounding box changed.
- Fly route: the A320 (`buildA320`, scaled so it is visible, ~6 NM long) moves along `pointAt` over 20 s,
  oriented by heading and by the climb/descent slope; `pause()` stops it; reaching the end leaves it at the
  destination. A new plan resets it to the origin.
- Render loop only while running (`start/stop`); `frames` counter and `debug` getter
  (`{ points: n, color: 'green'|'yellow', flying: boolean }`) for checks.

## Tab — `src/labs/mcdu/fpln3d/tab.js` and markup

- `labs/mcdu-trainer/index.html`: third tab button `#tabMap` (`data-i18n="map3d"`, aria-controls `mapBody`) and
  `<div class="tabbody" id="mapBody" role="tabpanel" hidden>` containing a stage (`canvas`, labels layer), a toolbar
  (Fly / Pause buttons), the vertical-scale note and the "no CRZ FL" note, all with `data-i18n` keys added to
  `STATIC_EN` in `trainer.js`.
- `setTab(t)` accepts `'guide' | 'ex' | 'map'` and dispatches `mcdu:tab` with the active tab.
- `src/labs/mcdu/main.js` imports `fpln3d/tab.js` (small, no three). On the first `mcdu:tab` with `map`, the tab
  dynamically imports `map.js`, creates the map, feeds it `window.__mcduPlan`, then every `mcdu:plan`. Rendering
  runs only while the map tab is selected, the panel is visible (IntersectionObserver), and the page is visible.
- Stage height 320 px desktop, 260 px in the bottom sheet. Messages: loading, no WebGL, load error with a reload
  button (same behaviour as the PFD view).
- `?debug3d` exposes `window.__mcduMap = () => ({ frames, ...debug })`.

## Testing

- `node scripts/check-mcdu-fpln3d.mjs`:
  - projection: east → +x, north → −z; MROC→KMIA projected length within 2 % of the haversine distance;
  - profile: with `crz: 350` TOC ≈ 2.5 × (35000 − el)/1000 NM from origin, TOD ≈ 3 × (35000 − el)/1000 NM before
    destination, cruise points at 35 000 ft; short route (MROC→MRLB) peaks below cruise with no `toc`/`tod`;
    no `crz` → `flat: true`, all at origin elevation;
  - discontinuity produces a `disco` leg; fewer than two waypoints → empty legs;
  - `pointAt(0)` = origin, `pointAt(1)` = destination, `pointAt(0.5).altFt` = `profileAt(totalNm / 2)`;
  - `runwayHeading('08R') === 80`, `('27') === 270`;
  - snapshot from the real trainer data: build a plan with the same `buildPlan` inputs used by level-2 exercises
    and check `buildRoute` gives finite numbers everywhere.
- CDP smoke (scratch): no `three`/`map` chunk before opening the tab; open tab → ready, canvas sized; type
  `MROC/KMIA` into INIT A FROM/TO via the MCDU keys → `__mcduMap().points ≥ 2`, green; make a TMPY change
  (insert a waypoint in F-PLN) → yellow; Fly → `flying` true and plane position changes; switching to Guía stops
  frames; 390 px: no horizontal overflow; no console errors.
- Regression: the MCDU DOM-diff baseline (ES/EN) differs only by the new tab button and tab body; existing MCDU
  smoke (task, glossary, sheet, promo) still passes.

## Out of scope

Terrain, coastlines or base maps; winds; holds; per-waypoint altitude/speed constraints; SID/STAR leg geometry
beyond straight lines between fixes; sending the plan to the PFD trainer (MVP3).
