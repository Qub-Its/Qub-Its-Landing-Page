// Logic checks for the G1000 course (world, nav, sim, avionics). Run from landing-page-svelte/:  node scripts/check-g1000.mjs
// (The store g1000.svelte.js uses runes and is not importable from plain Node; everything it calls is checked here.)
import assert from 'node:assert/strict';
import * as N from '../src/labs/g1000/lib/nav.js';
import * as W from '../src/labs/g1000/lib/world.js';

let passed = 0, failed = 0;
function check(name, fn) {
  try { fn(); passed++; console.log(`  ok   ${name}`); }
  catch (e) { failed++; console.log(`  FAIL ${name}\n       ${e.message}`); }
}
const near = (a, b, tol, msg = '') => assert.ok(Math.abs(a - b) <= tol, `${msg} ${a} vs ${b} (tol ${tol})`);

console.log('G1000 checks');

// ---- nav
check('norm360 / angleDiff', () => {
  near(N.norm360(-10), 350, 1e-9); near(N.norm360(720), 0, 1e-9);
  near(N.angleDiff(10, 350), 20, 1e-9); near(N.angleDiff(350, 10), -20, 1e-9); near(N.angleDiff(180, 0), 180, 1e-9);
});
check('1° of latitude ≈ 60 NM, bearing north', () => {
  near(N.distNm({ lat: 10, lon: -64 }, { lat: 11, lon: -64 }), 60.04, 0.05);
  near(N.brgDeg({ lat: 10, lon: -64 }, { lat: 11, lon: -64 }), 0, 1e-6);
});
check('destination ↔ distNm/brgDeg round trip', () => {
  const p = { lat: 10, lon: -64 };
  for (const b of [0, 45, 135, 270]) {
    const q = N.destination(p, b, 25);
    near(N.distNm(p, q), 25, 1e-6, `dist ${b}`); near(N.angleDiff(N.brgDeg(p, q), b), 0, 1e-6, `brg ${b}`);
  }
});
check('xtk sign: right of a northbound course is > 0', () => {
  const a = { lat: 10, lon: -64 }, b = { lat: 11, lon: -64 };
  assert.ok(N.xtkNm(a, b, { lat: 10.5, lon: -63.9 }) > 5.8);
  assert.ok(N.xtkNm(a, b, { lat: 10.5, lon: -64.1 }) < -5.8);
});
check('gpsDefl: right of course → needle left, clamped', () => {
  near(N.gpsDefl(1), -0.5, 1e-9); near(N.gpsDefl(-5), 1, 1e-9);
});
check('courseGuidance TO/FROM on the course line', () => {
  const fix = { lat: 10, lon: -64 };
  const south = N.destination(fix, 180, 10), north = N.destination(fix, 0, 10);
  assert.equal(N.courseGuidance(fix, 0, south).toFrom, 'TO');
  assert.equal(N.courseGuidance(fix, 0, north).toFrom, 'FROM');
  near(N.courseGuidance(fix, 0, south).xtk, 0, 1e-6);
});
check('vorCdi: on radial 090 outbound with CRS 090 → FROM, centred; 5° off → half scale', () => {
  const st = { lat: 10, lon: -64 };
  const on = N.destination(st, 90, 20);
  const c = N.vorCdi(st, 90, on); assert.equal(c.toFrom, 'FROM'); near(c.defl, 0, 1e-6);
  const off = N.destination(st, 95, 20); // clockwise of course outbound = right of course → needle left
  near(N.vorCdi(st, 90, off).defl, -0.5, 0.01);
  const inbound = N.destination(st, 270, 20); // west of station, CRS 090 → TO
  assert.equal(N.vorCdi(st, 90, inbound).toFrom, 'TO');
});
check('turnAnticipationNm: 90° at 120 kt ≈ 0.64 NM', () => near(N.turnAnticipationNm(120, 90), 0.637, 0.01));

// ---- world
check('world ids unique, frequencies on grid', () => {
  assert.equal(new Set(W.ALL.map((w) => w.id)).size, W.ALL.length);
  for (const a of W.AIRPORTS) for (const f of a.freqs) near(Math.round(f.f * 1000) % 25, 0, 0, `${a.id} ${f.f}`);
  for (const v of W.VORS) assert.ok(v.freq >= 108 && v.freq <= 117.95 && Math.round(v.freq * 100) % 5 === 0, v.id);
});
check('complete(): alphabetical prefix match', () => {
  assert.equal(W.complete('SQ0'), 'SQ01'); assert.equal(W.complete('SQ04'), 'SQ04');
  assert.equal(W.complete('T'), 'TOLKA'); assert.equal(W.complete('X'), null); assert.equal(W.complete(''), null);
});
check('nearest(): sorted, SQ01 first from its own position', () => {
  const list = W.nearest({ lat: 10, lon: -64 });
  assert.equal(list[0].apt.id, 'SQ01'); assert.equal(list.length, 5);
  for (let i = 1; i < list.length; i++) assert.ok(list[i].dis >= list[i - 1].dis);
});
check('vorByFreq', () => { assert.equal(W.vorByFreq(113.3)?.id, 'ALB'); assert.equal(W.vorByFreq(110.0), null); });

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
