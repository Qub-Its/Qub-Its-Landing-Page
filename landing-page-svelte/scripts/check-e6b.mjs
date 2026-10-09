// Logic checks for the E6B trainer maths (scales, atmosphere, wind side, answers, generator).
// Run from landing-page-svelte/:  node scripts/check-e6b.mjs
// (The store e6b.svelte.js uses runes and is not importable from plain Node, so it is not checked here.)
import * as S from '../src/labs/e6b/lib/scales.js';
import { solveWind, findWind, WIND, dotScreen, readDot, dotFor } from '../src/labs/e6b/lib/wind.js';
import { parseNumber, parseAnswer, isClose } from '../src/labs/e6b/lib/answers.js';
import { generate, KINDS, rng } from '../src/labs/e6b/lib/practice.js';

let passed = 0;
const failures = [];
const ok = (name) => {
  passed++;
  console.log(`  ok   ${name}`);
};
const fail = (name, msg) => {
  failures.push(name);
  console.log(`  FAIL ${name}\n       ${msg}`);
};
function check(name, fn) {
  try {
    fn();
    ok(name);
  } catch (e) {
    fail(name, String(e.message));
  }
}
const near = (a, b, tol, what = '') => {
  if (!(Math.abs(a - b) <= tol)) throw new Error(`${what} ${a} vs ${b} (tol ${tol})`);
};
const truthy = (c, msg) => {
  if (!c) throw new Error(msg);
};

console.log('E6B checks');

check('theta / mantissa / rotFor / outerAt / innerAt round trips', () => {
  near(S.theta(10), 0, 1e-9);
  near(S.theta(100), 0, 1e-9);
  near(S.theta(1000), 0, 1e-9);
  near(S.theta(31.6227766), 180, 1e-4);
  near(S.mantissa(0.5), 50, 1e-9);
  near(S.mantissa(1200), 12, 1e-9);
  near(S.mantissa(100), 10, 1e-9);
  for (let i = 0; i < 200; i++) {
    const a = 10 + 89.9 * Math.random();
    const b = 10 + 89.9 * Math.random();
    const rot = S.rotFor(a, b);
    near(S.outerAt(rot, b), a, 1e-9 * a, 'outerAt(rotFor)');
    near(S.innerAt(rot, a), b, 1e-9 * b, 'innerAt(rotFor)');
  }
  near(S.angleDiff(359, 1), -2, 1e-9);
  near(S.norm360(-10), 350, 1e-9);
});

check('120 kt x 25 min = 50 NM', () => {
  near(S.outerAt(S.rotFor(12, 60), 25), 50, 1e-6);
});

check('36 index: 90 kt, 2.5 NM -> 100 s', () => {
  // 36 under the speed (90 kt = 1.5 NM/min); the distance 2.5 (outer 25) reads 100 s (inner mantissa 10).
  const rot = S.rotFor(90, S.SECONDS_INDEX);
  near(S.innerAt(rot, 25) * 10, 100, 0.1, 'seconds');
});

check('conversion arrows', () => {
  const m = (id) => S.MARKERS.find((x) => x.id === id).v;
  const conv = (a, b, v) => S.innerAt(S.rotFor(m(a), v), m(b));
  near(conv('naut', 'stat', 85), 97.9, 0.15, 'NM->SM');
  near(conv('naut', 'km', 120) * 10, 222, 1.5, 'NM->km');
  near(conv('gal', 'lbs', 40) * 10 / 10, 24.0, 0.05, 'gal->lb (mantissa)');
  near(conv('meters', 'feet', 15) * 100, 4921, 40, 'm->ft');
  console.log(`       85 NM = ${conv('naut', 'stat', 85).toFixed(1)} SM, 120 NM = ${(conv('naut', 'km', 120) * 10).toFixed(0)} km, 40 gal = ${(conv('gal', 'lbs', 40) * 10).toFixed(0)} lb, 1500 m = ${(conv('meters', 'feet', 15) * 100).toFixed(0)} ft`);
});

check('ISA atmosphere', () => {
  near(S.deltaP(0), 1, 1e-12);
  near(S.tStdC(0), 15, 1e-12);
  near(S.sigma(0, 15), 1, 1e-12);
  near(S.sigmaStd(0), 1, 1e-12);
  near(S.deltaP(10000), 0.6877, 0.001);
  for (const pa of [0, 2500, 5000, 8000, 12000, 18000]) near(S.densityAltitude(pa, S.tStdC(pa)), pa, 0.01, `DA at ISA ${pa}`);
});

check('TAS of CAS 110 at PA 8000 / +10 C ~ 125 kt', () => {
  const tas = S.trueAirspeed(110, 8000, 10);
  console.log(`       TAS = ${tas.toFixed(1)} kt`);
  near(tas, 125, 3);
  near(S.tasFactor(8000, 10) * 110, tas, 1e-9);
});

check('TAS window alignment and rotation', () => {
  for (const [pa, c] of [[0, 15], [8000, 10], [12000, -15], [3000, 35], [5000, -40], [20000, 0]]) {
    const rot = S.tasRot(pa, c);
    const d = S.angleDiff(S.paAngle(pa) + rot, S.oatAngle(c));
    near(d, 0, 1e-9, `align ${pa}/${c}`);
    near(S.outerAt(rot, 110), S.mantissa(S.trueAirspeed(110, pa, c)), 1e-6, `outerAt ${pa}/${c}`);
  }
  near(S.tasRot(0, 15), 0, 1e-9);
});

check('density altitude window', () => {
  const da = S.densityAltitude(5000, 25);
  console.log(`       DA(PA 5000, +25 C) = ${da.toFixed(0)} ft`);
  truthy(da > 7200 && da < 7400, `DA ${da}`); // ISA+20: PA + ~120 ft/°C ~ 7400 (rule of thumb)
  for (const [pa, c] of [[5000, 25], [0, 35], [10000, -15], [2000, 15], [8000, 30]]) {
    near(S.daAt(S.tasRot(pa, c)), S.densityAltitude(pa, c), 0.01, `daAt ${pa}/${c}`);
  }
  // the DA mark of DA h sits under the index when rot matches
  const rot = S.tasRot(5000, 25);
  near(S.angleDiff(S.daAngle(da) + rot, S.DA_INDEX), 0, 1e-6);
});

check('temperature and time helpers', () => {
  near(S.cToF(100), 212, 1e-9);
  near(S.fToC(S.cToF(-12.5)), -12.5, 1e-9);
  truthy(S.fmtHm(90) === '1:30' && S.fmtHm(125) === '2:05' && S.fmtHm(59.6) === '1:00', 'fmtHm');
  truthy(S.parseHm('1:30') === 90 && Number.isNaN(S.parseHm('abc')), 'parseHm');
});

check('tick helpers', () => {
  const t = S.logTicks();
  truthy(t.every((x) => x.v >= 10 && x.v < 100), 'range');
  truthy(!t.some((x) => x.v === 100), 'no 100');
  truthy(new Set(t.map((x) => x.v)).size === t.length, 'unique');
  truthy(t.find((x) => x.v === 10).label === '10' && t.find((x) => x.v === 10).size === 'major', '10 major labelled');
  truthy(t.find((x) => x.v === 12.5).size === 'mid' && t.find((x) => x.v === 12.3).size === 'minor', '10-20 sizes');
  truthy(t.find((x) => x.v === 24).label === '24' && t.find((x) => x.v === 27).label === undefined && t.find((x) => x.v === 28).label === '28', '20-50 labels');
  truthy(t.find((x) => x.v === 75).size === 'major' && t.find((x) => x.v === 76).size === 'minor', '50-100');
  const h = S.hoursLabels();
  truthy(h.length === 15 && h[0].label === '1:00' && h[14].label === '9:00', 'hoursLabels');
});

check('solveWind: textbook TC 090, TAS 120, wind 180/20', () => {
  const w = solveWind({ tc: 90, tas: 120, wdir: 180, wspd: 20 });
  near(w.wca, 9.59, 0.05, 'WCA');
  near(w.gs, 118.3, 0.1, 'GS');
  near(w.th, 99.59, 0.05, 'TH');
  truthy(solveWind({ tc: 0, tas: 50, wdir: 90, wspd: 60 }) === null, 'null when uncorrectable');
});

check('findWind inverts solveWind', () => {
  const r = rng(7);
  for (let i = 0; i < 500; i++) {
    const tas = 80 + r() * 100;
    const c = { tc: r() * 360, tas, wdir: r() * 360, wspd: 1 + r() * (tas / 3 - 1) };
    const w = solveWind(c);
    const f = findWind({ tc: c.tc, th: w.th, tas, gs: w.gs });
    near(f.wspd, c.wspd, 1e-6, 'wspd');
    near(S.angleDiff(f.wdir, c.wdir), 0, 1e-6, 'wdir');
  }
});

check('wind-face geometry matches the wind triangle', () => {
  const r = rng(11);
  for (let i = 0; i < 300; i++) {
    const tas = 80 + r() * 100;
    const c = { tc: r() * 360, tas, wdir: r() * 360, wspd: 1 + r() * (tas / 3 - 1) };
    const w = solveWind(c);
    const d = readDot(dotFor(c.wdir, c.wspd), { dir: c.tc, slide: w.gs });
    near(d.speed, tas, 0.01, 'speed');
    near(d.drift, w.wca, 0.01, 'drift');
  }
  const p = dotScreen({ b: 90, d: 10 }, 90);
  near(p.x, WIND.cx, 1e-9);
  near(p.y, WIND.cy - 10 * WIND.unit, 1e-9);
  const q = dotScreen({ b: 90, d: 10 }, 0);
  near(q.x, WIND.cx + 10 * WIND.unit, 1e-9);
  near(q.y, WIND.cy, 1e-9);
});

check('answers: parseNumber / parseAnswer / isClose', () => {
  truthy(parseNumber('1,5') === 1.5 && parseNumber('1.5') === 1.5 && parseNumber('-3') === -3 && parseNumber('+3') === 3, 'numbers');
  truthy(Number.isNaN(parseNumber('abc')) && Number.isNaN(parseNumber('')) && Number.isNaN(parseNumber('1.2.3')), 'invalid');
  truthy(parseAnswer('1:30', 'min') === 90 && parseAnswer('45', 'min') === 45 && parseAnswer('1,5', 'kt') === 1.5, 'parseAnswer');
  truthy(Number.isNaN(parseAnswer('1:xx', 'min')), 'bad h:mm');
  truthy(isClose(101, { value: 100, tol: { rel: 0.02 } }) && !isClose(103, { value: 100, tol: { rel: 0.02 } }), 'rel');
  truthy(isClose(1.2, { value: 1, tol: { abs: 0.3 } }) && !isClose(1.4, { value: 1, tol: { abs: 0.3 } }), 'abs');
  truthy(isClose(359, { value: 1, tol: { abs: 2 }, angle: true }) && !isClose(358, { value: 1, tol: { abs: 2 }, angle: true }), 'angle wrap');
  truthy(!isClose(NaN, { value: 1, tol: { abs: 1 } }), 'NaN');
});

check('generator: deterministic per seed', () => {
  for (const k of KINDS) for (const seed of [0, 1, 42, 99999]) truthy(JSON.stringify(generate(k, seed)) === JSON.stringify(generate(k, seed)), `${k} ${seed}`);
  truthy(JSON.stringify(generate('navlog', 1)) !== JSON.stringify(generate('navlog', 2)), 'seeds differ');
});

const finiteDeep = (o, path) => {
  if (typeof o === 'number') truthy(Number.isFinite(o), `non-finite at ${path}`);
  else if (o && typeof o === 'object') for (const [k, v] of Object.entries(o)) finiteDeep(v, `${path}.${k}`);
};
const PATCH_KEYS = new Set(['face', 'rot', 'cursor', 'dir', 'slide', 'dots', 'say']);

for (const kind of KINDS) {
  check(`generator: ${kind} x 500 seeds`, () => {
    for (let seed = 0; seed < 500; seed++) {
      const p = generate(kind, seed);
      const at = `${kind}#${seed}`;
      truthy(p.kind === kind && p.seed === seed, `${at} kind/seed`);
      truthy(p.prompt.es && p.prompt.en && !/NaN|undefined/.test(p.prompt.es + p.prompt.en), `${at} prompt: ${p.prompt.es}`);
      truthy(p.fields.length > 0, `${at} fields`);
      for (const f of p.fields) {
        truthy(typeof f.key === 'string' && f.label?.es && f.label?.en, `${at} label`);
        truthy(Number.isFinite(f.value), `${at} value`);
        truthy(f.tol && (f.tol.abs > 0 || f.tol.rel > 0), `${at} tol`);
        truthy(typeof f.unit === 'string', `${at} unit`);
        truthy(isClose(f.value, f), `${at} exact value accepted`);
      }
      truthy(p.setup && (p.setup.face === 'calc' || p.setup.face === 'wind'), `${at} setup`);
      truthy(Array.isArray(p.demo) && p.demo.length > 0, `${at} demo`);
      for (const s of p.demo) {
        truthy(s && typeof s === 'object' && s.say?.es && s.say?.en, `${at} step say`);
        truthy(!/NaN|undefined/.test(s.say.es + s.say.en), `${at} say text: ${s.say.es}`);
        for (const k of Object.keys(s)) truthy(PATCH_KEYS.has(k), `${at} unknown step key ${k}`);
        finiteDeep({ ...s, say: 0 }, at);
        if (s.slide !== undefined) truthy(s.slide >= WIND.slideMin && s.slide <= WIND.slideMax, `${at} slide ${s.slide}`);
      }
    }
  });
}

check('generator: wind / navlog consistent with solveWind, wind demo reads TAS and WCA', () => {
  for (const kind of ['wind', 'navlog']) {
    for (let seed = 0; seed < 500; seed++) {
      const p = generate(kind, seed);
      const m = kind === 'wind'
        ? /TC (\d+)°, TAS (\d+) kt, (?:viento|wind) (\d+)\/(\d+)/.exec(p.prompt.es)
        : /TC (\d+)°, TAS (\d+) kt, viento (\d+)\/(\d+), distancia (\d+) NM, consumo ([\d,]+) GPH/.exec(p.prompt.es);
      truthy(m, `${kind}#${seed} prompt parse: ${p.prompt.es}`);
      const c = { tc: +m[1], tas: +m[2], wdir: +m[3], wspd: +m[4] };
      const w = solveWind(c);
      truthy(w && c.wspd < c.tas / 3, `${kind}#${seed} solvable`);
      const f = Object.fromEntries(p.fields.map((x) => [x.key, x.value]));
      near(f.th, w.th, 1e-9);
      near(f.gs, w.gs, 1e-9);
      if (kind === 'wind') near(f.wca, w.wca, 1e-9);
      else {
        const dist = +m[5];
        const ff = Number(m[6].replace(',', '.'));
        near(f.ete, (dist / w.gs) * 60, 1e-9, 'ete');
        near(f.fuel, ((dist / w.gs) * ff), 1e-9, 'fuel');
      }
      // the wind-side demo lands on the dot/slide that reads TAS and WCA
      const wind = p.demo.slice(0, 4);
      const dots = wind[1].dots;
      const d = readDot(dots[0], { dir: wind[2].dir, slide: wind[3].slide });
      near(d.speed, c.tas, 0.01, 'demo speed');
      near(d.drift, w.wca, 0.01, 'demo drift');
    }
  }
});

check('generator: conversions match real factors within 1 %', () => {
  const F = { SM: 1.15078, km: 1.852, lb: 6, L: 3.78541, ft: 3.28084 };
  for (let seed = 0; seed < 500; seed++) {
    const p = generate('conv', seed);
    const f = p.fields[0];
    if (f.unit === '°F') continue;
    const v = Number(/Convierte (\d+)/.exec(p.prompt.es)[1]);
    near(f.value / v, F[f.unit], 0.01 * F[f.unit], p.prompt.es);
  }
});
check('generator: demos end on the printed answer', () => {
  for (let seed = 0; seed < 300; seed++) {
    for (const kind of ['tsd', 'fuel', 'conv', 'tas', 'da', 'navlog']) {
      const p = generate(kind, seed);
      const f = p.fields[p.fields.length - 1];
      const last = p.demo[p.demo.length - 1];
      if (last.cursor === undefined) {
        truthy(kind === 'conv' && f.unit === '°F', `${kind}#${seed} demo has no cursor`);
        continue;
      }
      const rot = [...p.demo].reverse().find((s) => s.rot !== undefined)?.rot ?? 0;
      let got;
      if (kind === 'da') got = S.daAt(rot);
      else {
        // inner-scale readings: time answers and conversions; the rest read the outer scale
        const inner = f.unit === 'min' || kind === 'conv';
        const ang = inner ? last.cursor - rot : last.cursor;
        near(S.angleDiff(ang, S.theta(f.value)), 0, 0.1, `${kind}#${seed} reading (${p.prompt.en})`);
        continue;
      }
      near(got, f.value, 1, `da#${seed}`);
    }
  }
});

console.log(`\nok: ${passed} checks passed, ${failures.length} failed`);
if (failures.length) {
  console.log('Failed: ' + failures.join('; '));
  process.exit(1);
}
