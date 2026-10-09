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
