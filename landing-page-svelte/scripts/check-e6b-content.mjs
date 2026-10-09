// Content checks for the E6B trainer: part coverage, exercises (shape, setups, demos), glossary, guide.
// Run from landing-page-svelte/:  node scripts/check-e6b-content.mjs
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '../src/labs/e6b');
const load = (p) => import(pathToFileURL(resolve(root, p)).href);

const { PARTS } = await load('content/parts.js');
const { GLOSSARY, glossHtml, TERM_BY_ID } = await load('content/glossary.js');
const { EXERCISES, LEVELS, tasksOf, newCtx, loadProgress, saveProgress } = await load('content/exercises.js');
const { GUIDE, LEGEND } = await load('content/guide.js');

let failures = 0;
const fail = (msg) => { failures++; console.error('FAIL', msg); };
const ok = (cond, msg) => { if (!cond) fail(msg); };
const text = (v) => typeof v === 'string' && v.trim().length > 0;

// Part ids from the plan (Shared conventions)
const PART_IDS = [
  'outerScale', 'innerScale', 'hoursRing', 'index10', 'speedIndex', 'secondsIndex', 'convNaut', 'convFuel', 'convLength',
  'tasWindow', 'daWindow', 'tempStrip', 'cursor',
  'trueIndex', 'driftScale', 'azimuth', 'grommet', 'slideCard', 'speedArcs', 'driftLines', 'windDot'
];
for (const id of PART_IDS) {
  for (const lang of ['es', 'en']) {
    const p = PARTS[id]?.[lang];
    ok(p, `part ${id}: missing ${lang}`);
    if (p) for (const k of ['title', 'what', 'read', 'why']) ok(text(p[k]), `part ${id}.${lang}.${k} empty`);
  }
}
for (const id of Object.keys(PARTS)) ok(PART_IDS.includes(id), `part ${id} is not in the plan table`);

// ---------- Exercises ----------
const DEFAULT_STATE = { face: 'calc', rot: 0, cursor: 0, dir: 0, slide: 100, dots: [] };
/** Applies a StatePatch like applyState (without clamping/normalising): merges, dots 'clear' → []. */
function applyPatch(state, patch) {
  const next = { ...state, dots: [...state.dots] };
  for (const k of ['face', 'rot', 'cursor', 'dir', 'slide']) if (patch[k] !== undefined) next[k] = patch[k];
  if (patch.dots === 'clear') next.dots = [];
  else if (Array.isArray(patch.dots)) next.dots = patch.dots.map((d) => ({ ...d }));
  return next;
}
const LEVEL_MIN = 5, TOTAL_MIN = 28;

ok(EXERCISES.length >= TOTAL_MIN, `need >= ${TOTAL_MIN} exercises, got ${EXERCISES.length}`);
ok(LEVELS.length === 5, 'expected 5 levels');
const seen = new Set();
for (const e of EXERCISES) {
  ok(!seen.has(e.id), `duplicate exercise id ${e.id}`); seen.add(e.id);
  ok(LEVELS.some((l) => l.id === e.level), `${e.id}: unknown level ${e.level}`);
  if (e.part) ok(PARTS[e.part], `${e.id}: part ${e.part} has no content`);
  for (const k of ['task', 'hint', 'why']) for (const lang of ['es', 'en']) ok(text(e[k]?.[lang]), `${e.id}.${k}.${lang} empty`);
  const kinds = ['check', 'quiz', 'answers'].filter((k) => e[k]);
  ok(kinds.length === 1, `${e.id}: needs exactly one of check / quiz / answers (has ${kinds.join(',') || 'none'})`);

  if (e.quiz) {
    ok(e.quiz.choices.length >= 2, `${e.id}: quiz needs >= 2 choices`);
    ok(Number.isInteger(e.quiz.answer) && e.quiz.answer >= 0 && e.quiz.answer < e.quiz.choices.length, `${e.id}: quiz answer out of range`);
    e.quiz.choices.forEach((c, i) => { for (const lang of ['es', 'en']) ok(text(c[lang]), `${e.id}: choice ${i} ${lang} empty`); });
  }
  if (e.answers) {
    ok(e.answers.length >= 1, `${e.id}: empty answers`);
    for (const a of e.answers) {
      ok(text(a.key), `${e.id}: answer without key`);
      for (const lang of ['es', 'en']) ok(text(a.label?.[lang]), `${e.id}.${a.key}: label ${lang} empty`);
      ok(Number.isFinite(a.value), `${e.id}.${a.key}: value not finite (${a.value})`);
      ok(a.tol && (Number.isFinite(a.tol.abs) || Number.isFinite(a.tol.rel)), `${e.id}.${a.key}: tol missing`);
      ok(typeof a.unit === 'string', `${e.id}.${a.key}: unit missing`);
    }
  }
  if (e.demo) {
    ok(e.demo.length >= 1, `${e.id}: empty demo`);
    e.demo.forEach((d, i) => { for (const lang of ['es', 'en']) ok(text(d.say?.[lang]), `${e.id}: demo step ${i} say.${lang} empty`); });
  }
  if (e.check) {
    const start = applyPatch(DEFAULT_STATE, e.setup || {});
    let initial;
    try { initial = e.check(start, newCtx()); } catch (err) { fail(`${e.id}: check threw on setup state: ${err.message}`); }
    ok(initial === false, `${e.id}: check is already true at setup`);
    if (e.demo) {
      let s = start;
      for (const d of e.demo) s = applyPatch(s, d);
      let done;
      try { done = e.check(s, { lastPart: null }); } catch (err) { fail(`${e.id}: check threw after demo: ${err.message}`); }
      ok(done === true, `${e.id}: check is false after applying the demo`);
    } else {
      // Tap exercises (Explain mode): satisfied by tapping the part the exercise highlights.
      ok(e.explain && e.part, `${e.id}: a check without demo must be a tap exercise (explain + part)`);
      let done;
      try { done = e.check(start, { lastPart: e.part }); } catch (err) { fail(`${e.id}: check threw after tap: ${err.message}`); }
      ok(done === true, `${e.id}: check is false after tapping ${e.part}`);
    }
  }
  if (e.answers && !e.demo && e.id !== 'conv-temp') fail(`${e.id}: computational exercise without demo`);
  if (e.setup) {
    for (const k of Object.keys(e.setup)) ok(['face', 'rot', 'cursor', 'dir', 'slide', 'dots'].includes(k), `${e.id}: unknown setup key ${k}`);
    if (e.setup.slide !== undefined) ok(e.setup.slide >= 30 && e.setup.slide <= 270, `${e.id}: setup slide out of range`);
  }
  for (const d of e.demo || []) if (d.slide !== undefined) ok(d.slide >= 30 && d.slide <= 270, `${e.id}: demo slide ${d.slide} out of range`);
}
for (const l of LEVELS) {
  ok(tasksOf(l.id).length >= LEVEL_MIN, `level ${l.id}: needs >= ${LEVEL_MIN} exercises, got ${tasksOf(l.id).length}`);
  for (const lang of ['es', 'en']) ok(text(l.name[lang]) && text(l.intro[lang]), `level ${l.id} ${lang} name/intro`);
}
ok(newCtx().lastPart === null, 'newCtx lastPart');
ok(typeof loadProgress() === 'object' && (saveProgress({}), true), 'progress helpers survive without localStorage');

// ---------- Glossary ----------
ok(GLOSSARY.length >= 30, `need >= 30 glossary terms, got ${GLOSSARY.length}`);
const gIds = new Set(), aliases = new Set();
for (const g of GLOSSARY) {
  ok(!gIds.has(g.id), `duplicate glossary id ${g.id}`); gIds.add(g.id);
  ok(g.a.length > 0, `${g.id}: no aliases`);
  for (const a of g.a) { ok(!aliases.has(a), `duplicate glossary alias ${a}`); aliases.add(a); }
  for (const lang of ['es', 'en']) ok(text(g.n[lang]) && text(g.d[lang]), `${g.id}.${lang} name/definition empty`);
}
const required = ['E6B', 'TAS', 'CAS', 'IAS', 'GS', 'TC', 'TH', 'MC', 'MH', 'WCA', 'OAT', 'PA', 'DA', 'QNH', 'ISA', 'NM', 'SM', 'GPH', 'ETE', 'ETA', 'TRUE INDEX', 'navlog', 'crosswind', 'headwind', 'tailwind'];
for (const r of required) ok(aliases.has(r), `glossary lacks ${r}`);
ok(TERM_BY_ID.get('tas')?.id === 'tas', 'TERM_BY_ID');
ok(glossHtml('TAS y `código <x>`', 'es').includes('data-term="tas"') && glossHtml('<b>', 'es').includes('&lt;b&gt;'), 'glossHtml escaping/terms');
ok(glossHtml('TAS y TAS', 'en').split('data-term="tas"').length === 2, 'glossHtml only links the first mention');
ok(glossHtml('TASTY', 'en') === 'TASTY', 'glossHtml must not match inside words');

// ---------- Guide ----------
for (const lang of ['es', 'en']) {
  ok(GUIDE[lang].length >= 8, `guide.${lang} needs >= 8 sections`);
  for (const s of GUIDE[lang]) {
    ok(text(s.id) && text(s.title) && s.blocks.length, `guide.${lang}.${s.id} empty`);
    for (const b of s.blocks) ok(text(b.p) || (Array.isArray(b.ul) && b.ul.length && b.ul.every(text)), `guide.${lang}.${s.id}: bad block`);
  }
}
ok(GUIDE.es.map((s) => s.id).join() === GUIDE.en.map((s) => s.id).join(), 'guide sections differ between es and en');
for (const l of LEGEND) ok(text(l.c) && l.c.startsWith('--') && text(l.sample) && text(l.es) && text(l.en), 'legend entry incomplete');
ok(LEGEND.length >= 5, 'legend should cover amber / cyan / dots / white / cursor');

if (failures) { console.error(`\n${failures} check(s) failed`); process.exit(1); }
console.log(`ok: ${PART_IDS.length} parts, ${EXERCISES.length} exercises (${LEVELS.map((l) => tasksOf(l.id).length).join('/')} per level), ${GLOSSARY.length} glossary terms, ${GUIDE.es.length} guide sections`);
