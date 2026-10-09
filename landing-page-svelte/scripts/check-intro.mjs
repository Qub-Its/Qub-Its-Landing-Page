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
  await check(`${target}: inside the cabin nothing of the exterior hides the view (raycast to the look point)`, () => {
    // flyin.js hides the exterior window mesh ('cockpit') once inside; everything else must stay out of the way.
    const deckMeshes = new Set(); deck.traverse((o) => deckMeshes.add(o));
    const others = []; plane.traverse((o) => { if (o.isMesh && o.name !== 'cockpit') others.push(o); });
    for (const t of [0.8, 0.9, 1]) {
      const { pos, look } = cameraAt(frames, t);
      const from = new THREE.Vector3(...pos), dir = new THREE.Vector3(...look).sub(from).normalize();
      const hit = new THREE.Raycaster(from, dir, 0.01, 50).intersectObjects(others, false).find((h) => h.object.name !== 'shell');
      // No hit = sky through the windshield, fine; a hit must belong to the flight deck.
      assert.ok(!hit || deckMeshes.has(hit.object), `t ${t}: first hit ${hit?.object.name}`);
      if (t === 1) assert.equal(hit?.object.name, SCREENS[target]);
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
