# Cockpit Fly-in Intro Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A shared 3D intro that flies the camera from outside the A320 into the flight deck and stops on the PFD
(PFD trainer) or MCDU (MCDU trainer), shown on first visit and on demand from a header button.

**Architecture:** Pure, Node-testable pieces (`decide.js`, `path.js`, `three/cockpit.js`) plus one lazy
three.js module (`flyin.js`) driven by an eager, three-free overlay (`intro.js`). Both trainers call
`maybeIntro()` from their entry and wire a header button.

**Tech Stack:** Vite 8 multi-page, Svelte 5 (PFD), vanilla JS (MCDU), three.js `~0.186.1` (named imports), Node 22
check scripts, CDP smoke in headless Chrome (scratch).

**Spec:** `docs/superpowers/specs/2026-10-09-cockpit-flyin-intro-design.md`

All paths relative to `landing-page-svelte/` unless stated. Branch: `claude/cockpit-flyin`.

## Global Constraints

- `three` imported only by `src/labs/shared/intro/flyin.js` (besides the existing 3D views), by name, through `import()`.
- `localStorage` key `qubits.labs.introSeen` (value `'1'`), shared by both trainers; all access in try/catch.
- Query overrides: `?intro=0` suppresses, `?intro=1` forces; `?debug3d=nowebgl` makes `createFlyin` throw `webgl-unavailable`.
- `DURATION = 3.5` s, `FADE = 0.4` s, load timeout 2 s.
- Target screen lights to `0x45df80`; unlit screens `0x0b1015`.
- Copy: ES "Entrando a la cabina del A320…", "Saltar intro", "Intro", "Ver intro de cabina", aria-label "Intro de cabina"; EN "Entering the A320 cockpit…", "Skip intro", "Intro", "Watch cockpit intro", "Cockpit intro".
- Commits end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. Skip during loading (before three arrives) — overlay must go away at once and the late-arriving view must be disposed, not left rendering on a detached canvas.
2. Load slower than 2 s — intro abandoned silently, `introSeen` still set, no console error.
3. A key pressed to skip must not also drive the page (PFD arrow keys move the sidestick) — skip listener runs in window capture and stops propagation.
4. Calling `maybeIntro` twice (button mashed while auto intro runs) — second call is a no-op.
5. Private mode / storage throwing — never auto-plays, button still works.

---

### Task 1: Pure pieces — decision, camera path, flight deck model

**Files:**
- Create: `src/labs/shared/intro/decide.js`, `src/labs/shared/intro/path.js`, `src/labs/shared/three/cockpit.js`
- Test: `scripts/check-intro.mjs`

**Interfaces:**
- Produces:
  - `shouldPlay({ force: boolean, param: string|null, seen: string|null|undefined, reducedMotion: boolean }) → boolean` (`seen === undefined` means storage unavailable)
  - `DURATION`, `FADE`, `keyframes(target: 'pfd'|'mcdu', screenPos: number[3], screenNormal: number[3]) → {t, pos, look}[]`, `cameraAt(frames, t) → { pos: number[3], look: number[3] }`
  - `buildCockpit(THREE) → Group 'flightDeck'`, `SCREENS = { pfd: 'pfdL', mcdu: 'mcduL' }`

- [ ] **Step 1: Write the failing checks** — `scripts/check-intro.mjs`:

```js
// Checks for the labs' cockpit fly-in intro: show/skip decision, camera path, procedural flight deck.
// Run from landing-page-svelte/:  node scripts/check-intro.mjs
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { shouldPlay } from '../src/labs/shared/intro/decide.js';
import { keyframes, cameraAt, DURATION, FADE } from '../src/labs/shared/intro/path.js';
import { buildCockpit, SCREENS } from '../src/labs/shared/three/cockpit.js';
import { buildA320 } from '../src/labs/shared/three/aircraft.js';

let passed = 0, failed = 0;
async function check(name, fn) {
  try { await fn(); passed++; console.log(`  ok   ${name}`); }
  catch (e) { failed++; console.log(`  FAIL ${name}\n       ${e.message}`); }
}
const sub = (a, b) => a.map((v, i) => v - b[i]);
const len = (a) => Math.hypot(...a);
const dot = (a, b) => a.reduce((s, v, i) => s + v * b[i], 0);

// ---- decision
const d = (o) => shouldPlay({ force: false, param: null, seen: null, reducedMotion: false, ...o });
await check('first visit plays', () => assert.equal(d({}), true));
await check('seen → no auto', () => assert.equal(d({ seen: '1' }), false));
await check('storage unavailable → no auto', () => assert.equal(d({ seen: undefined }), false));
await check('reduced motion → no auto', () => assert.equal(d({ reducedMotion: true }), false));
await check('force (button) plays even when seen / reduced motion / no storage', () => {
  assert.equal(d({ force: true, seen: '1', reducedMotion: true }), true);
  assert.equal(d({ force: true, seen: undefined }), true);
});
await check('?intro=1 forces, ?intro=0 suppresses (even forced)', () => {
  assert.equal(d({ param: '1', seen: '1', reducedMotion: true }), true);
  assert.equal(d({ param: '0' }), false);
  assert.equal(d({ param: '0', force: true }), false);
});

// ---- flight deck model
const plane = buildA320(THREE);
const deck = buildCockpit(THREE);
plane.add(deck);
plane.updateMatrixWorld(true);
const PARTS = ['shell', 'glareshield', 'panel', 'pfdL', 'ndL', 'ewd', 'sd', 'ndR', 'pfdR', 'pedestal', 'mcduL', 'mcduR'];
await check('flight deck: group name and all parts', () => {
  assert.equal(deck.name, 'flightDeck');
  for (const n of PARTS) assert.ok(deck.getObjectByName(n), `missing ${n}`);
});
await check('flight deck: every part inside the fuselage (r ≤ 2 m, z ∈ [−15.7, −12.4])', () => {
  for (const n of PARTS) {
    const o = deck.getObjectByName(n), box = new THREE.Box3().setFromObject(o);
    assert.ok(box.min.z >= -15.7 && box.max.z <= -12.4, `${n} z ${box.min.z}..${box.max.z}`);
    if (n === 'shell') { assert.ok(o.geometry.parameters.radiusTop <= 2, 'shell radius'); continue; }
    for (const x of [box.min.x, box.max.x]) for (const y of [box.min.y, box.max.y])
      assert.ok(Math.hypot(x, y) <= 2, `${n} corner (${x}, ${y})`);
  }
});
const screenPose = (name) => {
  const o = plane.getObjectByName(name);
  return { o, pos: o.getWorldPosition(new THREE.Vector3()).toArray(), normal: o.getWorldDirection(new THREE.Vector3()).toArray() };
};
await check('SCREENS map to screen meshes facing the pilots (+z)', () => {
  for (const [, n] of Object.entries(SCREENS)) {
    const { o, normal } = screenPose(n);
    assert.equal(o.userData.screen, true, `${n} not a screen`);
    assert.ok(normal[2] > 0.3, `${n} normal ${normal}`);
  }
  for (const n of ['pfdL', 'ndL', 'ewd', 'sd', 'ndR', 'pfdR', 'mcduL', 'mcduR'])
    assert.equal(deck.getObjectByName(n).userData.screen, true, n);
});
await check('screens have their own materials (lighting one does not light the others)', () => {
  assert.notEqual(deck.getObjectByName('pfdL').material, deck.getObjectByName('ndL').material);
});

// ---- camera path
await check('timing constants', () => { assert.equal(DURATION, 3.5); assert.equal(FADE, 0.4); });
for (const target of ['pfd', 'mcdu']) {
  const { pos: sp, normal: sn } = screenPose(SCREENS[target]);
  const frames = keyframes(target, sp, sn);
  await check(`${target}: keyframe t strictly increasing from 0 to 1`, () => {
    assert.equal(frames[0].t, 0); assert.equal(frames.at(-1).t, 1);
    for (let i = 1; i < frames.length; i++) assert.ok(frames[i].t > frames[i - 1].t);
  });
  await check(`${target}: starts outside, > 30 m from the CG`, () => {
    const p = cameraAt(frames, 0).pos;
    assert.ok(len(p) > 30, `dist ${len(p)}`);
  });
  await check(`${target}: ends ≤ 0.6 m in front of the screen, looking at its centre`, () => {
    const { pos, look } = cameraAt(frames, 1), off = sub(pos, sp);
    assert.ok(len(off) <= 0.6 && dot(off, sn) > 0, `off ${off}`);
    assert.ok(len(sub(look, sp)) < 1e-9, `look ${look}`);
  });
  await check(`${target}: enters through the nose, never through the fuselage side`, () => {
    for (let i = 0; i <= 400; i++) {
      const { pos: [x, , z] } = cameraAt(frames, i / 400);
      if (z > -19.4) assert.ok(Math.abs(x) <= 1, `t ${i / 400}: x ${x} at z ${z}`);
    }
  });
  await check(`${target}: clamps t and stays finite`, () => {
    assert.deepEqual(cameraAt(frames, -1), cameraAt(frames, 0));
    assert.deepEqual(cameraAt(frames, 2), cameraAt(frames, 1));
    const n = cameraAt(frames, NaN);
    for (const v of [...n.pos, ...n.look]) assert.ok(Number.isFinite(v));
  });
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
```

- [ ] **Step 2: Run, verify it fails**

Run: `node scripts/check-intro.mjs`
Expected: crash `Cannot find module '…/src/labs/shared/intro/decide.js'`.

- [ ] **Step 3: Implement `decide.js`**

```js
// Whether the labs' cockpit intro should play. Pure so Node checks can cover every case.
// seen: the stored flag ('1'), null when never shown, undefined when storage is unavailable (private mode).

/** @param {{force?: boolean, param?: string|null, seen?: string|null, reducedMotion?: boolean}} o */
export function shouldPlay({ force = false, param = null, seen, reducedMotion = false }) {
  if (param === '0') return false;
  if (force || param === '1') return true;
  if (seen !== null) return false;
  return !reducedMotion;
}
```

- [ ] **Step 4: Implement `path.js`**

```js
// Camera path for the labs' cockpit fly-in intro. Pure math (no three import) so Node checks can run it.
// Same axes as buildA320: metres, nose −z, right +x, up +y, centre of gravity at the origin.

export const DURATION = 3.5; // s
export const FADE = 0.4; // s

const DIST = { pfd: 0.45, mcdu: 0.35 };

/**
 * Outside 3/4 → ahead of the nose → just through the windshield → in front of the target screen.
 * @param {'pfd'|'mcdu'} target
 * @param {number[]} screenPos world centre of the target screen
 * @param {number[]} screenNormal unit normal of its face (towards the pilots)
 */
export function keyframes(target, screenPos, screenNormal) {
  const d = DIST[target] ?? DIST.pfd;
  return [
    { t: 0, pos: [-30, 10, -32], look: [0, 0, -4] },
    { t: 0.45, pos: [0, 2.2, -27], look: [0, 1.1, -15.6] },
    { t: 0.7, pos: [0, 1.0, -14.3], look: [0, 0.6, -15.2] },
    { t: 1, pos: screenPos.map((v, i) => v + screenNormal[i] * d), look: [...screenPos] },
  ];
}

const sub = (a, b) => a.map((v, i) => v - b[i]);
const norm = (a) => Math.hypot(...a);
const smooth = (x) => x * x * (3 - 2 * x);
const lerp = (a, b, u) => a.map((v, i) => v + (b[i] - v) * u);

// Hermite tangents: zero at the ends; inside, along the outgoing leg with half the shorter neighbouring leg's
// length, so the camera arrives at each keyframe already heading to the next one without swinging wide.
function tangents(frames) {
  return frames.map((f, k) => {
    const next = frames[k + 1], prev = frames[k - 1];
    if (!next || !prev) return [0, 0, 0];
    const out = sub(next.pos, f.pos), n = norm(out) || 1;
    const m = 0.5 * Math.min(n, norm(sub(f.pos, prev.pos)));
    return out.map((v) => (v / n) * m);
  });
}

/** Camera pose at t ∈ [0, 1] (clamped; NaN → 0), eased with smoothstep. */
export function cameraAt(frames, t) {
  const x = smooth(Math.min(1, Math.max(0, Number.isFinite(t) ? t : 0)));
  let i = 0;
  while (i < frames.length - 2 && x > frames[i + 1].t) i++;
  const a = frames[i], b = frames[i + 1], u = (x - a.t) / (b.t - a.t);
  const m = tangents(frames), u2 = u * u, u3 = u2 * u;
  const h = [2 * u3 - 3 * u2 + 1, u3 - 2 * u2 + u, -2 * u3 + 3 * u2, u3 - u2];
  const pos = a.pos.map((v, k) => h[0] * v + h[1] * m[i][k] + h[2] * b.pos[k] + h[3] * m[i + 1][k]);
  return { pos, look: lerp(a.look, b.look, u) };
}
```

- [ ] **Step 5: Implement `cockpit.js`**

```js
// Procedural A320 flight deck for the labs' cockpit intro. Same conventions as buildA320 (metres, nose −z,
// right +x, up +y) so it is added to the aircraft group as is. Takes THREE as a parameter (Node checks, vanilla pages).

export const SCREENS = { pfd: 'pfdL', mcdu: 'mcduL' };

/** @param {typeof import('three')} THREE */
export function buildCockpit(THREE) {
  const g = new THREE.Group();
  g.name = 'flightDeck';
  const std = (color) => new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: 0.8, metalness: 0.05 });
  const panelMat = std(0x3a434b), darkMat = std(0x1d252c);
  const add = (name, geo, material, [x, y, z], rotX = 0) => {
    const m = new THREE.Mesh(geo, material);
    m.name = name; m.position.set(x, y, z); m.rotation.x = rotX;
    g.add(m);
    return m;
  };
  // Interior shell seen from inside (BackSide) so the cabin is closed once the camera is in the fuselage.
  const shell = new THREE.CylinderGeometry(1.9, 1.9, 3.1, 16, 1, true); shell.rotateX(Math.PI / 2);
  add('shell', shell, new THREE.MeshStandardMaterial({ color: 0x2a3138, side: THREE.BackSide, roughness: 0.9 }), [0, 0, -14.05]);
  add('panel', new THREE.BoxGeometry(1.8, 0.5, 0.12), panelMat, [0, 0.55, -15.25]);
  add('glareshield', new THREE.BoxGeometry(1.9, 0.12, 0.35), darkMat, [0, 0.86, -15.12]);
  add('pedestal', new THREE.BoxGeometry(0.5, 0.5, 0.8), panelMat, [0, 0.05, -14.75]);
  // Displays: thin boxes on the panel face (z −15.19), each with its own material so one can light up alone.
  const screen = (name, w, h, pos, rotX = 0) => {
    const m = add(name, new THREE.BoxGeometry(w, h, 0.01), new THREE.MeshBasicMaterial({ color: 0x0b1015 }), pos, rotX);
    m.userData.screen = true;
    return m;
  };
  const Z = -15.185;
  screen('pfdL', 0.2, 0.2, [-0.72, 0.58, Z]);
  screen('ndL', 0.2, 0.2, [-0.48, 0.58, Z]);
  screen('ewd', 0.2, 0.2, [0, 0.66, Z]);
  screen('sd', 0.2, 0.2, [0, 0.43, Z]);
  screen('ndR', 0.2, 0.2, [0.48, 0.58, Z]);
  screen('pfdR', 0.2, 0.2, [0.72, 0.58, Z]);
  // MCDUs on the pedestal top, tilted back towards the pilots (normal ≈ (0, 0.84, 0.54)).
  screen('mcduL', 0.12, 0.1, [-0.12, 0.31, -14.95], -1.0);
  screen('mcduR', 0.12, 0.1, [0.12, 0.31, -14.95], -1.0);
  return g;
}
```

- [ ] **Step 6: Run, verify it passes**

Run: `node scripts/check-intro.mjs`
Expected: all checks `ok`, `0 failed`. If "enters through the nose" fails, the tangents swing wide: fix `tangents()`, not the test.

- [ ] **Step 7: Commit**

```bash
git add scripts/check-intro.mjs src/labs/shared/intro/decide.js src/labs/shared/intro/path.js src/labs/shared/three/cockpit.js
git commit -m "feat: camera path, show decision and flight deck model for the cockpit intro"
```

---

### Task 2: Fly-in scene and overlay

**Files:**
- Create: `src/labs/shared/intro/flyin.js`, `src/labs/shared/intro/intro.js`, `src/labs/shared/intro/intro.css`
- Test (scratch, not committed): `<scratchpad>/cdp/intro.mjs`, `<scratchpad>/cdp/run-intro.sh`

**Interfaces:**
- Consumes: Task 1 exports.
- Produces: `createFlyin(canvas, { target, debugFail }) → Promise<{ play(): Promise<void>, skip(), resize(w, h), dispose(), frames }>`;
  `maybeIntro({ target: 'pfd'|'mcdu', lang: 'es'|'en', force?: boolean }) → Promise<void>`;
  under `?debug3d`: `window.__intro() → { state: 'idle'|'loading'|'playing'|'done', frames }`.

- [ ] **Step 1: Write the smoke (fails: nothing calls `maybeIntro` yet)** — `<scratchpad>/cdp/intro.mjs`, same CDP
  harness as `map3d.mjs` (copy its first 20 lines: connection, `send`, `ev`, `check`, `waitFor`, `size`), then:

```js
const go = async (path, q = '?debug3d') => { reqs = []; await send('Page.navigate', { url: origin + path + q }); await sleep(800); };
const st = () => ev('window.__intro ? window.__intro() : null');
const three = () => reqs.some((u) => /flyin-|aircraft-/.test(u));
const clear = () => ev(`localStorage.removeItem('qubits.labs.introSeen')`);
try {
  await size(1440, 900);
  for (const [path, btn] of [['/labs/pfd-trainer/', '[data-intro]'], ['/labs/mcdu-trainer/', '#introBtn']]) {
    const tag = path.includes('pfd') ? 'pfd' : 'mcdu';
    await go(path); await clear(); await go(path);
    check(`${tag} 1. first visit shows the overlay and loads three`, await waitFor(`!!document.querySelector('.intro')`) && (await waitFor(`window.__intro().state === 'playing'`)) && three(), { s: await st(), reqs: reqs.filter((u) => /assets/.test(u)) });
    check(`${tag} 2. overlay is a dialog with focus on Skip`, await ev(`document.querySelector('.intro').getAttribute('role') === 'dialog' && document.activeElement?.classList.contains('intro-skip')`));
    const ended = await waitFor(`!document.querySelector('.intro') && window.__intro().state === 'done'`, 7000);
    check(`${tag} 3. ends by itself, overlay removed, introSeen set`, ended && await ev(`localStorage.getItem('qubits.labs.introSeen') === '1'`), await st());
    await go(path);
    check(`${tag} 4. reload → no overlay, no three`, !(await ev(`!!document.querySelector('.intro')`)) && (await sleep(600), !three()), reqs.filter((u) => /assets/.test(u)));
    await ev(`document.querySelector('${btn}').focus(); document.querySelector('${btn}').click()`);
    check(`${tag} 5. header button replays`, await waitFor(`window.__intro().state === 'playing'`));
    await ev(`document.querySelector('${btn}').click()`);
    check(`${tag} 6. second call while running is a no-op`, await ev(`document.querySelectorAll('.intro').length === 1`));
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
    const gone = await waitFor(`!document.querySelector('.intro')`, 1500);
    const f0 = (await st()).frames; await sleep(300); const f1 = (await st()).frames;
    check(`${tag} 7. Esc skips: overlay gone, frames stop, focus back on the button`, gone && f0 === f1 && await ev(`document.activeElement === document.querySelector('${btn}')`), { gone, f0, f1 });
  }
  await clear(); await go('/labs/pfd-trainer/', '?debug3d');
  await ev(`document.querySelector('.intro .intro-skip') && document.querySelector('.intro').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))`);
  check('8. skip while loading → overlay gone at once', await waitFor(`!document.querySelector('.intro')`, 600));
  await sleep(2500);
  check('8b. late view is not left rendering', ((await st()).frames ?? 0) === 0 || (await st()).state === 'done');
  await clear(); await go('/labs/pfd-trainer/', '?debug3d=nowebgl');
  check('9. no WebGL → overlay removed, no error UI', await waitFor(`!document.querySelector('.intro') && window.__intro().state === 'done'`, 3000));
  await clear(); await go('/labs/pfd-trainer/', '?debug3d&intro=0');
  check('10. ?intro=0 → no overlay', !(await ev(`!!document.querySelector('.intro')`)));
  await clear(); await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await go('/labs/mcdu-trainer/');
  check('11. reduced motion → no auto intro', !(await ev(`!!document.querySelector('.intro')`)));
  await send('Emulation.setEmulatedMedia', { features: [] });
  await clear(); await size(390, 844); await go('/labs/pfd-trainer/');
  check('12. 390 px: overlay covers the viewport, no horizontal overflow', await waitFor(`!!document.querySelector('.intro')`) && await ev(`(() => { const r = document.querySelector('.intro').getBoundingClientRect(); return r.width === innerWidth && r.height === innerHeight && document.documentElement.scrollWidth <= innerWidth; })()`));
  await clear(); await size(1440, 900); await go('/labs/pfd-trainer/', '?debug3d&intro=1');
  await waitFor(`window.__intro().state === 'playing'`);
  // Page key handlers (PFD sidestick) listen on window/document in the bubble phase: a spy there must see nothing.
  await ev(`window.__kd = 0; document.addEventListener('keydown', () => window.__kd++); true`);
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'ArrowUp', code: 'ArrowUp', windowsVirtualKeyCode: 38 });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'ArrowUp', code: 'ArrowUp', windowsVirtualKeyCode: 38 });
  check('13. a key that skips does not reach the page', await waitFor(`!document.querySelector('.intro')`, 1500) && await ev(`window.__kd === 0`), await ev('window.__kd'));
} catch (e) { check('harness', false, e.message); }
check('14. no console errors', errors.length === 0, errors);
console.log(`${pass} passed, ${fail} failed`);
await send('Page.close'); ws.close(); process.exit(fail ? 1 : 0);
```

`run-intro.sh` = `run-map3d.sh` with `intro.mjs` in place of `map3d.mjs`.

- [ ] **Step 2: Run, verify it fails**

Run: `bash <scratchpad>/cdp/run-intro.sh "$PWD"`
Expected: `pfd 1.` FAIL (no `.intro`).

- [ ] **Step 3: Implement `flyin.js`**

```js
// WebGL scene for the labs' cockpit fly-in intro. The only intro module that imports three.js; loaded with a
// dynamic import() by intro.js so three stays in its lazy chunk. Named imports so Vite can tree-shake three.
import {
  BackSide, BoxGeometry, Color, ConeGeometry, CylinderGeometry, DirectionalLight, ExtrudeGeometry, Fog, GridHelper, Group, HemisphereLight, Mesh, MeshBasicMaterial, MeshStandardMaterial, PerspectiveCamera, Scene, Shape, Vector2, Vector3, WebGLRenderer,
} from 'three';
import { buildA320 } from '../three/aircraft.js';
import { buildCockpit, SCREENS } from '../three/cockpit.js';
import { keyframes, cameraAt, DURATION } from './path.js';

const THREE = { BackSide, BoxGeometry, ConeGeometry, CylinderGeometry, ExtrudeGeometry, Group, Mesh, MeshBasicMaterial, MeshStandardMaterial, Shape, Vector2 };
const LIT = 0x45df80;

/**
 * @param {HTMLCanvasElement} canvas
 * @param {{target?: 'pfd'|'mcdu', debugFail?: boolean}} [opts]
 */
export async function createFlyin(canvas, { target = 'pfd', debugFail = false } = {}) {
  let renderer;
  try {
    if (debugFail) throw new Error('forced');
    renderer = new WebGLRenderer({ canvas, antialias: true });
  } catch {
    throw new Error('webgl-unavailable');
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  const scene = new Scene();
  scene.background = new Color(0x3d86c6);
  scene.fog = new Fog(0x9fc3e0, 200, 1400);
  scene.add(new HemisphereLight(0xe6f2ff, 0x6b4a2a, 1.3));
  const sun = new DirectionalLight(0xffffff, 1.6); sun.position.set(40, 80, 30); scene.add(sun);
  const grid = new GridHelper(2000, 40, 0xc9a26b, 0xa77d4a); grid.position.y = -60; scene.add(grid);

  const plane = buildA320(THREE);
  plane.add(buildCockpit(THREE));
  scene.add(plane);
  plane.updateMatrixWorld(true);
  const screen = /** @type {import('three').Mesh} */ (plane.getObjectByName(SCREENS[target] ?? SCREENS.pfd));
  const frames = keyframes(target, screen.getWorldPosition(new Vector3()).toArray(), screen.getWorldDirection(new Vector3()).toArray());
  const windowMesh = plane.getObjectByName('cockpit');
  const mat = /** @type {import('three').MeshBasicMaterial} */ (screen.material);
  const dark = mat.color.clone(), lit = new Color(LIT);

  const cam = new PerspectiveCamera(50, 1, 0.05, 3000);
  let count = 0, raf = 0, last = 0, /** @type {(() => void)|null} */ finish = null;
  const pose = (t) => {
    last = t;
    const { pos, look } = cameraAt(frames, t);
    cam.position.fromArray(pos);
    cam.lookAt(look[0], look[1], look[2]);
    if (windowMesh) windowMesh.visible = pos[2] < -16.4;
    mat.color.lerpColors(dark, lit, Math.min(1, Math.max(0, (t - 0.85) / 0.15)));
    renderer.render(scene, cam);
    count++;
  };
  const stopLoop = () => { cancelAnimationFrame(raf); raf = 0; const f = finish; finish = null; f?.(); };
  pose(0);

  return {
    play() {
      stopLoop();
      return new Promise((resolve) => {
        finish = resolve;
        const t0 = performance.now();
        const loop = (now) => {
          const t = Math.min(1, (now - t0) / (DURATION * 1000));
          pose(t);
          if (t >= 1) stopLoop(); else raf = requestAnimationFrame(loop);
        };
        raf = requestAnimationFrame(loop);
      });
    },
    skip: stopLoop,
    resize(w, h) {
      renderer.setSize(w, h, false);
      cam.aspect = w / Math.max(1, h);
      cam.updateProjectionMatrix();
      if (!raf) pose(last);
    },
    dispose() {
      stopLoop();
      scene.traverse((o) => {
        const m = /** @type {any} */ (o);
        m.geometry?.dispose?.();
        for (const x of [].concat(m.material ?? [])) x.dispose?.();
      });
      renderer.dispose();
    },
    get frames() { return count; },
  };
}
```

- [ ] **Step 4: Implement `intro.css`**

```css
/* Cockpit fly-in intro overlay (shared by the labs trainers). Above toasts (80) and dialogs (61). */
.intro{position:fixed;inset:0;z-index:100;background:#0b0f12;opacity:1;transition:opacity .4s ease}
.intro.intro-out{opacity:0}
.intro-canvas{position:absolute;inset:0;width:100%;height:100%;display:block}
.intro-title{position:absolute;left:16px;right:16px;bottom:calc(env(safe-area-inset-bottom,0px) + 24px);margin:0;color:#e8eef2;font:600 15px/1.4 system-ui,sans-serif;text-shadow:0 1px 4px #000}
.intro-skip{position:absolute;right:16px;top:calc(env(safe-area-inset-top,0px) + 16px);padding:8px 14px;border:1px solid #ffffff55;border-radius:6px;background:#0b0f12b3;color:#e8eef2;font:600 14px/1 system-ui,sans-serif;cursor:pointer}
.intro-skip:focus-visible{outline:2px solid #3ccbe8;outline-offset:2px}
html.intro-open{overflow:hidden}
@media (prefers-reduced-motion: reduce){.intro{transition:none}}
```

- [ ] **Step 5: Implement `intro.js`**

```js
// Cockpit fly-in intro for the labs trainers: decides whether to play, mounts a full-screen overlay, lazy-loads
// the three.js scene (flyin.js) and fades out to the page. Eager and three-free; never blocks the page — no
// WebGL, a load slower than LOAD_MS or any error just removes the overlay.
import './intro.css';
import { shouldPlay } from './decide.js';
import { FADE } from './path.js';

const KEY = 'qubits.labs.introSeen';
const LOAD_MS = 2000;
const TEXT = {
  es: { title: 'Entrando a la cabina del A320…', skip: 'Saltar intro', label: 'Intro de cabina' },
  en: { title: 'Entering the A320 cockpit…', skip: 'Skip intro', label: 'Cockpit intro' },
};
const query = () => new URLSearchParams(location.search);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const readSeen = () => { try { return localStorage.getItem(KEY); } catch { return undefined; } };
const markSeen = () => { try { localStorage.setItem(KEY, '1'); } catch { /* private mode */ } };

let running = false;
let state = 'idle';
/** @type {{frames: number}|null} */
let current = null;
if (query().get('debug3d') !== null) window.__intro = () => ({ state, frames: current?.frames ?? 0 });

/** @param {{target?: 'pfd'|'mcdu', lang?: string, force?: boolean}} [opts] */
export async function maybeIntro({ target = 'pfd', lang = 'es', force = false } = {}) {
  if (running) return;
  const q = query();
  const reducedMotion = !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (!shouldPlay({ force, param: q.get('intro'), seen: readSeen(), reducedMotion })) return;
  running = true; state = 'loading'; current = null;
  markSeen();

  const t = TEXT[lang] ?? TEXT.es;
  const prev = /** @type {HTMLElement|null} */ (document.activeElement);
  const el = document.createElement('div');
  el.className = 'intro';
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-modal', 'true');
  el.setAttribute('aria-label', t.label);
  el.innerHTML = '<canvas class="intro-canvas"></canvas><p class="intro-title"></p><button type="button" class="intro-skip"></button>';
  el.querySelector('.intro-title').textContent = t.title;
  const skipBtn = /** @type {HTMLButtonElement} */ (el.querySelector('.intro-skip'));
  skipBtn.textContent = t.skip;
  document.body.append(el);
  document.documentElement.classList.add('intro-open');
  skipBtn.focus();

  /** @type {any} */
  let view = null, abandoned = false, skipped = false;
  /** @type {() => void} */
  let resolveSkip = () => {};
  const skipP = new Promise((r) => { resolveSkip = r; });
  const skip = () => { skipped = true; view?.skip(); resolveSkip(); };
  // Window capture: runs before the page's own key handlers (PFD sidestick arrows) and keeps the key from them.
  const onKey = (e) => { e.stopPropagation(); if (e.key === 'Escape') e.preventDefault(); skip(); };
  const fit = () => view?.resize(innerWidth, innerHeight);
  window.addEventListener('keydown', onKey, true);
  el.addEventListener('pointerdown', skip);
  window.addEventListener('resize', fit);

  try {
    const canvas = /** @type {HTMLCanvasElement} */ (el.querySelector('canvas'));
    const load = import('./flyin.js')
      .then((m) => m.createFlyin(canvas, { target, debugFail: q.get('debug3d') === 'nowebgl' }))
      .then((v) => { if (abandoned) { v.dispose(); return null; } return v; });
    view = (await Promise.race([load, wait(LOAD_MS), skipP]).catch(() => null)) || null;
    if (!view) abandoned = true;
    if (view && !skipped) {
      current = view; fit(); state = 'playing';
      await Promise.race([view.play(), skipP]);
      el.classList.add('intro-out');
      await wait(FADE * 1000);
    }
  } finally {
    window.removeEventListener('keydown', onKey, true);
    window.removeEventListener('resize', fit);
    el.remove();
    document.documentElement.classList.remove('intro-open');
    view?.dispose();
    if (prev && prev !== document.body && prev.isConnected) prev.focus();
    state = 'done'; running = false;
  }
}
```

Note: `frames` keeps the last count after `done` (`current` is not cleared) so check 7 can compare it; a
disposed view never renders again.

- [ ] **Step 6: Commit (smoke still red: no page calls it yet — Task 3 wires it)**

Run: `cd landing-page-svelte && npm run build 2>&1 | tail -5`
Expected: build succeeds (the modules are not imported yet, so nothing changes in the output).

```bash
git add src/labs/shared/intro/flyin.js src/labs/shared/intro/intro.js src/labs/shared/intro/intro.css
git commit -m "feat: cockpit fly-in scene and intro overlay"
```

---

### Task 3: Wire both trainers, update smokes and docs

**Files:**
- Modify: `src/labs/pfd/main.js`, `src/labs/pfd/App.svelte` (header, ~line 247), `src/labs/pfd/i18n.js` (lines ~41 and ~119)
- Modify: `src/labs/mcdu/main.js`, `labs/mcdu-trainer/index.html` (header, after `#explainBtn`), `src/labs/mcdu/trainer.js` (`STATIC_EN`, ~line 1139)
- Modify: `AGENTS.md`, `docs/superpowers/specs/2026-10-09-cockpit-flyin-intro-design.md` (status), `docs/superpowers/specs/2026-10-09-pfd-trainer-design.md` (roadmap)
- Modify (scratch): `ext3d.mjs`, `map3d.mjs`, `panel.mjs`, `smoke.mjs`, `mcdu-baseline/dump.sh` — add `intro=0` to every URL they load

**Interfaces:**
- Consumes: `maybeIntro({ target, lang, force })` from Task 2.

- [ ] **Step 1: PFD** — `src/labs/pfd/main.js`:

```js
import { mount } from 'svelte'
import { inject } from '@vercel/analytics'
import './pfd.css'
import App from './App.svelte'
import { detectLang } from './i18n.js'
import { maybeIntro } from '../shared/intro/intro.js'

const app = mount(App, {
  target: document.getElementById('app'),
})

maybeIntro({ target: 'pfd', lang: detectLang() })
inject()

export default app
```

`App.svelte`: add `import { maybeIntro } from '../shared/intro/intro.js';` with the other imports, and after
the `data-3d` button:

```svelte
    <button class="btn" type="button" data-intro title={t.introTitle} onclick={() => maybeIntro({ target: 'pfd', lang, force: true })}>{t.intro}</button>
```

`i18n.js`: after `view3d: '3D', view3dTitle: 'Vista exterior 3D',` add `intro: 'Intro', introTitle: 'Ver intro de cabina',`;
after `view3d: '3D', view3dTitle: '3D exterior view',` add `intro: 'Intro', introTitle: 'Watch cockpit intro',`.

- [ ] **Step 2: MCDU** — `labs/mcdu-trainer/index.html`, after the `#explainBtn` line:

```html
    <button class="btn" id="introBtn" type="button" title="Ver intro de cabina" data-i18n="intro" data-i18n-attr="title:introTitle">Intro</button>
```

`trainer.js` `STATIC_EN`: add `intro:'Intro',introTitle:'Watch cockpit intro',` next to `glossary:'Glossary',`.

`src/labs/mcdu/main.js`:

```js
import { inject } from '@vercel/analytics'
import './mcdu.css'
import './trainer.js'
import { initPlanTab } from './fpln3d/tab.js'
import { mountFeedback } from '../shared/feedback/feedback-panel.js'
import { maybeIntro } from '../shared/intro/intro.js'
import '../shared/pfd-promo.js'
initPlanTab()
mountFeedback({ key: import.meta.env.VITE_WEB3FORMS_FEEDBACK_KEY })
const lang = document.documentElement.lang === 'en' ? 'en' : 'es'
document.getElementById('introBtn')?.addEventListener('click', () => maybeIntro({ target: 'mcdu', lang, force: true }))
maybeIntro({ target: 'mcdu', lang })
inject()
```

- [ ] **Step 3: Run the intro smoke, verify it passes**

Run: `bash <scratchpad>/cdp/run-intro.sh "$PWD"`
Expected: all checks ok, `0 failed`. Take one screenshot mid-flight (t ≈ 0.6) and one at the end for each
target and look at them: the camera must come in over the nose and end on a lit green screen.

- [ ] **Step 4: Keep existing smokes meaningful** — add `intro=0` to the URLs in the scratch smokes and the MCDU
  DOM dump (e.g. `go('?debug3d')` → `go('?debug3d&intro=0')`, `?` → `?intro=0`), then run all of them:

Run: `bash <scratchpad>/cdp/all-checks.sh "$PWD"` (or each `run-*.sh`) and the DOM dump diff.
Expected: all pass; MCDU DOM diff (ES/EN) = only the new `#introBtn` line. `node scripts/check-pfd.mjs`,
`check-pfd-content.mjs`, `check-pfd-exercises.mjs`, `check-pfd-3d.mjs`, `check-mcdu-fpln3d.mjs`,
`check-feedback.mjs`, `check-intro.mjs` all pass; `npm run build` with no warnings; the `pfd-*.js` and `mcdu-*.js`
entry chunks do not contain `WebGLRenderer` (`grep -l WebGLRenderer dist/assets/*.js` lists only lazy chunks).

- [ ] **Step 5: Docs** — `AGENTS.md`: new section after "## MCDU Trainer":

```markdown
## Cockpit Intro

Both trainers play a short 3D fly-in on first visit (`localStorage` `qubits.labs.introSeen`, shared) and from a header "Intro" button. `src/labs/shared/intro/`: `intro.js` (eager overlay + decision via `decide.js`), `flyin.js` (the only intro module importing `three`, lazy), `path.js` (pure camera path); flight deck model in `src/labs/shared/three/cockpit.js`. Skipped without WebGL, with reduced motion (auto only) or if three takes > 2 s. `?intro=0` suppresses, `?intro=1` forces, `?debug3d` exposes `window.__intro()`. Checks: `node scripts/check-intro.mjs`. Smoke tests that load a trainer should add `intro=0`.
```

Spec status line → `Status: implemented (2026-10-09).`; PFD design roadmap: mark "shared cockpit fly-in intro"
done with a pointer to the spec.

- [ ] **Step 6: Commit**

```bash
git add src/labs/pfd/main.js src/labs/pfd/App.svelte src/labs/pfd/i18n.js src/labs/mcdu/main.js labs/mcdu-trainer/index.html src/labs/mcdu/trainer.js ../AGENTS.md ../docs/superpowers/specs/2026-10-09-cockpit-flyin-intro-design.md ../docs/superpowers/specs/2026-10-09-pfd-trainer-design.md
git commit -m "feat: cockpit fly-in intro on the PFD and MCDU trainers"
```
