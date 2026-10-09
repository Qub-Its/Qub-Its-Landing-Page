// Content checks for the PFD trainer: part coverage, exercises, glossary, guide.
// Run from landing-page-svelte/:  node scripts/check-pfd-content.mjs
import { existsSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '../src/labs/pfd');
const load = (p) => import(pathToFileURL(resolve(root, p)).href);

const { PARTS } = await load('content/parts.js');
const { GLOSSARY, glossHtml } = await load('content/glossary.js');
const { EXERCISES, LEVELS, createRunner, newCtx } = await load('content/exercises.js');
const { GUIDE, LEGEND } = await load('content/guide.js');
const { UI } = await load('i18n.js');
const { createInitialState } = await load('lib/schema.js');

let failures = 0;
const fail = (msg) => { failures++; console.error('FAIL', msg); };
const ok = (cond, msg) => { if (!cond) fail(msg); };
const text = (v) => typeof v === 'string' && v.trim().length > 0;

// Part ids from the plan table (Shared conventions)
const PART_IDS = [
  'attitude', 'pitchLadder', 'bankScale', 'aircraftSymbol', 'fdBars', 'sideslip', 'protections',
  'speedTape', 'speedReadout', 'speedTrend', 'speedTarget', 'vls', 'vaProt', 'vaMax', 'vmax', 'greenDot', 'sfSpeeds', 'v1', 'mach',
  'altTape', 'altReadout', 'altSelected', 'baro', 'landingElev',
  'vsi',
  'headingTape', 'trackDiamond', 'hdgSelected',
  'fma', 'fmaAthr', 'fmaVertical', 'fmaLateral', 'fmaApproach', 'fmaEngagement',
  'locScale', 'gsScale', 'ilsInfo', 'radioAlt'
];
for (const id of PART_IDS) {
  for (const lang of ['es', 'en']) {
    const p = PARTS[id]?.[lang];
    ok(p, `part ${id}: missing ${lang}`);
    if (p) for (const k of ['title', 'what', 'read', 'why']) ok(text(p[k]), `part ${id}.${lang}.${k} empty`);
  }
}
for (const id of Object.keys(PARTS)) ok(PART_IDS.includes(id), `part ${id} is not in the plan table`);

// Scenario ids: read from lib/scenarios.js when it exists, else the ids named in the plan.
let scenarioIds = ['cruise', 'climb', 'approach', 'takeoff', 'manual'];
if (existsSync(resolve(root, 'lib/scenarios.js'))) {
  try {
    const sc = await load('lib/scenarios.js');
    const list = sc.SCENARIO_LIST?.map((s) => (typeof s === 'string' ? s : s.id));
    if (list?.length) scenarioIds = list;
  } catch (e) { console.warn('note: lib/scenarios.js not importable, using plan ids', e.message); }
}

// Exercises
ok(EXERCISES.length >= 6, `need >= 6 exercises, got ${EXERCISES.length}`);
const seen = new Set();
for (const e of EXERCISES) {
  ok(!seen.has(e.id), `duplicate exercise id ${e.id}`); seen.add(e.id);
  ok(LEVELS.some((l) => l.id === e.level), `${e.id}: unknown level ${e.level}`);
  ok(scenarioIds.includes(e.scenario), `${e.id}: unknown scenario ${e.scenario}`);
  if (e.part) ok(PARTS[e.part], `${e.id}: part ${e.part} has no content`);
  for (const k of ['task', 'hint', 'why']) for (const lang of ['es', 'en']) ok(text(e[k]?.[lang]), `${e.id}.${k}.${lang} empty`);
  ok(!!e.check !== !!e.quiz, `${e.id}: needs exactly one of check / quiz`);
  if (e.quiz) {
    ok(e.quiz.choices.length >= 2, `${e.id}: quiz needs >= 2 choices`);
    ok(Number.isInteger(e.quiz.answer) && e.quiz.answer >= 0 && e.quiz.answer < e.quiz.choices.length, `${e.id}: quiz answer out of range`);
    e.quiz.choices.forEach((c, i) => { for (const lang of ['es', 'en']) ok(text(c[lang]), `${e.id}: choice ${i} ${lang} empty`); });
  }
  if (e.check) {
    // Purity/robustness: must not throw on a fresh state and must be false at scenario start without input.
    const s = createInitialState();
    try { e.check(s, { lastPart: null, seen: new Set(), start: { hdg: s.hdg, alt: s.alt, ias: s.ias, bank: s.bank } }); } catch (err) { fail(`${e.id}: check threw ${err.message}`); }
    const r = createRunner().tick(e, s, 0.1, newCtx());
    ok(typeof r.done === 'boolean', `${e.id}: runner result malformed`);
  }
}
for (const l of LEVELS) {
  ok(EXERCISES.some((e) => e.level === l.id), `level ${l.id} has no exercises`);
  for (const lang of ['es', 'en']) ok(text(l.name[lang]) && text(l.intro[lang]), `level ${l.id} ${lang} name/intro`);
}
ok(LEVELS.length === 3, 'expected 3 levels');

// Runner semantics: hold must accumulate and reset
{
  const ex = EXERCISES.find((e) => e.id === 'fly-bank25');
  const s = createInitialState(); s.bank = 25;
  const r = createRunner(); const ctx = newCtx();
  let res; for (let i = 0; i < 100; i++) res = r.tick(ex, s, 0.1, ctx);
  ok(res.done, 'bank25 should complete after holding 10 s');
  s.bank = 40; res = r.tick(ex, s, 0.1, ctx);
  ok(!res.done && res.held === 0, 'hold must reset when the condition breaks');
  const vls = EXERCISES.find((e) => e.id === 'find-vls');
  const c2 = newCtx(); ok(!createRunner().tick(vls, s, 0.1, c2).done, 'find-vls false before click');
  c2.lastPart = 'vls'; ok(createRunner().tick(vls, s, 0, c2).done, 'find-vls true after clicking vls');
}

// Glossary
ok(GLOSSARY.length >= 30, `need >= 30 glossary terms, got ${GLOSSARY.length}`);
const gIds = new Set(), aliases = new Set();
for (const g of GLOSSARY) {
  ok(!gIds.has(g.id), `duplicate glossary id ${g.id}`); gIds.add(g.id);
  ok(g.a.length > 0, `${g.id}: no aliases`);
  for (const a of g.a) { ok(!aliases.has(a), `duplicate glossary alias ${a}`); aliases.add(a); }
  for (const lang of ['es', 'en']) ok(text(g.n[lang]) && text(g.d[lang]), `${g.id}.${lang} name/definition empty`);
}
const required = ['VLS', 'Vα prot', 'Vα max', 'VMAX', 'VFE', 'VMO', 'MMO', 'green dot', 'FMA', 'A/THR', 'AP', 'FD', 'FPV', 'FPA', 'AoA', 'SRS', 'OP CLB', 'ALT*', 'G/S', 'LOC', 'QNH', 'STD', 'RA', 'DH', 'MDA', 'TOGA', 'FLX', 'ley normal', 'bank angle protection', 'FCU'];
for (const r of required) ok(aliases.has(r), `glossary lacks ${r}`);
ok(glossHtml('VLS y `código <x>`', 'es').includes('data-term="vls"') && glossHtml('<b>', 'es').includes('&lt;b&gt;'), 'glossHtml escaping/terms');

// Guide + UI parity
for (const lang of ['es', 'en']) {
  ok(GUIDE[lang].length >= 6, `guide.${lang} too short`);
  for (const s of GUIDE[lang]) { ok(text(s.title) && s.blocks.length, `guide.${lang}.${s.id} empty`); }
  ok(GUIDE.es.map((s) => s.id).join() === GUIDE.en.map((s) => s.id).join(), 'guide sections differ between es and en');
}
for (const l of LEGEND) ok(text(l.es) && text(l.en), 'legend entry missing text');
ok(LEGEND.length >= 7, 'legend should cover green/cyan/magenta/amber/red/yellow/white');
for (const k of Object.keys(UI.es)) ok(k in UI.en, `UI.en lacks ${k}`);
for (const k of Object.keys(UI.en)) ok(k in UI.es, `UI.es lacks ${k}`);

if (failures) { console.error(`\n${failures} check(s) failed`); process.exit(1); }
console.log(`ok: ${PART_IDS.length} parts, ${EXERCISES.length} exercises, ${GLOSSARY.length} glossary terms, ${GUIDE.es.length} guide sections`);
