// Logic checks for the G1000 course (world, nav, sim, avionics). Run from landing-page-svelte/:  node scripts/check-g1000.mjs
// (The store g1000.svelte.js uses runes and is not importable from plain Node; everything it calls is checked here.)
import assert from 'node:assert/strict';
import * as N from '../src/labs/g1000/lib/nav.js';
import * as W from '../src/labs/g1000/lib/world.js';
import { byId } from '../src/labs/g1000/lib/world.js';
import { distNm, radialOf } from '../src/labs/g1000/lib/nav.js';
import { createState } from '../src/labs/g1000/lib/state.js';
import { step, DT, gduPhase, applyPower, adcValid, ahrsValid, indicatedAlt } from '../src/labs/g1000/lib/sim.js';
import { guidance } from '../src/labs/g1000/lib/guidance.js';

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
  const MORSE = { A: '·—', B: '—···', D: '—··', E: '·', L: '·—··', R: '·—·', V: '···—' };
  const decode = (m) => m.split(' ').map((c) => Object.keys(MORSE).find((k) => MORSE[k] === c) ?? '?').join('');
  for (const v of W.VORS) assert.equal(decode(v.morse), v.id, `${v.id} morse`);
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

// ---- state + sim + guidance
const run = (s, secs) => { for (let i = 0; i < Math.round(secs / DT); i++) step(s, DT); return s; };

check('createState: scenarios', () => {
  assert.equal(createState('enroute').ac.onGround, false);
  const cold = createState('cold');
  assert.equal(cold.power.pfdOn, null); assert.equal(gduPhase(cold, 'pfd'), 'off'); assert.equal(gduPhase(cold, 'mfd'), 'off');
  assert.equal(gduPhase(createState('enroute'), 'mfd'), 'ready');
});
check('power-up: MASTER → PFD boots, AHRS after 13 s; AVIONICS → MFD waits for database ENT', () => {
  const s = createState('cold');
  s.power.master = true; applyPower(s);
  assert.equal(gduPhase(s, 'pfd'), 'boot'); assert.equal(gduPhase(s, 'mfd'), 'off');
  run(s, 4); assert.equal(gduPhase(s, 'pfd'), 'ready'); assert.equal(adcValid(s), false); assert.equal(ahrsValid(s), false);
  run(s, 3); assert.equal(adcValid(s), true); assert.equal(ahrsValid(s), false);
  run(s, 7); assert.equal(ahrsValid(s), true);
  s.power.avionics = true; applyPower(s); run(s, 4);
  assert.equal(gduPhase(s, 'mfd'), 'db');
  s.power.master = false; applyPower(s);
  assert.equal(gduPhase(s, 'pfd'), 'off'); assert.equal(gduPhase(s, 'mfd'), 'off'); assert.equal(s.power.dbOk, false);
});
check('engine switch: RPM rises to 1000 on the ground', () => {
  const s = createState('ground'); s.power.engine = true; s.ac.rpm = 0; run(s, 5); near(s.ac.rpm, 1000, 1);
});
check('on the ground nothing moves', () => {
  const s = createState('ground'); const { lat, lon } = s.ac; run(s, 30);
  assert.equal(s.ac.lat, lat); assert.equal(s.ac.lon, lon);
});
check('HDG mode: standard-rate turn 045 → 135 takes ~30 s, bank ≈ 17°', () => {
  const s = createState('enroute'); s.pilot.mode = 'hdg'; s.wind.kt = 0; s.sel.hdg = 135;
  run(s, 10); assert.ok(s.ac.bank > 14 && s.ac.bank < 20, `bank ${s.ac.bank}`);
  run(s, 25); near(s.ac.hdg, 135, 0.5);
});
check('altitude capture: 4500 → 5500 at ~700 fpm, then level', () => {
  const s = createState('enroute'); s.sel.alt = 5500;
  run(s, 30); assert.ok(s.ac.vs > 600, `vs ${s.ac.vs}`); assert.ok(s.ac.ias < 85);
  run(s, 150); near(indicatedAlt(s), 5500, 5); assert.ok(Math.abs(s.ac.vs) < 30);
});
check('baro: indicated = true + (baro − QNH) × 1000', () => {
  const s = createState('enroute'); s.sel.baro = 29.92; near(indicatedAlt(s), s.ac.alt - 200, 1e-6);
});
check('wind: 10 kt from the west on a northbound heading drifts the track right', () => {
  const s = createState('enroute'); s.pilot.mode = 'hdg'; s.sel.hdg = 0; s.ac.hdg = 0; run(s, 5);
  assert.ok(s.ac.trk > 3 && s.ac.trk < 6, `trk ${s.ac.trk}`);
});
check('Direct-To: the instructor flies to SQ04 and arrives (crosswind)', () => {
  const s = createState('enroute');
  s.gps.dto = { id: 'SQ04', from: { lat: s.ac.lat, lon: s.ac.lon } };
  const g0 = guidance(s); assert.ok(g0.valid && g0.id === 'SQ04');
  run(s, 120); assert.ok(Math.abs(guidance(s).xtk) < 0.3, `xtk ${guidance(s).xtk}`);
  let best = Infinity; for (let i = 0; i < 20 * 60 / 5; i++) { run(s, 5); best = Math.min(best, guidance(s).dis); }
  assert.ok(best < 0.5, `closest ${best}`);
});
check('flight plan: SQ01 → MIRA → SQ02 sequences at MIRA with turn anticipation', () => {
  const s = createState('enroute');
  s.gps.fpl = { legs: ['SQ01', 'MIRA', 'SQ02'], active: 1 };
  for (let i = 0; i < 40 * 60 && s.gps.fpl.active === 1; i++) run(s, 1);
  assert.equal(s.gps.fpl.active, 2);
  assert.ok(distNm(s.ac, byId('MIRA')) < 1.5);
  run(s, 120); assert.ok(Math.abs(guidance(s).xtk) < 0.5, `xtk after turn ${guidance(s).xtk}`);
});
check('OBS mode: course 090 to MIRA, sequencing suspended', () => {
  const s = createState('enroute'); s.gps.fpl = { legs: ['SQ01', 'MIRA', 'SQ02'], active: 1 };
  s.pfd.obs = true; s.sel.obsCrs = 90;
  const g = guidance(s); assert.equal(g.dtk, 90); assert.equal(g.id, 'MIRA');
  run(s, 20 * 60); assert.equal(s.gps.fpl.active, 1);
  assert.ok(Math.abs(guidance(s).xtk) < 0.5);
});
check('VOR1: ALB radial 360 outbound is intercepted and flown, FROM', () => {
  const s = createState('enroute'); s.pfd.cdi = 'VOR1'; s.nav[0].act = 113.3; s.sel.crs1 = 360;
  const g = guidance(s); assert.ok(g.valid); assert.equal(g.id, 'ALB');
  run(s, 600); const h = guidance(s);
  assert.equal(h.toFrom, 'FROM'); assert.ok(Math.abs(h.defl) < 0.15, `defl ${h.defl}`);
  near(radialOf(byId('ALB'), s.ac), 0, 3, 'radial');
});
check('VOR out of range or not a VOR → invalid', () => {
  const s = createState('enroute'); s.pfd.cdi = 'VOR1'; s.nav[0].act = 110.5; assert.equal(guidance(s).valid, false);
  s.nav[0].act = 113.3; s.ac.lat = 12; assert.equal(guidance(s).valid, false);
});
check('no guidance in auto mode → the instructor flies the HDG bug', () => {
  const s = createState('enroute'); s.wind.kt = 0; s.sel.hdg = 90; run(s, 40); near(s.ac.hdg, 90, 1);
});
check('XPDR IDENT counts down', () => { const s = createState('enroute'); s.xpdr.ident = 18; run(s, 18.5); assert.equal(s.xpdr.ident, 0); });

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
