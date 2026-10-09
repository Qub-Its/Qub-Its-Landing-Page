// Plays every Fly/Automation exercise end to end against the real simulation, the way a user would
// (stick, lever, FCU), and asserts the exercise runner marks it done in a reasonable time.
// Run from landing-page-svelte/: node scripts/check-pfd-exercises.mjs
import { createInitialState } from '../src/labs/pfd/lib/schema.js';
import { step, applyStick, applyLever, applyThrust } from '../src/labs/pfd/lib/sim.js';
import { applyScenario } from '../src/labs/pfd/lib/scenarios.js';
import { fcuOps } from '../src/labs/pfd/lib/autoflight.js';
import { EXERCISES, createRunner, newCtx } from '../src/labs/pfd/content/exercises.js';

const DT = 1 / 30;
const fcu = (s, op, ...a) => fcuOps[op](s, ...a);

// Each driver gets (state, t) every step and acts like a pilot; returns nothing.
const drivers = {
  'fly-bank25': (s) => applyStick(s, 0, s.bank < 24 ? 0.4 : 0),
  'fly-climb': (s) => applyStick(s, s.vs < 1000 ? 0.15 : s.vs > 1300 ? -0.1 : 0, 0),
  'fly-trend': (s) => { applyThrust(s, 'IDLE'); applyLever(s, 0); },
  'fly-turn90': (s, t, ctx) => {
    const target = (ctx.start ? ctx.start.hdg : s.hdg) + 90;
    const err = ((target - s.hdg + 540) % 360) - 180;
    const want = Math.max(-25, Math.min(25, err * 1.5));
    applyStick(s, 0, Math.max(-0.4, Math.min(0.4, (want - s.bank) * 0.05)));
  },
  'auto-spd220': (s, t) => { if (t === 0) { fcu(s, 'spdPull'); for (let i = 0; i < 60; i++) if (s.fcu.spd > 220) fcu(s, 'spdTurn', -1); } },
  'auto-hdg270': (s, t) => { if (t === 0) { while (s.fcu.hdg !== 270) fcu(s, 'hdgTurn', s.fcu.hdg < 270 ? 1 : -1); fcu(s, 'hdgPull'); } },
  'auto-vs': (s, t) => { if (t === 0) { fcu(s, 'altTurn', -5, true); for (let i = 0; i < 10; i++) fcu(s, 'vsTurn', -1); fcu(s, 'vsPull'); } },
  'auto-opclb': (s, t) => { if (t === 0) { fcu(s, 'altTurn', 2, true); fcu(s, 'altPull'); } },
  'auto-appr': (s, t) => { if (t === 0) fcu(s, 'appr'); }
};

let failed = 0;
for (const ex of EXERCISES.filter((e) => e.check && !e.explain)) {
  const drive = drivers[ex.id];
  if (!drive) { console.log(`  FAIL ${ex.id}: no driver in check-pfd-exercises.mjs`); failed++; continue; }
  const s = { ...createInitialState(), lever: 0.8 };
  applyScenario(s, ex.scenario);
  const runner = createRunner();
  const ctx = newCtx();
  let done = false, t = 0;
  for (let i = 0; i < 30 * 600 && !done; i++) {
    drive(s, i === 0 ? 0 : t, ctx);
    step(s, DT);
    t += DT;
    done = runner.tick(ex, s, DT, ctx).done;
  }
  if (done) console.log(`  ok   ${ex.id} in ${t.toFixed(0)} s`);
  else { failed++; console.log(`  FAIL ${ex.id}: not done after 600 s (ias ${s.ias.toFixed(0)} alt ${s.alt.toFixed(0)} vs ${s.vs.toFixed(0)} hdg ${s.hdg.toFixed(0)} bank ${s.bank.toFixed(1)} fma ${s.fma.vertical}/${s.fma.lateral})`); }
}
console.log(failed ? `\n${failed} failed` : '\nall exercises completable');
process.exit(failed ? 1 : 0);
