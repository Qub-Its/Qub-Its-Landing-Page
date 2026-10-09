# PFD 3D Exterior View Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a lazily loaded three.js window next to the PFD that shows the aircraft from outside, synced with the flight state, with FPV and AoA drawn.

**Architecture:** Pure pose math (`view3d/pose.js`) and a procedural model builder (`shared/three/aircraft.js`, takes `THREE` as a parameter) are Node-testable. `view3d/exterior.js` owns the WebGL scene and is the only module that imports `three`; it is loaded with a dynamic `import()` from `components/Exterior3d.svelte`, so `three` lands in its own chunk. `App.svelte` adds a header toggle and persists `{ open, camera }`.

**Tech Stack:** Svelte 5 runes, three.js `~0.186.1`, Vite 8, Node 22 check scripts, headless Chrome (CDP) smoke.

**Spec:** `docs/superpowers/specs/2026-10-08-pfd-exterior-3d-design.md`

## Global Constraints

- Node 22 (`nvm use`); commands from `landing-page-svelte/` unless stated.
- Only new dependency: `three` with range `~0.186.1` in `dependencies`. No Threlte, no orbit controls, no assets.
- World: right-handed, y up, −z north, +x east; aircraft nose −z, right wing +x; Euler order `'YXZ'` with `yaw = −hdg`, `pitch = +pitch`, `roll = −bank`.
- FPV `(sin χ cos γ, sin γ, −cos χ cos γ)`; AoA label = `pitch − fpa`, one decimal.
- The 3D view never mutates `flight`; it renders only while open, intersecting the viewport and `!document.hidden`.
- `localStorage` key `qubits.pfd.view3d` (JSON `{ open, camera }`), always in try/catch.
- All UI text ES + EN in `src/labs/pfd/i18n.js`.
- Commit messages end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

- **No WebGL:** the window must show the ES/EN message and the rest of the page must keep working. Pinned by forcing the error path in the Task 4 smoke (`?debug3d=nowebgl`).
- **Lazy loading:** no `three` code is fetched until the user opens the window for the first time, including when a reload restores `open: true`. In that case, loading on page load is expected and correct. Pinned in the Task 4 smoke.
- **Closing stops rendering:** after closing, the frame counter must stay flat, so a hidden WebGL loop doesn't drain the battery. Pinned in Task 4.
- **Phone width:** at 390px the window sits under the FCU with no horizontal overflow. Pinned in Task 4.
- **Garbage input:** NaN values in the state must not throw or produce NaN rotations. Pinned in Task 1.

---

### Task 1: Pose math + dependency

**Files:** Create `src/labs/pfd/view3d/pose.js`, `scripts/check-pfd-3d.mjs`; Modify `package.json` (+ lockfile).

**Interfaces — Produces:**
- `poseFrom(state) → { yaw, pitch, roll, fpv: [x, y, z], aoa, fpa }` (yaw/pitch/roll radians; aoa/fpa degrees).
- `rotate(v: [x,y,z], { yaw, pitch, roll }) → [x,y,z]` (same rotation three.js applies for Euler `'YXZ'`).

- [ ] **Step 1: Install three**

Run: `npm install three@~0.186.1` → `package.json` `dependencies` gains `"three": "~0.186.1"` (fix the range by hand if npm wrote `^`).

- [ ] **Step 2: Write the failing checks**

Create `scripts/check-pfd-3d.mjs`:

```js
// Checks for the PFD 3D exterior view: pose math, consistency with the sim, procedural model.
// Run from landing-page-svelte/:  node scripts/check-pfd-3d.mjs
import assert from 'node:assert/strict';
import { poseFrom, rotate } from '../src/labs/pfd/view3d/pose.js';
import { createInitialState } from '../src/labs/pfd/lib/schema.js';
import { step, applyStick } from '../src/labs/pfd/lib/sim.js';
import { applyScenario } from '../src/labs/pfd/lib/scenarios.js';

let passed = 0, failed = 0;
async function check(name, fn) {
  try { await fn(); passed++; console.log(`  ok   ${name}`); }
  catch (e) { failed++; console.log(`  FAIL ${name}\n       ${e.message}`); }
}
const near = (a, b, eps = 1e-9, msg = '') => assert.ok(Math.abs(a - b) <= eps, `${msg} ${a} ≉ ${b}`);
const base = { pitch: 0, bank: 0, hdg: 0, fpa: 0, track: 0 };
const fwd = (p) => rotate([0, 0, -1], p);
const right = (p) => rotate([1, 0, 0], p);

await check('level, north: nose toward −z', () => {
  const [x, y, z] = fwd(poseFrom(base)); near(x, 0); near(y, 0); near(z, -1);
});
await check('pitch +10: nose up', () => assert.ok(fwd(poseFrom({ ...base, pitch: 10 }))[1] > 0.17));
await check('bank +30: right wing down', () => assert.ok(right(poseFrom({ ...base, bank: 30 }))[1] < -0.49));
await check('hdg 90: nose toward +x (east)', () => {
  const [x, , z] = fwd(poseFrom({ ...base, hdg: 90 })); near(x, 1, 1e-9); near(z, 0, 1e-9);
});
await check('FPV fpa 0 / track 0 → (0, 0, −1)', () => {
  const [x, y, z] = poseFrom(base).fpv; near(x, 0); near(y, 0); near(z, -1);
});
await check('FPV fpa +5 / track 90 → east and up', () => {
  const [x, y] = poseFrom({ ...base, fpa: 5, track: 90 }).fpv; assert.ok(x > 0.99 && y > 0.08);
});
await check('aoa = pitch − fpa', () => near(poseFrom({ ...base, pitch: 7, fpa: 2.5 }).aoa, 4.5));
await check('NaN inputs → finite output', () => {
  const p = poseFrom({ pitch: NaN, bank: undefined, hdg: Infinity, fpa: NaN, track: null });
  for (const v of [p.yaw, p.pitch, p.roll, p.aoa, p.fpa, ...p.fpv]) assert.ok(Number.isFinite(v));
});
await check('matches the sim AoA while airborne (cruise + manual, 30 s with stick inputs)', () => {
  for (const id of ['cruise', 'manual']) {
    const s = applyScenario(createInitialState(), id);
    for (let i = 0; i < 900; i++) {
      applyStick(s, Math.sin(i / 60) * 0.6, Math.cos(i / 90) * 0.5);
      step(s, 1 / 30);
      if (s.alt - s.groundElev > 50) near(poseFrom(s).aoa, s.aoa, 0.01, `${id} t=${(i / 30).toFixed(1)}`);
    }
  }
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
```

- [ ] **Step 3: Run it — expect failure**

Run: `node scripts/check-pfd-3d.mjs` → Expected: `ERR_MODULE_NOT_FOUND` for `view3d/pose.js`.

- [ ] **Step 4: Implement `src/labs/pfd/view3d/pose.js`**

```js
// Pure attitude / flight-path math for the 3D exterior view. No three.js import: runs in Node checks.
// World: right-handed, y up, −z = north, +x = east. Aircraft model: nose −z, right wing +x, up +y.
// Euler order 'YXZ' (as three.js): yaw = −hdg, pitch = +pitch, roll = −bank (bank + = right wing down).
const rad = (d) => (d * Math.PI) / 180;
const num = (v) => (Number.isFinite(v) ? v : 0);

/**
 * @param {{pitch: number, bank: number, hdg: number, fpa: number, track: number}} s flight state (degrees)
 * @returns {{yaw: number, pitch: number, roll: number, fpv: [number, number, number], aoa: number, fpa: number}}
 *   yaw/pitch/roll in radians for the body; fpv = unit flight-path vector (world); aoa/fpa in degrees for labels
 */
export function poseFrom(s) {
  const pitch = num(s?.pitch), bank = num(s?.bank), hdg = num(s?.hdg), fpa = num(s?.fpa), track = num(s?.track);
  const g = rad(fpa), x = rad(track);
  return {
    yaw: -rad(hdg),
    pitch: rad(pitch),
    roll: -rad(bank),
    fpv: [Math.sin(x) * Math.cos(g), Math.sin(g), -Math.cos(x) * Math.cos(g)],
    aoa: pitch - fpa,
    fpa,
  };
}

/** Rotates a body-frame vector into the world like three.js Euler 'YXZ' (R = Ry · Rx · Rz). */
export function rotate([x, y, z], { yaw, pitch, roll }) {
  const x1 = x * Math.cos(roll) - y * Math.sin(roll), y1 = x * Math.sin(roll) + y * Math.cos(roll), z1 = z;
  const y2 = y1 * Math.cos(pitch) - z1 * Math.sin(pitch), z2 = y1 * Math.sin(pitch) + z1 * Math.cos(pitch);
  return [x1 * Math.cos(yaw) + z2 * Math.sin(yaw), y2, -x1 * Math.sin(yaw) + z2 * Math.cos(yaw)];
}
```

- [ ] **Step 5: Run — expect pass**

Run: `node scripts/check-pfd-3d.mjs` → Expected: `9 passed, 0 failed`.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json src/labs/pfd/view3d/pose.js scripts/check-pfd-3d.mjs
git commit -m "feat: add pose math for the PFD 3D exterior view

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Procedural A320 model

**Files:** Create `src/labs/shared/three/aircraft.js`; Modify `scripts/check-pfd-3d.mjs`.

**Interfaces — Produces:** `buildA320(THREE) → THREE.Group` named `A320`, children named `fuselage`, `noseCone`, `tailCone`, `cockpit`, `wingL`, `wingR`, `stabL`, `stabR`, `fin`, `engineL`, `engineR`. Metres, nose −z, CG at origin.

- [ ] **Step 1: Add the failing checks** (insert before the summary line of `check-pfd-3d.mjs`)

```js
const THREE = await import('three');
const { buildA320 } = await import('../src/labs/shared/three/aircraft.js');
await check('A320 model: named parts', () => {
  const g = buildA320(THREE);
  assert.equal(g.name, 'A320');
  for (const n of ['fuselage', 'noseCone', 'tailCone', 'cockpit', 'wingL', 'wingR', 'stabL', 'stabR', 'fin', 'engineL', 'engineR'])
    assert.ok(g.getObjectByName(n), `missing ${n}`);
});
await check('A320 model: real proportions, nose toward −z', () => {
  const g = buildA320(THREE); g.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(g), size = box.getSize(new THREE.Vector3());
  assert.ok(size.z >= 35 && size.z <= 40, `length ${size.z}`);
  assert.ok(size.x >= 33 && size.x <= 38, `span ${size.x}`);
  const c = new THREE.Vector3(); g.getObjectByName('cockpit').getWorldPosition(c);
  assert.ok(c.z < -10, `cockpit z ${c.z}`);
  const wl = new THREE.Box3().setFromObject(g.getObjectByName('wingL'));
  assert.ok(wl.max.x < 0, 'left wing on −x');
});
```

- [ ] **Step 2: Run — expect failure** (`ERR_MODULE_NOT_FOUND` for `aircraft.js`).

- [ ] **Step 3: Implement `src/labs/shared/three/aircraft.js`**

```js
// Procedural low-poly A320 for the labs' 3D views (PFD exterior view now; MCDU 3D F-PLN / intro later).
// Takes the THREE namespace as a parameter so vanilla pages and Node checks can use it without bundler tricks.
// Metres, nose toward −z, right wing +x, up +y, centre of gravity at the origin. Fixed clean configuration.

/** @param {typeof import('three')} THREE */
export function buildA320(THREE) {
  const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: 0.6, metalness: 0.1, ...extra });
  const white = mat(0xeef2f5), grey = mat(0xaab4bd), dark = mat(0x1d252c, { roughness: 0.3 }), accent = mat(0x3ccbe8);
  const g = new THREE.Group();
  g.name = 'A320';
  const add = (name, geo, material, [x, y, z] = [0, 0, 0]) => {
    const m = new THREE.Mesh(geo, material);
    m.name = name;
    m.position.set(x, y, z);
    g.add(m);
    return m;
  };
  // Flat planform in the shape's (x, y) plane, y = forward. Extruded `t` thick, then laid flat (extrusion → +y).
  const plate = (pts, t) => {
    const shape = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y)));
    const geo = new THREE.ExtrudeGeometry(shape, { depth: t, bevelEnabled: false });
    geo.rotateX(-Math.PI / 2); // shape y → world −z (forward), extrusion z → world +y
    return geo;
  };

  // Fuselage: 30 m barrel + 4.4 m nose cone + 3.2 m tail cone = 37.6 m, radius 2 m.
  const barrel = new THREE.CylinderGeometry(2, 2, 30, 16); barrel.rotateX(Math.PI / 2);
  add('fuselage', barrel, white, [0, 0, 0]);
  const nose = new THREE.ConeGeometry(2, 4.4, 16); nose.rotateX(-Math.PI / 2);
  add('noseCone', nose, white, [0, 0, -17.2]);
  const tail = new THREE.ConeGeometry(2, 3.2, 16); tail.rotateX(Math.PI / 2);
  add('tailCone', tail, white, [0, 0.4, 16.6]);
  add('cockpit', new THREE.BoxGeometry(2.6, 0.7, 1.4), dark, [0, 1.1, -15.6]);

  // Wings: root chord 7 m at the fuselage side, 25° sweep, tip 17.9 m out (span 35.8 m), low-mounted.
  const wing = (side) => plate([[0, 2], [0, -5], [side * 16, -7.6], [side * 16, -6]].map(([x, y]) => [x + side * 1.9, y]), 0.5);
  add('wingL', wing(-1), grey, [0, -1.2, 0]);
  add('wingR', wing(1), grey, [0, -1.2, 0]);

  // Horizontal stabilisers: span ≈ 12.4 m.
  const stab = (side) => plate([[0, -13], [0, -17], [side * 4.4, -18.6], [side * 4.4, -17.2]].map(([x, y]) => [x + side * 1.8, y]), 0.3);
  add('stabL', stab(-1), grey, [0, 0.6, 0]);
  add('stabR', stab(1), grey, [0, 0.6, 0]);

  // Fin: planform drawn in (forward, up), extruded sideways (rotateY maps shape x → world z, extrusion → +x).
  const finShape = new THREE.Shape([[-13, 1.5], [-18.6, 1.5], [-19.2, 8.4], [-17.4, 8.4]].map(([u, v]) => new THREE.Vector2(u, v)));
  const finGeo = new THREE.ExtrudeGeometry(finShape, { depth: 0.3, bevelEnabled: false });
  finGeo.rotateY(Math.PI / 2); // shape (u, v, w) → world (w, v, −u): u = −z, so aft points land at +z; extrusion → +x
  finGeo.translate(-0.15, 0, 0);
  add('fin', finGeo, accent);

  // Engines under the wings.
  const nacelle = new THREE.CylinderGeometry(1.1, 0.9, 4.4, 14); nacelle.rotateX(Math.PI / 2);
  add('engineL', nacelle, grey, [-5.75, -2.6, -4]);
  add('engineR', nacelle.clone(), grey, [5.75, -2.6, -4]);
  return g;
}
```

The fin planform points are (u = −z, v = y); `rotateY(π/2)` maps a shape point `(u, v, w)` to world `(w, v, −u)`, so the fin sits at z 13…19.2 (aft). Add to the proportions check:

```js
  const fin = new THREE.Box3().setFromObject(g.getObjectByName('fin')).getCenter(new THREE.Vector3());
  assert.ok(fin.z > 10 && fin.y > 3, `fin centre ${fin.toArray()}`);
```

- [ ] **Step 4: Run — expect pass** (`node scripts/check-pfd-3d.mjs` → `11 passed, 0 failed`). Fix geometry (not the bounds) if a check fails.

- [ ] **Step 5: Commit**

```bash
git add src/labs/shared/three/aircraft.js scripts/check-pfd-3d.mjs
git commit -m "feat: add a procedural low-poly A320 model for the labs' 3D views

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: WebGL scene (`exterior.js`)

**Files:** Create `src/labs/pfd/view3d/exterior.js`.

**Interfaces:**
- Consumes: `poseFrom`, `rotate` (Task 1); `buildA320` (Task 2).
- Produces: `createExteriorView(canvas, getState, { camera = 'side', debugFail = false } = {}) → Promise<{ setCamera(id), resize(w, h), start(), stop(), dispose(), readonly frames: number }>`; rejects with `Error('webgl-unavailable')` when no WebGL context (or when `debugFail`).

- [ ] **Step 1: Implement**

```js
// WebGL scene for the PFD trainer's 3D exterior view. The only module that imports three.js; loaded with a
// dynamic import() by Exterior3d.svelte so three lands in its own chunk. Pure view of the flight state.
import * as THREE from 'three';
import { buildA320 } from '../../shared/three/aircraft.js';
import { poseFrom, rotate } from './pose.js';

const GROUND_Y = -40, CELL = 50, KT = 0.5144;
const ARC_N = 24, ARC_R = 22;

/**
 * @param {HTMLCanvasElement} canvas
 * @param {() => import('../lib/schema.js').FlightState} getState
 * @param {{camera?: 'side'|'rear'|'q34', debugFail?: boolean}} [opts]
 */
export async function createExteriorView(canvas, getState, { camera = 'side', debugFail = false } = {}) {
  let renderer;
  try {
    if (debugFail) throw new Error('forced');
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  } catch {
    throw new Error('webgl-unavailable');
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x3d86c6);
  scene.fog = new THREE.Fog(0x9fc3e0, 600, 2200);
  scene.add(new THREE.HemisphereLight(0xe6f2ff, 0x6b4a2a, 1.3));
  const sun = new THREE.DirectionalLight(0xffffff, 1.6); sun.position.set(40, 80, 30); scene.add(sun);

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(6000, 6000), new THREE.MeshLambertMaterial({ color: 0x8b5a2b }));
  ground.rotation.x = -Math.PI / 2; ground.position.y = GROUND_Y; scene.add(ground);
  const grid = new THREE.GridHelper(3000, 3000 / CELL, 0xc9a26b, 0xa77d4a);
  grid.position.y = GROUND_Y + 0.05; scene.add(grid);

  const body = new THREE.Group(); body.rotation.order = 'YXZ'; scene.add(body);
  body.add(buildA320(THREE));
  // Body axis (white) and AoA arc (amber), both in the body frame.
  const axis = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, -19), new THREE.Vector3(0, 0, -34)]),
    new THREE.LineBasicMaterial({ color: 0xffffff }));
  body.add(axis);
  const arcPos = new Float32Array(ARC_N * 3);
  const arcGeo = new THREE.BufferGeometry(); arcGeo.setAttribute('position', new THREE.BufferAttribute(arcPos, 3));
  const arc = new THREE.Line(arcGeo, new THREE.LineBasicMaterial({ color: 0xf3a533 }));
  body.add(arc);
  const fpvArrow = new THREE.ArrowHelper(new THREE.Vector3(0, 0, -1), new THREE.Vector3(0, 0, 0), 34, 0x45df80, 5, 3);
  scene.add(fpvArrow);

  const cam = new THREE.PerspectiveCamera(38, 1, 1, 5000);
  const placeCamera = (hdgRad) => {
    const f = new THREE.Vector3(Math.sin(hdgRad), 0, -Math.cos(hdgRad)), r = new THREE.Vector3(Math.cos(hdgRad), 0, Math.sin(hdgRad));
    const up = new THREE.Vector3(0, 1, 0), p = new THREE.Vector3();
    // side: right of the aircraft looking left, so the nose points right on screen.
    if (camera === 'side') p.addScaledVector(r, 95).addScaledVector(up, 4);
    else if (camera === 'rear') p.addScaledVector(f, -90).addScaledVector(up, 14);
    else p.addScaledVector(f, -62).addScaledVector(r, -55).addScaledVector(up, 26);
    cam.position.copy(p); cam.lookAt(0, 0, 0);
  };

  let raf = 0, last = 0, frames = 0, dx = 0, dz = 0;
  const v = new THREE.Vector3();
  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = last ? Math.min((now - last) / 1000, 0.1) : 0; last = now;
    const s = getState(), p = poseFrom(s);
    body.rotation.set(p.pitch, p.yaw, p.roll);
    fpvArrow.setDirection(v.set(...p.fpv));
    // AoA arc: from the body nose axis to the FPV, in the body's vertical plane.
    const fb = rotate(rotate(rotate(p.fpv, { yaw: -p.yaw, pitch: 0, roll: 0 }), { yaw: 0, pitch: -p.pitch, roll: 0 }), { yaw: 0, pitch: 0, roll: -p.roll });
    const a = Math.atan2(fb[1], -fb[2]);
    for (let i = 0; i < ARC_N; i++) {
      const t = (a * i) / (ARC_N - 1);
      arcPos.set([0, ARC_R * Math.sin(t), -ARC_R * Math.cos(t)], i * 3);
    }
    arcGeo.attributes.position.needsUpdate = true;
    // Ground grid scrolls under the aircraft along the track (IAS as a speed proxy: decorative, not to scale).
    const speed = (Number.isFinite(s.ias) ? s.ias : 0) * KT * Math.cos(p.fpa * Math.PI / 180);
    dx = (dx + p.fpv[0] * speed * dt) % CELL; dz = (dz + p.fpv[2] * speed * dt) % CELL;
    grid.position.x = -dx; grid.position.z = -dz;
    placeCamera(-p.yaw);
    renderer.render(scene, cam);
    frames++;
  }

  return {
    setCamera(id) { camera = id; },
    resize(w, h) {
      if (w < 1 || h < 1) return;
      renderer.setSize(w, h, false);
      cam.aspect = w / h; cam.updateProjectionMatrix();
    },
    start() { if (!raf) { last = 0; raf = requestAnimationFrame(frame); } },
    stop() { cancelAnimationFrame(raf); raf = 0; },
    dispose() {
      this.stop();
      scene.traverse((o) => { o.geometry?.dispose?.(); const m = o.material; (Array.isArray(m) ? m : m ? [m] : []).forEach((x) => x.dispose()); });
      renderer.dispose();
    },
    get frames() { return frames; },
  };
}
```

Note on the arc: to express the world FPV in the body frame, undo the rotations in reverse order (yaw, then pitch, then roll), as written. `a` comes out negative when the FPV is below the nose, which is the usual case with positive AoA. The arc then sweeps down from the nose axis.

- [ ] **Step 2: Syntax check:** `node --check src/labs/pfd/view3d/exterior.js` prints nothing. The visual check comes in Task 4.

- [ ] **Step 3: Commit**

```bash
git add src/labs/pfd/view3d/exterior.js
git commit -m "feat: add the three.js scene for the PFD 3D exterior view

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Window component, page integration, smoke

**Files:** Create `src/labs/pfd/components/Exterior3d.svelte`; Modify `src/labs/pfd/App.svelte`, `src/labs/pfd/i18n.js`. Scratch: `<scratchpad>/cdp/ext3d.mjs`.

**Interfaces:** Consumes `createExteriorView` (Task 3), `poseFrom` (Task 1). Produces `<Exterior3d {lang} {open} {camera} oncamera onclose />`.

- [ ] **Step 1: Write the failing smoke** — `<scratchpad>/cdp/ext3d.mjs` (CDP harness like `panel.mjs`) asserting, at 1440×900 with `localStorage` cleared:
  1. no request URL matching `/exterior|three/` after load;
  2. header button `[data-3d]` exists; clicking it → `.ext3d` visible, `.ext3d[data-status="ready"]` within 5 s, canvas `width > 0`, overlay text matches `/AoA/` and `/FPV/`, a request matching `/exterior/` happened;
  3. `?debug3d` frame counter (`window.__pfd3dFrames()`) increases over 500 ms while open;
  4. clicking `.ext3d [data-cam="rear"]` → it has `aria-pressed="true"`;
  5. clicking `[data-3d]` again → `.ext3d` hidden and the counter is flat over 500 ms;
  6. reload with open state → window open, camera `rear` pressed;
  7. 390×844: `.ext3d` top ≥ `.fcu` bottom, `scrollWidth ≤ innerWidth`;
  8. `?debug3d=nowebgl` → `.ext3d[data-status="nowebgl"]` shows the message, PFD still renders;
  9. no console errors.
Chrome flags: drop `--disable-gpu`, add `--enable-unsafe-swiftshader --use-angle=swiftshader`.

Run it → Expected: FAIL at check 2 (`[data-3d]` missing).

- [ ] **Step 2: i18n** — add to `UI.es` / `UI.en` after `railLabel`:

```js
    view3d: '3D', view3dTitle: 'Vista exterior 3D',
    ext3dTitle: 'Vista exterior', camSide: 'Lateral', camRear: 'Trasera', camQ34: '3/4',
    ext3dLoading: 'Cargando vista 3D…', ext3dNoWebgl: 'Tu navegador no soporta WebGL: la vista 3D no está disponible.',
    ext3dError: 'No se pudo cargar la vista 3D.', ext3dAxis: 'Eje del avión', ext3dFpv: 'Trayectoria (FPV)',
```
```js
    view3d: '3D', view3dTitle: '3D exterior view',
    ext3dTitle: 'Exterior view', camSide: 'Side', camRear: 'Rear', camQ34: '3/4',
    ext3dLoading: 'Loading 3D view…', ext3dNoWebgl: 'Your browser does not support WebGL: the 3D view is unavailable.',
    ext3dError: 'The 3D view could not be loaded.', ext3dAxis: 'Aircraft axis', ext3dFpv: 'Flight path (FPV)',
```

- [ ] **Step 3: Create `components/Exterior3d.svelte`**

```svelte
<script>
  // 3D exterior view window: lazy-loads the three.js scene on first mount, renders only while open, on screen and
  // with the tab visible. Labels are HTML (no 3D text). ?debug3d exposes a frame counter; ?debug3d=nowebgl forces
  // the no-WebGL path.
  import { onMount } from 'svelte';
  import { flight } from '../lib/flight.svelte.js';
  import { poseFrom } from '../view3d/pose.js';
  import { UI } from '../i18n.js';

  /** @type {{ lang: 'es'|'en', open: boolean, camera: 'side'|'rear'|'q34', oncamera: (id: 'side'|'rear'|'q34') => void, onclose: () => void }} */
  let { lang, open, camera, oncamera, onclose } = $props();

  const t = $derived(UI[lang]);
  const aoa = $derived(poseFrom(flight).aoa);
  const CAMS = /** @type {const} */ (['side', 'rear', 'q34']);
  const camLabel = { side: 'camSide', rear: 'camRear', q34: 'camQ34' };

  let canvas = $state(/** @type {HTMLCanvasElement|undefined} */ (undefined));
  let stage = $state(/** @type {HTMLDivElement|undefined} */ (undefined));
  let status = $state(/** @type {'loading'|'ready'|'nowebgl'|'error'} */ ('loading'));
  /** @type {Awaited<ReturnType<typeof import('../view3d/exterior.js').createExteriorView>> | null} */
  let view = null;
  let onScreen = true;

  function sync() {
    if (!view) return;
    if (open && onScreen && !document.hidden) view.start();
    else view.stop();
  }

  $effect(() => { open; sync(); });
  $effect(() => { view?.setCamera(camera); });

  onMount(() => {
    let gone = false;
    const debug = new URLSearchParams(location.search).get('debug3d');
    import('../view3d/exterior.js')
      .then((m) => m.createExteriorView(/** @type {HTMLCanvasElement} */ (canvas), () => flight, { camera, debugFail: debug === 'nowebgl' }))
      .then((v) => {
        if (gone) { v.dispose(); return; }
        view = v;
        const r = stage?.getBoundingClientRect();
        if (r) v.resize(r.width, r.height);
        v.setCamera(camera);
        status = 'ready';
        sync();
      })
      .catch((e) => { status = e?.message === 'webgl-unavailable' ? 'nowebgl' : 'error'; });
    const ro = new ResizeObserver(([e]) => view?.resize(e.contentRect.width, e.contentRect.height));
    const io = new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; sync(); });
    if (stage) { ro.observe(stage); io.observe(stage); }
    document.addEventListener('visibilitychange', sync);
    if (debug !== null) /** @type {any} */ (window).__pfd3dFrames = () => view?.frames ?? 0;
    return () => {
      gone = true;
      ro.disconnect(); io.disconnect();
      document.removeEventListener('visibilitychange', sync);
      view?.dispose(); view = null;
    };
  });
</script>

<section class="ext3d" hidden={!open} data-status={status} aria-label={t.ext3dTitle}>
  <div class="ext3d-head">
    <span class="ext3d-title">{t.ext3dTitle}</span>
    <div class="ext3d-cams" role="group" aria-label={t.ext3dTitle}>
      {#each CAMS as id}
        <button type="button" class="ext3d-cam" data-cam={id} aria-pressed={camera === id} onclick={() => oncamera(id)}>{t[camLabel[id]]}</button>
      {/each}
    </div>
    <button type="button" class="ext3d-close" aria-label={t.close} onclick={onclose}>×</button>
  </div>
  <div class="ext3d-stage" bind:this={stage}>
    <canvas bind:this={canvas} hidden={status === 'nowebgl' || status === 'error'}></canvas>
    {#if status === 'ready'}
      <div class="ext3d-legend" aria-live="off">
        <span><i class="sw axis"></i>{t.ext3dAxis}</span>
        <span><i class="sw fpv"></i>{t.ext3dFpv}</span>
        <span><i class="sw aoa"></i>AoA {aoa.toFixed(1)}°</span>
      </div>
    {:else}
      <p class="ext3d-msg">{status === 'loading' ? t.ext3dLoading : status === 'nowebgl' ? t.ext3dNoWebgl : t.ext3dError}</p>
    {/if}
  </div>
</section>

<style>
  .ext3d { background: var(--panel); border: 1px solid var(--line); border-radius: 8px; overflow: hidden; display: flex; flex-direction: column; }
  .ext3d[hidden] { display: none; }
  .ext3d-head { display: flex; align-items: center; gap: 8px; padding: 6px 8px 6px 12px; border-bottom: 1px solid var(--line); background: var(--panel-2); }
  .ext3d-title { font-family: var(--f-ui); font-size: 11px; letter-spacing: .12em; text-transform: uppercase; color: var(--muted); margin-right: auto; }
  .ext3d-cams { display: flex; gap: 4px; }
  .ext3d-cam { font-family: var(--f-ui); font-size: 11px; letter-spacing: .06em; text-transform: uppercase; background: none; border: 1px solid var(--line); border-radius: 4px; color: var(--muted); padding: 4px 8px; cursor: pointer; }
  .ext3d-cam[aria-pressed="true"] { background: var(--cyan); border-color: var(--cyan); color: #06222a; }
  .ext3d-close { background: none; border: 0; color: var(--muted); font-size: 20px; line-height: 1; padding: 0 6px; cursor: pointer; }
  .ext3d-stage { position: relative; height: 240px; background: #3d86c6; }
  .ext3d-stage canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }
  .ext3d-legend { position: absolute; left: 8px; bottom: 8px; display: flex; flex-wrap: wrap; gap: 4px 12px; font-size: 12px; color: #fff; background: #0b0f12a6; border-radius: 4px; padding: 4px 8px; pointer-events: none; }
  .ext3d-legend span { display: inline-flex; align-items: center; gap: 6px; }
  .sw { display: inline-block; width: 14px; height: 3px; border-radius: 2px; }
  .sw.axis { background: #fff; } .sw.fpv { background: var(--green); } .sw.aoa { background: var(--amber); }
  .ext3d-msg { position: absolute; inset: 0; display: grid; place-items: center; margin: 0; padding: 16px; text-align: center; color: #fff; background: var(--panel); }
  @media (max-width: 980px) { .ext3d-stage { height: 200px; } }
</style>
```

- [ ] **Step 4: Integrate in `App.svelte`**
- import `Exterior3d`;
- state after the collapsed-panel block:

```js
  // 3D exterior view: { open, camera } persisted; mounted on first open, then only hidden (keeps the WebGL context).
  const VIEW3D_KEY = 'qubits.pfd.view3d';
  let view3d = $state(readView3d());
  let view3dMounted = $state(view3d.open);
  function readView3d() {
    try {
      const v = JSON.parse(localStorage.getItem(VIEW3D_KEY) || '{}');
      return { open: v.open === true, camera: ['side', 'rear', 'q34'].includes(v.camera) ? v.camera : 'side' };
    } catch { return { open: false, camera: 'side' }; }
  }
  function saveView3d() {
    try { localStorage.setItem(VIEW3D_KEY, JSON.stringify(view3d)); } catch { /* storage unavailable */ }
  }
  function toggle3d() { view3d.open = !view3d.open; if (view3d.open) view3dMounted = true; saveView3d(); }
  function setCamera3d(id) { view3d.camera = id; saveView3d(); }
```
- header, right after the explain button:

```svelte
    <button class="btn" type="button" data-3d aria-pressed={view3d.open} title={t.view3dTitle} onclick={toggle3d}>{t.view3d}</button>
```
- in `.sim-side` between `<Fcu>` and `<Controls>`:

```svelte
      {#if view3dMounted}<Exterior3d {lang} open={view3d.open} camera={view3d.camera} oncamera={setCamera3d} onclose={toggle3d} />{/if}
```

- [ ] **Step 5: Build and run the smoke** → `npm run build` without errors or warnings; smoke 9/9. Also take screenshots of the three cameras with the window open (1440×900) and check them by eye: horizon, nose points right in Lateral, white axis, green FPV, amber arc.

- [ ] **Step 6: Bundle check** → `ls dist/assets` shows a separate `exterior-*.js` chunk containing `WebGLRenderer`. `grep -l WebGLRenderer dist/assets/pfd-*.js` finds nothing, and the `pfd-*.js` entry chunk grows by less than 8 kB compared to `main`.

- [ ] **Step 7: Commit**

```bash
git add src/labs/pfd/components/Exterior3d.svelte src/labs/pfd/App.svelte src/labs/pfd/i18n.js
git commit -m "feat: add a lazy 3D exterior view window to the PFD trainer

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Docs and final checks

**Files:** Modify `AGENTS.md`, `docs/superpowers/specs/2026-10-08-pfd-exterior-3d-design.md` (Status), `docs/superpowers/specs/2026-10-09-pfd-trainer-design.md` (roadmap).

- [ ] **Step 1:** AGENTS.md, PFD section: add the bullet `- 3D exterior view: header "3D" toggles \`components/Exterior3d.svelte\`, which lazy-loads \`view3d/exterior.js\` (only module importing \`three\`); pose math in \`view3d/pose.js\`, procedural model in \`src/labs/shared/three/aircraft.js\` (takes \`THREE\` as a parameter, reusable by vanilla pages). \`?debug3d\` exposes a frame counter, \`?debug3d=nowebgl\` forces the fallback.`. In the Checks bullet, add `node scripts/check-pfd-3d.mjs` (pose math + model).
- [ ] **Step 2:** Spec Status → `implemented (2026-10-08)`. In the roadmap of the PFD spec, mark the 3D exterior view as done and note "three.js, not Threlte".
- [ ] **Step 3:** Run all checks (`check-pfd`, `check-pfd-content`, `check-pfd-exercises`, `check-pfd-3d`, `check-feedback`) and `npm run build`. All of them must pass.
- [ ] **Step 4: Commit** `docs: document the PFD 3D exterior view`.
