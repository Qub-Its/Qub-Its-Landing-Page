// Checks for the PFD 3D exterior view: pose math, consistency with the sim, procedural model.
// Run from landing-page-svelte/:  node scripts/check-pfd-3d.mjs
import assert from 'node:assert/strict';
import { poseFrom, rotate, aoaArc } from '../src/labs/pfd/view3d/pose.js';
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

await check('AoA arc ends on the FPV and spans pitch − fpa at any bank', () => {
  for (const bank of [0, 30, 60, -45]) {
    const p = poseFrom({ ...base, pitch: 5, fpa: 0, bank, hdg: 40, track: 40 });
    const { points, angle } = aoaArc(p, 24, 1);
    near(angle, 5, 1e-6, `bank ${bank} angle`);
    const last = rotate([points[69], points[70], points[71]], p);
    p.fpv.forEach((c, i) => near(last[i], c, 1e-6, `bank ${bank} end[${i}]`));
    const first = rotate([points[0], points[1], points[2]], p), nose = rotate([0, 0, -1], p);
    nose.forEach((c, i) => near(first[i], c, 1e-6, `bank ${bank} start[${i}]`));
  }
});
await check('AoA arc: zero angle stays finite', () => {
  const { points, angle } = aoaArc(poseFrom(base), 24, 1);
  assert.equal(angle, 0); assert.ok([...points].every(Number.isFinite));
});

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
  const fin = new THREE.Box3().setFromObject(g.getObjectByName('fin')).getCenter(new THREE.Vector3());
  assert.ok(fin.z > 10 && fin.y > 3, `fin centre ${fin.toArray()}`);
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
