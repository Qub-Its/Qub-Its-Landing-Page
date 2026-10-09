// Checks for the labs' cockpit fly-in intro: show/skip decision, camera path, procedural flight deck.
// Run from landing-page-svelte/:  node scripts/check-intro.mjs
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { shouldPlay } from '../src/labs/shared/intro/decide.js';
import { keyframes, cameraAt, veilAt, fovFor, T_CUT, DURATION, FADE } from '../src/labs/shared/intro/path.js';
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
const PARTS = ['shell', 'bulkhead', 'glareshield', 'panel', 'pfdL', 'ndL', 'ewd', 'sd', 'ndR', 'pfdR', 'pedestal', 'mcduL', 'mcduR'];
await check('flight deck: group name and all parts', () => {
  assert.equal(deck.name, 'flightDeck');
  for (const n of PARTS) assert.ok(deck.getObjectByName(n), `missing ${n}`);
});
await check('flight deck: every part inside the fuselage (r ≤ 2 m, z ∈ [−15.7, −12.4])', () => {
  for (const n of PARTS) {
    const o = deck.getObjectByName(n), box = new THREE.Box3().setFromObject(o);
    assert.ok(box.min.z >= -15.7 && box.max.z <= -12.4, `${n} z ${box.min.z}..${box.max.z}`);
    const p = o.geometry.attributes.position, v = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i).applyMatrix4(o.matrixWorld);
      assert.ok(Math.hypot(v.x, v.y) <= 2, `${n} vertex (${v.x}, ${v.y})`);
    }
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
await check('bulkhead closes the nose below the glareshield only (sky through the windshield)', () => {
  const box = new THREE.Box3().setFromObject(deck.getObjectByName('bulkhead'));
  assert.ok(box.max.y <= 0.95 && box.min.y < -1.5, `bulkhead y ${box.min.y}..${box.max.y}`);
  assert.ok(box.max.z < -15.31, `bulkhead must sit ahead of the panel, z ${box.max.z}`);
});
await check('screens have their own materials (lighting one does not light the others)', () => {
  assert.notEqual(deck.getObjectByName('pfdL').material, deck.getObjectByName('ndL').material);
});

// ---- camera path
await check('timing constants', () => { assert.equal(DURATION, 3.5); assert.equal(FADE, 0.4); });
await check('portrait screens widen the vertical FOV so the aircraft fits (capped at 80°)', () => {
  assert.equal(fovFor(1.6), 50); assert.equal(fovFor(1), 50);
  const v = fovFor(0.46), h = 2 * Math.atan(Math.tan(v * Math.PI / 360) * 0.46) * 180 / Math.PI;
  assert.ok(v > 50 && v <= 80 && h >= 40, `v ${v} h ${h}`);
  assert.ok(Number.isFinite(fovFor(0)) && fovFor(0) <= 80);
});
for (const target of ['pfd', 'mcdu']) {
  const { pos: sp, normal: sn } = screenPose(SCREENS[target]);
  const frames = keyframes(target, sp, sn);
  await check(`${target}: keyframe t increasing from 0 to 1 (equal only at the cut)`, () => {
    assert.equal(frames[0].t, 0); assert.equal(frames.at(-1).t, 1);
    for (let i = 1; i < frames.length; i++)
      assert.ok(frames[i].t > frames[i - 1].t || (frames[i].cut && frames[i].t === frames[i - 1].t), `frame ${i}`);
  });
  // The flight deck faces aft, so a continuous path in through the windshield has to turn the view 180°.
  // Instead the camera reaches the glass, the view goes dark (veil) and cuts to the captain's eye point.
  const ease = (t) => t * t * (3 - 2 * t);
  const viewDir = (t) => { const { pos, look } = cameraAt(frames, t); const d = sub(look, pos); return d.map((v) => v / len(d)); };
  await check(`${target}: the view never swings more than 6° per 1/400 of the intro, except across the cut`, () => {
    for (let i = 1; i <= 400; i++) {
      const a = (i - 1) / 400, b = i / 400;
      if (ease(a) < T_CUT && ease(b) >= T_CUT) continue;
      const deg = Math.acos(Math.min(1, dot(viewDir(a), viewDir(b)))) * 180 / Math.PI;
      assert.ok(deg < 6, `t ${a}→${b}: ${deg.toFixed(1)}°`);
    }
  });
  await check(`${target}: before the cut outside at the glass, after it inside behind the panel looking forward`, () => {
    let tc = 0; while (ease(tc) < T_CUT) tc += 1 / 4000;
    const before = cameraAt(frames, tc - 1 / 4000), after = cameraAt(frames, tc);
    assert.ok(before.pos[2] < -16.3, `before z ${before.pos[2]}`);
    assert.ok(after.pos[2] > -15.19 && after.look[2] < after.pos[2], `after ${after.pos} → ${after.look}`);
  });
  await check(`${target}: veil fully dark at the cut, clear at start and end`, () => {
    let tc = 0; while (ease(tc) < T_CUT) tc += 1 / 4000;
    assert.ok(veilAt(tc) > 0.95, `veil ${veilAt(tc)}`);
    assert.equal(veilAt(0), 0); assert.equal(veilAt(1), 0); assert.equal(veilAt(0.25), 0);
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
