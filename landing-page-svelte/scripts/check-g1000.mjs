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
import { dispatch, tuneFreq, editValue } from '../src/labs/g1000/lib/avionics.js';
import { MENUS, softkeys } from '../src/labs/g1000/lib/softkeys.js';
import { pageId, mfdField, nrstAirport } from '../src/labs/g1000/lib/pages.js';

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

// ---- avionics
const ev = {
  knob: (gdu, id, ring, d = 1) => ({ type: 'knob', gdu, id, ring, d }),
  push: (gdu, id) => ({ type: 'push', gdu, id }),
  key: (gdu, id, long = false) => ({ type: 'key', gdu, id, long }),
  soft: (gdu, n) => ({ type: 'soft', gdu, n }),
  char: (gdu, c) => ({ type: 'char', gdu, c }),
};
/** Dispatches events in order (a function is called with the state first, for softkeys found by label), returns the last message. */
function play(s, ...events) {
  let msg = null;
  for (const e of events) msg = dispatch(s, typeof e === 'function' ? e(s) : e);
  return msg;
}
const typeId = (gdu, id) => [...id].map((c) => ev.char(gdu, c));
/** Softkey by label in the menu shown when the event runs. */
const softBy = (_s, gdu, label) => (st) => ev.soft(gdu, MENUS[gdu][st[gdu].menu].indexOf(label));

check('tuneFreq: COM 25 kHz inner wraps inside the MHz, outer wraps 118–136', () => {
  near(tuneFreq(118.975, 'com', 'inner', 1), 118.0, 1e-9);
  near(tuneFreq(118.0, 'com', 'inner', -1), 118.975, 1e-9);
  near(tuneFreq(136.5, 'com', 'outer', 1), 118.5, 1e-9);
  near(tuneFreq(113.3, 'nav', 'inner', 1), 113.35, 1e-9);
  near(tuneFreq(108.0, 'nav', 'outer', -1), 117.0, 1e-9);
});
check('COM: tune standby, swap, push toggles COM1/COM2 tuning', () => {
  const s = createState('enroute');
  play(s, ev.knob('pfd', 'com', 'outer', -6), ev.knob('pfd', 'com', 'inner', 2));
  near(s.com[0].stby, 131.35, 1e-9);
  play(s, ev.key('mfd', 'comSwap')); near(s.com[0].act, 131.35, 1e-9); near(s.com[0].stby, 124.35, 1e-9);
  play(s, ev.push('pfd', 'com')); assert.equal(s.comTune, 1);
  play(s, ev.knob('pfd', 'com', 'inner', 1)); near(s.com[1].stby, 121.525, 1e-9);
});
check('NAV: tune standby to 116.60 and swap', () => {
  const s = createState('enroute'); s.nav[0] = { act: 110.0, stby: 113.3 };
  play(s, ev.knob('pfd', 'nav', 'outer', 3), ev.knob('pfd', 'nav', 'inner', 6), ev.key('pfd', 'navSwap'));
  near(s.nav[0].act, 116.6, 1e-9);
});
check('bugs: HDG knob/push sync, ALT 1000/100, BARO, STD BARO', () => {
  const s = createState('enroute');
  play(s, ev.knob('pfd', 'hdg', 'inner', -50)); assert.equal(s.sel.hdg, 355);
  play(s, ev.push('pfd', 'hdg')); assert.equal(s.sel.hdg, 45);
  play(s, ev.knob('pfd', 'alt', 'outer', 1), ev.knob('pfd', 'alt', 'inner', -3)); assert.equal(s.sel.alt, 5200);
  s.sel.baro = 29.92; play(s, ev.knob('pfd', 'crsbaro', 'outer', 20)); near(s.sel.baro, 30.12, 1e-9);
  play(s, softBy(s, 'pfd', 'PFD'), softBy(s, 'pfd', 'STD BARO')); near(s.sel.baro, 29.92, 1e-9);
});
check('XPDR: CODE 4-7-2-1 activates, VFR → 1200, modes, IDENT only when not STBY', () => {
  const s = createState('cold'); s.power.master = true; s.power.avionics = true; applyPower(s); s.t += 20; s.power.dbOk = true;
  play(s, softBy(s, 'pfd', 'XPDR'), softBy(s, 'pfd', 'CODE'));
  assert.equal(s.pfd.menu, 'code'); assert.equal(s.xpdr.entry, '');
  play(s, ev.soft('pfd', 4), ev.soft('pfd', 7), ev.soft('pfd', 9), ev.soft('pfd', 2), ev.soft('pfd', 1)); // 4 7 BKSP 2 1 → 421?
  assert.equal(s.xpdr.entry, '421');
  play(s, ev.soft('pfd', 7)); assert.equal(s.xpdr.code, '4217'); assert.equal(s.pfd.menu, 'xpdr');
  play(s, softBy(s, 'pfd', 'IDENT')); assert.equal(s.xpdr.ident, 0, 'STBY: no ident');
  play(s, softBy(s, 'pfd', 'XPDR'), softBy(s, 'pfd', 'ALT')); assert.equal(s.xpdr.mode, 'ALT');
  play(s, softBy(s, 'pfd', 'VFR')); assert.equal(s.xpdr.code, '1200');
  play(s, softBy(s, 'pfd', 'IDENT')); assert.equal(s.xpdr.ident, 18); assert.equal(s.pfd.menu, 'root');
});
check('softkeys: unsupported → "na"; labels/on state', () => {
  const s = createState('enroute');
  assert.equal(play(s, softBy(s, 'pfd', 'DME')), 'na');
  play(s, softBy(s, 'pfd', 'INSET')); assert.equal(s.pfd.inset, true);
  assert.equal(softkeys(s, 'pfd')[0].label, 'OFF');
  play(s, softBy(s, 'pfd', 'OFF')); assert.equal(s.pfd.inset, false); assert.equal(s.pfd.menu, 'root');
  assert.equal(softkeys(s, 'pfd')[1].on, false);
  play(s, softBy(s, 'mfd', 'DCLTR')); assert.equal(softkeys(s, 'mfd')[10].label, 'DCLTR-1');
});
check('CDI cycles GPS → VOR1 → VOR2 → GPS; BRG1 cycles OFF → NAV1 → GPS → OFF', () => {
  const s = createState('enroute');
  for (const want of ['VOR1', 'VOR2', 'GPS']) { play(s, softBy(s, 'pfd', 'CDI')); assert.equal(s.pfd.cdi, want); }
  play(s, softBy(s, 'pfd', 'PFD'));
  for (const want of ['nav1', 'gps', 'off']) { play(s, softBy(s, 'pfd', 'BRG1')); assert.equal(s.pfd.brg1, want); }
});
check('CRS knob sets VOR1 course; CRS push centres with TO', () => {
  const s = createState('enroute'); play(s, softBy(s, 'pfd', 'CDI'));
  play(s, ev.knob('pfd', 'crsbaro', 'inner', 30)); assert.equal(s.sel.crs1, 30);
  play(s, ev.push('pfd', 'crsbaro'));
  const g = guidance(s); assert.equal(g.toFrom, 'TO'); assert.ok(Math.abs(g.defl) < 0.06, `defl ${g.defl}`);
});
check('MFD: FMS outer cycles page groups, inner pages; CLR long returns to the map', () => {
  const s = createState('enroute');
  play(s, ev.knob('mfd', 'fms', 'outer', 1)); assert.equal(pageId(s), 'WPT_APT');
  play(s, ev.knob('mfd', 'fms', 'outer', 1), ev.knob('mfd', 'fms', 'inner', 1)); assert.equal(pageId(s), 'AUX_GPS');
  play(s, ev.knob('mfd', 'fms', 'outer', 1)); assert.equal(pageId(s), 'NRST_APT');
  play(s, ev.key('mfd', 'clr', true)); assert.equal(pageId(s), 'MAP_NAV');
});
check('MFD map: MENU → orientation track up; RANGE knob steps', () => {
  const s = createState('enroute');
  play(s, ev.key('mfd', 'menu'), ev.key('mfd', 'ent')); assert.equal(s.mfd.orient, 'track'); assert.equal(s.menu, null);
  play(s, ev.knob('mfd', 'range', 'inner', -2)); assert.equal(s.mfd.range, 10);
  play(s, ev.knob('pfd', 'range', 'inner', 1)); assert.equal(s.pfd.insetRange, 10);
});
check('WPT Airport Info: type SQ04, ENT; load TWR frequency into COM1 standby', () => {
  const s = createState('enroute');
  play(s, ev.knob('mfd', 'fms', 'outer', 1), ev.push('mfd', 'fms')); assert.equal(mfdField(s), 'ident');
  play(s, ...typeId('mfd', 'SQ04'), ev.key('mfd', 'ent')); assert.equal(s.mfd.wpt, 'SQ04');
  assert.equal(play(s, ev.key('mfd', 'ent')), null);
  play(s, ev.knob('mfd', 'fms', 'outer', 3)); assert.equal(mfdField(s), 'f2');
  assert.equal(play(s, ev.key('mfd', 'ent')), 'freqLoaded'); near(s.com[0].stby, 119.1, 1e-9);
  play(s, ev.knob('mfd', 'fms', 'outer', -3)); assert.equal(mfdField(s), 'ident');
  assert.equal(play(s, ...typeId('mfd', 'ALB'), ev.key('mfd', 'ent')), 'notAirport');
});
check('identifier entry with the small knob: A completes to ALB, S to SQ01; outer moves the cursor', () => {
  const s = createState('enroute');
  play(s, ev.key('pfd', 'dto'), ev.knob('pfd', 'fms', 'inner', 1));
  assert.equal(editValue(s.edit), 'ALB');
  play(s, ev.knob('pfd', 'fms', 'inner', 18)); assert.equal(editValue(s.edit), 'SQ01');
  play(s, ev.knob('pfd', 'fms', 'outer', 1), ev.knob('pfd', 'fms', 'outer', 1), ev.knob('pfd', 'fms', 'outer', 1));
  play(s, ev.knob('pfd', 'fms', 'inner', 3)); assert.equal(editValue(s.edit), 'SQ04');
});
check('Direct-To by identifier: D→, type SQ04, ENT, ENT → active, CDI GPS guidance', () => {
  const s = createState('enroute');
  play(s, ev.key('pfd', 'dto'), ...typeId('pfd', 'SQ04'), ev.key('pfd', 'ent'));
  assert.equal(s.dtoWin?.field, 1);
  play(s, ev.key('pfd', 'ent')); assert.equal(s.gps.dto?.id, 'SQ04'); assert.equal(s.dtoWin, null);
  assert.equal(guidance(s).id, 'SQ04');
  assert.equal(play(s, ev.key('pfd', 'dto'), ...typeId('pfd', 'ZZZ'), ev.key('pfd', 'ent')), 'notFound');
});
check('Direct-To from the PFD NRST window (prefilled); cancel via MENU', () => {
  const s = createState('enroute'); s.ac.lat = 10.5; s.ac.lon = -64.3;
  play(s, softBy(s, 'pfd', 'NRST'), ev.push('pfd', 'fms'));
  assert.equal(s.pfd.cursor, 0);
  play(s, ev.key('pfd', 'dto')); assert.equal(s.dtoWin?.id, 'SQ04');
  play(s, ev.key('pfd', 'ent'), ev.key('pfd', 'ent')); assert.equal(s.gps.dto?.id, 'SQ04');
  play(s, ev.key('pfd', 'dto'), ev.key('pfd', 'menu')); assert.deepEqual(s.menu?.items, ['cancelDto']);
  play(s, ev.key('pfd', 'ent')); assert.equal(s.gps.dto, null);
});
check('NRST page: ENT on an airport jumps to its frequencies; ENT loads one', () => {
  const s = createState('enroute');
  play(s, ev.knob('mfd', 'fms', 'outer', -1), ev.push('mfd', 'fms'));
  assert.equal(pageId(s), 'NRST_APT');
  play(s, ev.key('mfd', 'ent')); assert.equal(mfdField(s), 'f0');
  assert.equal(play(s, ev.key('mfd', 'ent')), 'freqLoaded');
  near(s.com[0].stby, nrstAirport(s).freqs[0].f, 1e-9);
});
check('flight plan: build SQ01 → MIRA → SQ02, activate leg, delete with CLR+ENT', () => {
  const s = createState('enroute');
  assert.equal(play(s, ev.key('pfd', 'fpl')), 'useMfd');
  play(s, ev.key('mfd', 'fpl'), ev.push('mfd', 'fms'));
  play(s, ...typeId('mfd', 'SQ01'), ev.key('mfd', 'ent'));
  play(s, ...typeId('mfd', 'MIRA'), ev.key('mfd', 'ent'));
  play(s, ...typeId('mfd', 'SQ02'), ev.key('mfd', 'ent'));
  assert.deepEqual(s.gps.fpl.legs, ['SQ01', 'MIRA', 'SQ02']); assert.equal(s.gps.fpl.active, 1);
  play(s, ev.knob('mfd', 'fms', 'outer', -1)); assert.equal(mfdField(s), 'r2');
  play(s, ev.key('mfd', 'menu'), ev.key('mfd', 'ent')); assert.equal(s.gps.fpl.active, 2);
  // insert TOLKA before MIRA (row 1): active TO (SQ02) shifts to index 3
  play(s, ev.knob('mfd', 'fms', 'outer', -1), ...typeId('mfd', 'TOLKA'), ev.key('mfd', 'ent'));
  assert.deepEqual(s.gps.fpl.legs, ['SQ01', 'TOLKA', 'MIRA', 'SQ02']); assert.equal(s.gps.fpl.active, 3);
  play(s, ev.knob('mfd', 'fms', 'outer', -1)); assert.equal(mfdField(s), 'r1');
  play(s, ev.key('mfd', 'clr')); assert.deepEqual(s.confirm, { action: 'delete', idx: 1 });
  play(s, ev.key('mfd', 'ent')); assert.deepEqual(s.gps.fpl.legs, ['SQ01', 'MIRA', 'SQ02']); assert.equal(s.gps.fpl.active, 2);
  play(s, ev.key('mfd', 'menu'), ev.knob('mfd', 'fms', 'inner', 1), ev.key('mfd', 'ent'));
  assert.deepEqual(s.gps.fpl, { legs: [], active: -1 });
});
check('activate leg needs a waypoint row', () => {
  const s = createState('enroute'); s.gps.fpl = { legs: ['SQ01', 'MIRA'], active: 1 };
  play(s, ev.key('mfd', 'fpl')); assert.equal(play(s, ev.key('mfd', 'menu'), ev.key('mfd', 'ent')), 'pickLeg');
});
check('D→ to a flight plan waypoint rejoins the plan', () => {
  const s = createState('enroute'); s.gps.fpl = { legs: ['SQ01', 'MIRA', 'SQ02'], active: 1 };
  play(s, ev.key('mfd', 'fpl'), ev.push('mfd', 'fms'), ev.knob('mfd', 'fms', 'outer', 2), ev.key('mfd', 'dto'));
  assert.equal(s.dtoWin?.id, 'SQ02');
  play(s, ev.key('mfd', 'ent'), ev.key('mfd', 'ent')); assert.equal(s.gps.fpl.active, 2); assert.equal(s.gps.dto?.id, 'SQ02');
});
check('OBS: needs GPS + target; sets course to DTK; CRS knob turns it', () => {
  const s = createState('enroute');
  assert.equal(play(s, softBy(s, 'pfd', 'OBS')), 'obsNeedsGps');
  s.gps.fpl = { legs: ['SQ01', 'MIRA', 'SQ02'], active: 1 };
  play(s, softBy(s, 'pfd', 'OBS')); assert.equal(s.pfd.obs, true);
  near(s.sel.obsCrs, Math.round(N.brgDeg(byId('SQ01'), byId('MIRA'))), 0);
  play(s, ev.knob('pfd', 'crsbaro', 'inner', 10)); near(guidance(s).dtk, s.sel.obsCrs, 1e-9);
});
check('TMR/REF minimums with the FMS knob', () => {
  const s = createState('enroute'); play(s, softBy(s, 'pfd', 'TMR/REF'), ev.knob('pfd', 'fms', 'inner', 5), ev.knob('pfd', 'fms', 'outer', 2));
  assert.equal(s.sel.mins, 750); play(s, ev.key('pfd', 'clr')); assert.equal(s.pfd.win, null);
});
check('EIS and MAP softkeys', () => {
  const s = createState('enroute');
  play(s, softBy(s, 'mfd', 'ENGINE'), softBy(s, 'mfd', 'LEAN')); assert.equal(s.mfd.eis, 'LEAN');
  play(s, softBy(s, 'mfd', 'BACK'), softBy(s, 'mfd', 'MAP'), softBy(s, 'mfd', 'TOPO')); assert.equal(s.mfd.topo, false);
});
check('audio panel: mic select also monitors; cannot unmonitor the mic radio', () => {
  const s = createState('enroute');
  play(s, { type: 'audio', id: 'com2mic' }); assert.equal(s.audio.mic, 1); assert.equal(s.audio.com2, true);
  play(s, { type: 'audio', id: 'com2' }); assert.equal(s.audio.com2, true);
  play(s, { type: 'audio', id: 'com1' }); assert.equal(s.audio.com1, false);
  play(s, { type: 'audio', id: 'nav1' }); assert.equal(s.audio.nav1, true);
  assert.equal(play(s, { type: 'audio', id: 'backup' }), 'na');
});
check('power: controls ignored while off/booting; MFD database page needs ENT', () => {
  const s = createState('cold');
  play(s, ev.knob('pfd', 'hdg', 'inner', 10)); assert.equal(s.sel.hdg, 90);
  assert.equal(play(s, { type: 'switch', id: 'engine', on: true }), 'noPower');
  play(s, { type: 'switch', id: 'master', on: true }, { type: 'switch', id: 'avionics', on: true });
  play(s, ev.knob('pfd', 'hdg', 'inner', 10)); assert.equal(s.sel.hdg, 90, 'booting');
  s.t += 5;
  play(s, ev.knob('pfd', 'hdg', 'inner', 10)); assert.equal(s.sel.hdg, 100);
  play(s, ev.knob('mfd', 'fms', 'outer', 1)); assert.equal(s.mfd.group, 'MAP', 'db page swallows input');
  play(s, ev.key('mfd', 'ent')); assert.equal(s.power.dbOk, true); assert.equal(gduPhase(s, 'mfd'), 'ready');
});
check('MFD pan: RANGE push toggles, joystick moves by a quarter range', () => {
  const s = createState('enroute');
  play(s, ev.push('mfd', 'range'), { type: 'pan', gdu: 'mfd', dx: 0, dy: 1 });
  near(s.mfd.pan.lat, s.ac.lat + 5 / 60, 1e-9);
  play(s, ev.push('mfd', 'range')); assert.equal(s.mfd.pan, null);
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
