# PFD Trainer — 3D exterior view (MVP2, part 2)

Status: implemented (2026-10-08). Second MVP2 sub-project from `2026-10-09-pfd-trainer-design.md`
(done: MCDU Vite migration; later: 3D F-PLN in the MCDU, cockpit fly-in intro, Build mode).

All paths are relative to `landing-page-svelte/` unless stated.

## Goal

A small 3D window next to the PFD shows the aircraft from outside, moving with the same flight state. The
user tilts the sidestick and sees the attitude sphere and the aircraft move together. The flight path vector
(FPV) and the angle of attack (AoA) are drawn, so "pitch = flight path + AoA" becomes visible.

Success means:

- A "3D" button opens/closes the window; `three` is downloaded only the first time it opens.
- Side, rear and 3/4 cameras. The side view shows pitch, FPV and AoA clearly; the rear view shows bank.
- The window is a pure view of `flight` (never mutates it) and costs nothing while closed or off-screen.
- The page keeps working without WebGL.

## Decisions

| Topic | Decision | Why |
|---|---|---|
| Library | `three` directly (`~0.186.1`), **no Threlte** | Changes the earlier spec decision: the MCDU trainer is vanilla JS and the 3D F-PLN will live there; plain three.js modules are shareable, Threlte components are not. One dependency fewer. |
| Placement | Window in the simulator's right column, between FCU and controls (phones: under the PFD, full width) | Seen together with the PFD while flying. Chosen over a PFD/3D toggle and an overlay. |
| Model | Procedural low-poly A320 built from three.js primitives | No asset file, no licence, tiny. |
| Cameras | Three fixed cameras: Lateral (default), Trasera/Rear, 3/4 | Didactic views; no orbit controls (they fight page scroll on phones). |
| Labels | HTML overlay text, not 3D text | No font assets; crisp at any DPR. |
| Scale | Horizon and ground are decorative; altitude is not to scale | The view teaches attitude and path, not position. |

## Coordinate conventions (three.js world)

- Right-handed, **y up**, **−z = north**, **+x = east**. The aircraft stays at the origin; the world (ground
  grid) moves under it.
- Aircraft model: nose along **−z**, right wing along **+x**, up along **+y**, built at real proportions in metres
  (fuselage ≈ 37.6 m, span ≈ 35.8 m) and scaled once in the scene.
- Body orientation from the state (degrees → radians), Euler order `'YXZ'`:
  `yaw = −hdg`, `pitch = +pitch`, `roll = −bank` (bank + = right wing down).
- FPV direction (unit vector, world): with `γ = fpa`, `χ = track`:
  `(sin χ · cos γ, sin γ, −cos χ · cos γ)`.
- AoA shown = `pitch − fpa` (the sim keeps `pitch = fpa + aoa` in flight; on the ground pitch is set
  directly, so the derived value is what the picture shows). Label with one decimal.

## Modules

```
src/labs/shared/three/aircraft.js        buildA320(THREE): THREE.Group
src/labs/pfd/view3d/pose.js              pure math, no three import
src/labs/pfd/view3d/exterior.js          createExteriorView(canvas, getState, opts)
src/labs/pfd/components/Exterior3d.svelte
```

- **`aircraft.js`** — `export function buildA320(THREE)` returns a `Group` named `A320` with children named
  `fuselage`, `wingL`, `wingR`, `stabL`, `stabR`, `fin`, `engineL`, `engineR`, `cockpit`. Takes the `THREE`
  namespace as a parameter so it runs in Node tests and stays shareable with vanilla pages. Flat-shaded
  `MeshStandardMaterial`s (white fuselage, grey wings, dark cockpit windows, cyan tail accent as the Qub-its touch).
- **`pose.js`** — `export function poseFrom(state)` → `{ yaw, pitch, roll, fpv: [x, y, z], aoa, fpa }`
  (radians except `aoa`/`fpa` in degrees for labels). Non-finite inputs fall back to 0 (same defensive style as
  `sim.js`).
- **`exterior.js`** — `export async function createExteriorView(canvas, getState, { camera = 'side' } = {})`
  dynamically imports `three`, builds renderer + scene, and returns
  `{ setCamera(id: 'side'|'rear'|'q34'), resize(w, h), start(), stop(), dispose() }`. Throws
  `Error('webgl-unavailable')` if a WebGL context cannot be created. Scene: sky background colour + hemisphere
  and directional light, ground plane with a grid that scrolls along `track` at a speed proportional to `ias`,
  the aircraft, a green FPV arrow from the aircraft's centre of gravity, and an amber AoA arc between the body forward axis (model −z) and the FPV in the aircraft's vertical plane. Cameras are placed relative to the aircraft heading
  (side = left of the aircraft so the nose points right on screen; rear = behind and slightly above; 3/4 =
  rear-left-above) and look at the origin. Pixel ratio `min(devicePixelRatio, 2)`.
- **`Exterior3d.svelte`** — `{ lang, open, onclose }`. On first open: `import('../view3d/exterior.js')`, create
  the view, show a loading line until ready. Camera buttons (Lateral / Trasera / 3/4) with `aria-pressed`.
  Overlay labels "FPV" and "AoA 4.2°" (ES/EN) positioned in a corner (not tracked in 3D). Renders only while
  open, intersecting the viewport (`IntersectionObserver`) and `!document.hidden`; `ResizeObserver` drives
  `resize`. `dispose()` on destroy. Shows "Tu navegador no soporta WebGL" / "Your browser does not support WebGL"
  instead of the canvas on `webgl-unavailable`.

## Page integration

- Header action button `3D` (`aria-pressed`, title "Vista exterior 3D" / "3D exterior view") toggles `view3d`.
- `App.svelte` renders `<Exterior3d>` inside `.sim-side` between `<Fcu>` and `<Controls>` when `view3d` is on
  (mounted once opened, then hidden with CSS when closed so the WebGL context is reused; render loop stopped).
- At ≤ 980px `.sim-side` is already a single column, so the window sits under the FCU; height 200px there,
  240px on desktop. With the window open on desktop, controls move down by ~250 px; the sticky PFD (collapsed
  layout) keeps the PFD in view.
- Persist `{ open, camera }` in `localStorage` key `qubits.pfd.view3d` (try/catch, like `panelCollapsed`).
- i18n strings in `i18n.js` (ES + EN).
- Dependency: `three` in `dependencies` (exact range `~0.186.1`). Vite must emit it in its own lazy chunk; the
  PFD entry chunk must not grow by more than a few kB.

## Testing

- `node scripts/check-pfd-3d.mjs`:
  - `poseFrom`: pitch +10 → nose up (body forward y > 0); bank +30 → right wing down; hdg 90 → nose toward +x;
    FPV for fpa 0 / track 0 → `(0, 0, −1)`; fpa +5, track 90 → x > 0, y > 0; `aoa === pitch − fpa`;
    NaN inputs → finite output.
  - Consistency with the sim: run `cruise` and `manual` scenarios for 30 s with stick inputs and assert
    `|poseFrom(s).aoa − s.aoa| < 0.01` while airborne.
  - `buildA320(THREE)` in Node (geometry only, no renderer): all named parts exist; bounding box length within
    35–40 m and span within 33–38 m; nose toward −z.
- CDP smoke (scratch script, like the panel smoke): no `three` chunk requested before opening; opening shows a
  canvas with non-zero size and the overlay labels; switching cameras updates `aria-pressed`; closing stops
  requesting frames (a counter exposed under `?debug3d` only); reload restores open state and camera; 390px:
  window under the FCU, no horizontal overflow; no console errors. Headless Chrome uses SwiftShader, so WebGL
  is available there.
- `npm run build`: the `three` code is in a separate chunk loaded only by `Exterior3d`; existing checks pass.

## Out of scope

Exercises that use the 3D view, 3D F-PLN, fly-in intro, orbit camera, terrain/airports, wind, landing gear and
flap animation (the model is fixed clean configuration).
