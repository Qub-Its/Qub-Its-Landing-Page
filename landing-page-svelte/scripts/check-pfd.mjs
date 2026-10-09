// Logic checks for the PFD trainer simulation (plain node:assert). Run from landing-page-svelte/:
//   node scripts/check-pfd.mjs
import assert from 'node:assert/strict';
import { createInitialState } from '../src/labs/pfd/lib/schema.js';
import { step, applyStick, applyThrust, applyFlaps, toggleGear, SPEED_TABLE, FLAPS, iasToMach, machToIas } from '../src/labs/pfd/lib/sim.js';
import { fcuOps, mem } from '../src/labs/pfd/lib/autoflight.js';
import { SCENARIO_LIST, applyScenario } from '../src/labs/pfd/lib/scenarios.js';

const DT = 1 / 30;
let passed = 0;
const failures = [];
function check(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ok   ${name}`);
  } catch (e) {
    failures.push(name);
    console.log(`  FAIL ${name}\n       ${String(e.message).split('\n').join('\n       ')}`);
  }
}
const fresh = (id) => applyScenario(createInitialState(), id);
function run(s, seconds, each) {
  const n = Math.round(seconds / DT);
  for (let i = 0; i < n; i++) {
    step(s, DT);
    if (each) each(s, i * DT);
  }
}
const fcu = Object.fromEntries(Object.entries(fcuOps).map(([k, fn]) => [k, (s, ...a) => fn(s, ...a)]));
function finiteAll(o, path = '') {
  for (const [k, v] of Object.entries(o)) {
    if (typeof v === 'number') assert.ok(Number.isFinite(v), `NaN/Infinity at ${path}${k}`);
    else if (v && typeof v === 'object') finiteAll(v, `${path}${k}.`);
  }
}

console.log('PFD simulation checks');

check('atmosphere: IAS/Mach conversions round-trip and look right', () => {
  assert.ok(Math.abs(iasToMach(250, 0) - 0.378) < 0.005);
  assert.ok(Math.abs(machToIas(iasToMach(280, 30000), 30000) - 280) < 0.1);
  const m = iasToMach(270, 35000);
  assert.ok(m > 0.75 && m < 0.85, `M ${m}`);
});

check('speeds table: vaMax < vaProt < vls < vmax for every flaps config', () => {
  for (const fl of FLAPS) {
    const t = SPEED_TABLE[fl];
    assert.ok(t.vaMax < t.vaProt && t.vaProt < t.vls && t.vls < t.vmax, `table ${fl}`);
    const s = fresh('cruise');
    s.flaps = fl;
    step(s, DT);
    const sp = s.speeds;
    assert.ok(sp.vaMax < sp.vaProt && sp.vaProt < sp.vls && sp.vls < sp.vmax, `live ${fl}: ${JSON.stringify(sp)}`);
  }
});

check('every scenario loads with finite numbers, valid FMA and stays finite for 120 s with random inputs', () => {
  for (const { id } of SCENARIO_LIST) {
    const s = fresh(id);
    finiteAll(s);
    assert.equal(s.scenario, id);
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 2 - 1;
    run(s, 120, (st, t) => {
      if (Math.floor(t * 30) % 90 === 0) applyStick(st, rnd(), rnd());
      if (Math.floor(t * 30) % 300 === 0) applyThrust(st, ['IDLE', 'CL', 'FLX', 'TOGA'][Math.abs(Math.floor(rnd() * 4)) % 4]);
    });
    finiteAll(s);
    assert.ok(s.pitch <= 30.01 && s.pitch >= -15.01, `${id} pitch ${s.pitch}`);
    assert.ok(Math.abs(s.bank) <= 67.01, `${id} bank`);
  }
});

check('cruise: level flight is stable for 60 s (alt, IAS, heading, bank)', () => {
  const s = fresh('cruise');
  run(s, 60);
  assert.ok(Math.abs(s.alt - 10000) < 15, `alt ${s.alt}`);
  assert.ok(Math.abs(s.ias - 250) < 2, `ias ${s.ias}`);
  assert.ok(Math.abs(s.hdg - 90) < 0.5, `hdg ${s.hdg}`);
  assert.ok(Math.abs(s.bank) < 0.5 && Math.abs(s.vs) < 60);
  assert.equal(s.fma.vertical, 'ALT');
  assert.equal(s.fma.lateral, 'HDG');
  assert.equal(s.fma.athr, 'SPEED');
  assert.equal(s.fma.engagement.ap, 'AP1');
  assert.ok(Math.abs(s.mach - 0.452) < 0.01, `mach ${s.mach}`);
  assert.equal(s.radioAlt, null);
  assert.ok(s.pitch > 0.5 && s.pitch < 6, `pitch ${s.pitch}`);
});

check('ALT 12000 + pull: OP CLB → ALT* → ALT near 12000 within 4 min, THR CLB while climbing', () => {
  const s = fresh('cruise');
  run(s, 5);
  fcu.altTurn(s, 1, true);
  fcu.altTurn(s, 1, true);
  assert.equal(s.fcu.alt, 12000);
  fcu.altPull(s);
  const seq = [];
  let sawThrClb = false;
  let maxVs = 0;
  let reachedAt = null;
  const t0 = s.simTime;
  run(s, 240, (st) => {
    const v = st.fma.vertical;
    if (seq[seq.length - 1] !== v) seq.push(v);
    if (v === 'OP CLB' && st.fma.athr === 'THR CLB') sawThrClb = true;
    maxVs = Math.max(maxVs, st.vs);
    if (reachedAt === null && v === 'ALT' && Math.abs(st.alt - 12000) < 50) reachedAt = st.simTime - t0;
  });
  assert.deepEqual(seq, ['OP CLB', 'ALT*', 'ALT'], `FMA sequence ${seq}`);
  assert.ok(sawThrClb, 'A/THR showed THR CLB');
  assert.ok(Math.abs(s.alt - 12000) < 50, `alt ${s.alt}`);
  assert.ok(reachedAt !== null && reachedAt < 240, `reached ${reachedAt}`);
  assert.ok(maxVs > 1500 && maxVs < 4000, `max climb rate ${maxVs}`);
  assert.ok(Math.abs(s.ias - 250) < 4, `ias held ${s.ias}`);
  assert.equal(s.fma.athr, 'SPEED');
  assert.ok(s.fma.changedAt.vertical > 5, 'changedAt.vertical updated');
});

check('ALT lower + pull gives OP DES with THR IDLE, then captures', () => {
  const s = fresh('cruise');
  fcu.altTurn(s, -1, true);
  fcu.altTurn(s, -1, true);
  fcu.altPull(s);
  run(s, 3);
  assert.equal(s.fma.vertical, 'OP DES');
  assert.equal(s.fma.athr, 'THR IDLE');
  assert.equal(s.fma.verticalArmed === 'ALT' || s.vs > -100, true);
  run(s, 200);
  assert.equal(s.fma.vertical, 'ALT');
  assert.ok(Math.abs(s.alt - 8000) < 50, `alt ${s.alt}`);
});

check('V/S mode: pull at +1500 climbs ~1500 fpm; FMA text', () => {
  const s = fresh('cruise');
  fcu.altTurn(s, 1, true);
  fcu.altTurn(s, 1, true);
  fcu.vsTurn(s, 15);
  fcu.vsPull(s);
  run(s, 30);
  assert.equal(s.fma.vertical, 'V/S +1500');
  assert.ok(Math.abs(s.vs - 1500) < 100, `vs ${s.vs}`);
  assert.equal(s.fma.verticalArmed, 'ALT');
  fcu.vsPush(s);
  run(s, 20);
  assert.equal(s.fma.vertical, 'V/S 0');
  assert.ok(Math.abs(s.vs) < 80);
});

check('HDG select 270 with AP turns to 270 ±2, bank ≤ 25, FMA HDG', () => {
  const s = fresh('cruise');
  fcu.hdgPull(s);
  s.fcu.hdg = 270;
  let maxBank = 0;
  run(s, 150, (st) => (maxBank = Math.max(maxBank, Math.abs(st.bank))));
  assert.ok(Math.abs(((s.hdg - 270 + 540) % 360) - 180) < 2, `hdg ${s.hdg}`);
  assert.ok(maxBank <= 25.5 && maxBank > 10, `max bank ${maxBank}`);
  assert.ok(Math.abs(s.bank) < 1);
  assert.equal(s.fma.lateral, 'HDG');
});

check('HDG knob turns, NAV push/pull, managed turn selects', () => {
  const s = fresh('cruise');
  fcu.hdgTurn(s, 5);
  assert.equal(s.fcu.hdg, 95);
  fcu.hdgTurn(s, -100);
  assert.equal(s.fcu.hdg, 355);
  fcu.hdgPush(s);
  run(s, 2);
  assert.equal(s.fma.lateral, 'NAV');
  fcu.hdgTurn(s, 1);
  assert.equal(s.fcu.hdgManaged, false);
  run(s, 1);
  assert.equal(s.fma.lateral, 'HDG');
});

check('normal law: bank > 33° with neutral stick returns to 33°; stick roll rate and holds', () => {
  const s = fresh('manual');
  s.bank = 50;
  run(s, 15);
  assert.ok(Math.abs(s.bank - 33) < 0.6, `bank ${s.bank}`);
  s.bank = -55;
  run(s, 15);
  assert.ok(Math.abs(s.bank + 33) < 0.6, `bank ${s.bank}`);
  const t = fresh('manual');
  applyStick(t, 0, 1);
  run(t, 1);
  assert.ok(t.bank > 8 && t.bank < 16, `bank after 1 s full roll ${t.bank}`);
  applyStick(t, 0, 0);
  run(t, 2);
  const b = t.bank;
  run(t, 5);
  assert.ok(Math.abs(t.bank - b) < 0.3, 'neutral stick holds bank');
  applyStick(t, 0, 1);
  run(t, 10);
  assert.ok(t.bank <= 67.001 && t.bank > 66, `bank limited ${t.bank}`);
});

check('manual flight: neutral stick holds flight path; pitch stick changes it; pitch limits hold', () => {
  const s = fresh('manual');
  run(s, 20);
  assert.ok(Math.abs(s.alt - 10000) < 40 && s.ias > 240 && s.ias < 260, `alt ${s.alt} ias ${s.ias}`);
  applyStick(s, 0.4, 0);
  run(s, 2);
  applyStick(s, 0, 0);
  run(s, 2);
  const vs = s.vs;
  assert.ok(vs > 300, `vs ${vs}`);
  run(s, 5);
  assert.ok(Math.abs(s.vs - vs) < 150, 'FPA held with neutral stick');
  const u = fresh('manual');
  applyStick(u, 1, 0);
  run(u, 30);
  assert.ok(u.pitch <= 30.01, `pitch ${u.pitch}`);
  const d = fresh('manual');
  applyStick(d, -1, 0);
  run(d, 30);
  assert.ok(d.pitch >= -15.01, `pitch ${d.pitch}`);
});

check('stick beyond 0.5 disconnects the AP; below 0.5 does not', () => {
  const s = fresh('cruise');
  applyStick(s, 0.4, 0.2);
  assert.equal(s.fcu.ap1, true);
  run(s, 2);
  assert.equal(s.fcu.ap1, true);
  applyStick(s, 0, 0.6);
  assert.equal(s.fcu.ap1, false);
  run(s, 1);
  assert.equal(s.fma.engagement.ap, '');
  assert.ok(s.fma.changedAt.engagement > 0, 'engagement changedAt');
});

check('A/THR: SPEED holds a new target; MACH mode; lever IDLE caps thrust; A/THR off → manual', () => {
  const s = fresh('cruise');
  fcu.spdTurn(s, -30);
  assert.equal(s.fcu.spd, 220);
  run(s, 90);
  assert.ok(Math.abs(s.ias - 220) < 2, `ias ${s.ias}`);
  assert.equal(s.fma.athr, 'SPEED');
  fcu.spdMachToggle(s);
  assert.equal(s.fcu.spdIsMach, true);
  s.fcu.mach = 0.6;
  run(s, 120);
  assert.equal(s.fma.athr, 'MACH');
  assert.ok(Math.abs(s.mach - 0.6) < 0.01, `mach ${s.mach}`);
  applyThrust(s, 'FLX');
  run(s, 1);
  assert.equal(s.fma.athr, 'MAN FLX');
  assert.equal(s.fma.engagement.athrArmed, true);
  applyThrust(s, 'TOGA');
  run(s, 1);
  assert.equal(s.fma.athr, 'MAN TOGA');
  applyThrust(s, 'CL');
  run(s, 1);
  assert.notEqual(s.fma.athr, 'MAN TOGA');
  fcu.athr(s);
  run(s, 1);
  assert.equal(s.fma.athr, '');
  assert.equal(s.fma.engagement.athr, '');
});

check('iasTrend predicts acceleration/deceleration; mach tracks IAS and altitude', () => {
  const s = fresh('cruise');
  fcu.spdTurn(s, 40);
  run(s, 10);
  assert.ok(s.iasTrend > 4, `trend ${s.iasTrend}`);
  const t = fresh('cruise');
  fcu.spdTurn(t, -40);
  run(t, 10);
  assert.ok(t.iasTrend < -4, `trend ${t.iasTrend}`);
  const hi = fresh('cruise');
  hi.alt = 35000;
  hi.ias = 270;
  step(hi, DT);
  assert.ok(hi.mach > 0.75 && hi.mach < 0.85, `mach ${hi.mach}`);
});

check('radio altitude: null above 2500 ft, equals alt − groundElev below', () => {
  const s = fresh('cruise');
  assert.equal(s.radioAlt, null);
  s.alt = 2400;
  step(s, DT);
  assert.ok(s.radioAlt !== null && Math.abs(s.radioAlt - 2400) < 5);
  s.groundElev = 400;
  s.alt = 2800;
  step(s, DT);
  assert.ok(Math.abs(s.radioAlt - 2400) < 5);
});

check('FMA changedAt updates when a row-1 mode changes', () => {
  const s = fresh('cruise');
  run(s, 3);
  const before = { ...s.fma.changedAt };
  fcu.hdgPush(s);
  run(s, 1);
  assert.ok(s.fma.changedAt.lateral > before.lateral && s.fma.changedAt.lateral > 2, 'lateral');
  fcu.ap2(s);
  run(s, 1);
  assert.equal(s.fma.engagement.ap, 'AP1+2');
  assert.ok(s.fma.changedAt.engagement > 3, 'engagement');
});

check('approach: APPR armed reaches LOC* → LOC and G/S* → G/S, devs → 0, descends on the 3° path', () => {
  const s = fresh('approach');
  assert.equal(s.ils.visible, true);
  assert.equal(s.ils.ident, 'IMRC');
  assert.ok(s.ils.gs > 1.9, `beam above at start ${s.ils.gs}`);
  fcu.appr(s);
  run(s, 2);
  assert.equal(s.fma.lateralArmed, 'LOC');
  assert.equal(s.fma.verticalArmed, 'G/S');
  assert.equal(s.fma.approach, 'CAT 1');
  const seqL = [];
  const seqV = [];
  let maxBank = 0;
  run(s, 300, (st) => {
    if (seqL[seqL.length - 1] !== st.fma.lateral) seqL.push(st.fma.lateral);
    if (seqV[seqV.length - 1] !== st.fma.vertical) seqV.push(st.fma.vertical);
    maxBank = Math.max(maxBank, Math.abs(st.bank));
  });
  assert.deepEqual(seqL, ['HDG', 'LOC*', 'LOC'], `lateral ${seqL}`);
  assert.deepEqual(seqV, ['ALT', 'G/S*', 'G/S'], `vertical ${seqV}`);
  assert.ok(Math.abs(s.ils.loc) < 0.3, `loc ${s.ils.loc}`);
  assert.ok(Math.abs(s.ils.gs) < 0.4, `gs ${s.ils.gs}`);
  assert.ok(s.alt < 2500 && s.vs < -400 && s.vs > -1100, `alt ${s.alt} vs ${s.vs}`);
  assert.ok(Math.abs(s.hdg - 70) < 4, `hdg ${s.hdg}`);
  assert.ok(Math.abs(s.ias - 160) < 4, `ias ${s.ias}`);
  assert.ok(maxBank < 26);
  assert.equal(s.fma.verticalArmed, '');
  assert.equal(s.fma.lateralArmed, '');
  assert.ok(s.fd.show);
});

check('approach: LOC only does not capture the G/S; turning APPR off leaves G/S for V/S', () => {
  const s = fresh('approach');
  fcu.loc(s);
  run(s, 200);
  assert.equal(s.fma.lateral, 'LOC');
  assert.equal(s.fma.vertical, 'ALT');
  assert.ok(Math.abs(s.alt - 3000) < 50);
  const t = fresh('approach');
  fcu.appr(t);
  run(t, 200);
  assert.equal(t.fma.vertical, 'G/S');
  fcu.appr(t);
  run(t, 2);
  assert.ok(/^V\/S/.test(t.fma.vertical), t.fma.vertical);
});

check('takeoff: TOGA starts the roll, SRS/RWY, V1 shown, rotates and lifts off, then NAV and CLB', () => {
  const s = fresh('takeoff');
  assert.equal(s.speeds.v1, 140);
  assert.equal(s.fma.engagement.athrArmed, true);
  run(s, 3);
  assert.ok(s.ias === 0 && s.fma.vertical === '', 'stands still with IDLE');
  applyThrust(s, 'TOGA');
  run(s, 1);
  assert.equal(s.fma.vertical, 'SRS');
  assert.equal(s.fma.lateral, 'RWY');
  assert.equal(s.fma.athr, 'MAN TOGA');
  assert.ok(s.fd.show && s.fd.pitch > 5, `fd ${JSON.stringify(s.fd)}`);
  let t145 = null;
  run(s, 45, (st, t) => {
    if (t145 === null && st.ias >= 145) t145 = t;
  });
  assert.ok(t145 !== null && t145 > 15 && t145 < 40, `reached 145 kt at ${t145}`);
  assert.ok(s.ias > 140 && s.alt === 0, 'still on the runway without rotation');
  assert.ok(s.iasTrend > 0);
  applyStick(s, 0.5, 0);
  run(s, 8);
  applyStick(s, 0, 0);
  assert.ok(s.alt > 20, `airborne alt ${s.alt}`);
  assert.ok(s.radioAlt !== null && s.radioAlt > 20);
  run(s, 20);
  assert.equal(s.fma.lateral, 'NAV');
  assert.ok(s.pitch > 5 && s.pitch < 25, `pitch ${s.pitch}`);
  assert.ok(s.vs > 800, `vs ${s.vs}`);
  fcu.ap1(s);
  assert.equal(s.fcu.ap1, true);
  applyThrust(s, 'CL');
  toggleGear(s);
  assert.equal(s.gearDown, false);
  run(s, 120);
  assert.ok(s.alt > 1500, `alt ${s.alt}`);
  assert.ok(['CLB', 'OP CLB', 'ALT*', 'ALT'].includes(s.fma.vertical), s.fma.vertical);
  assert.equal(s.fma.lateral, 'NAV');
  finiteAll(s);
});

check('flaps/gear controls respect speed limits and config names', () => {
  const s = fresh('cruise');
  assert.equal(applyFlaps(s, '3'), false, 'too fast for flaps 3');
  assert.equal(s.flaps, '0');
  s.ias = 190;
  assert.equal(applyFlaps(s, '1'), true);
  assert.equal(s.flaps, '1');
  assert.ok(s.speeds.s === 183);
  const g = fresh('cruise');
  toggleGear(g);
  assert.equal(g.gearDown, true);
  assert.ok(g.speeds.vmax <= 280);
});

check('pause freezes the simulation; touchdown sets the aircraft on the ground and drops the AP', () => {
  const s = fresh('cruise');
  s.paused = true;
  run(s, 5);
  assert.equal(s.simTime, 0);
  s.paused = false;
  const l = fresh('approach');
  l.alt = 40;
  l.fpa = -3;
  l.fcu.ap1 = false;
  l.fcu.fd = false;
  l.fcu.appr = false;
  run(l, 10);
  assert.ok(l.alt === 0 && l.vs === 0 && l.radioAlt === 0, `alt ${l.alt}`);
  assert.equal(mem(l).ground, true);
  assert.ok(l.pitch >= 0);
  assert.equal(l.thrust, 'IDLE', 'thrust retarded to idle on touchdown');
  const v0 = l.ias;
  run(l, 20);
  assert.ok(l.ias < v0 && l.alt === 0, 'decelerates on the runway and stays on the ground');
  finiteAll(l);
});

console.log(`\n${passed} passed, ${failures.length} failed`);
if (failures.length) {
  console.log('Failed: ' + failures.join('; '));
  process.exit(1);
}
