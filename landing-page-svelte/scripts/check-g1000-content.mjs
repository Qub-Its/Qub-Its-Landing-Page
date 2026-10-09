// Content checks for the G1000 course: ES/EN coverage, parts, scene cues, quizzes, and every task solvable by
// replaying its demo against the model (avionics + sim). Run from landing-page-svelte/:  node scripts/check-g1000-content.mjs
import assert from 'node:assert/strict';
import { LESSONS, COMING, progressIds } from '../src/labs/g1000/content/lessons.js';
import { PARTS } from '../src/labs/g1000/content/parts.js';
import { GLOSSARY } from '../src/labs/g1000/content/glossary.js';
import { EXPLODE_NODES, LRUS } from '../src/labs/g1000/content/lru.js';
import { COCKPIT_NODES } from '../src/labs/shared/three/c172-panel.js';
import { createState } from '../src/labs/g1000/lib/state.js';
import { dispatch } from '../src/labs/g1000/lib/avionics.js';
import { step, DT } from '../src/labs/g1000/lib/sim.js';
import { loadPos, savePos, loadProgress, saveProgress, lessonProgress, quizOrder } from '../src/labs/g1000/lib/course.js';

let passed = 0, failed = 0;
function check(name, fn) {
  try { fn(); passed++; console.log(`  ok   ${name}`); }
  catch (e) { failed++; console.log(`  FAIL ${name}\n       ${e.message}`); }
}
const txt = (o, where) => {
  assert.ok(o && typeof o.es === 'string' && o.es.trim() && typeof o.en === 'string' && o.en.trim(), `${where}: missing es/en text`);
};

/** Builds the task's starting state, plays its demo (events, waits, part clicks) and returns state + ctx. */
function replay(task) {
  const s = createState(task.setup.scenario);
  task.setup.apply?.(s);
  const ctx = { lastPart: null };
  for (const d of task.demo) {
    for (const e of d.events ?? []) dispatch(s, typeof e === 'function' ? e(s) : e);
    if (d.wait) for (let i = 0; i < Math.round(d.wait / DT); i++) step(s, DT);
    if (d.part) ctx.lastPart = d.part;
  }
  return { s, ctx };
}

console.log('G1000 content checks');

check('lessons numbered 1..8, ids unique, coming soon 9..13', () => {
  assert.deepEqual(LESSONS.map((l) => l.n), [1, 2, 3, 4, 5, 6, 7, 8]);
  assert.deepEqual(COMING.map((c) => c.n), [9, 10, 11, 12, 13]);
  const ids = LESSONS.flatMap(progressIds);
  assert.equal(new Set(ids).size, ids.length, 'duplicate step id');
  for (const c of COMING) txt(c.title, `coming ${c.n}`);
});

for (const lesson of LESSONS) {
  check(`${lesson.id}: texts, parts, cues, quizzes`, () => {
    txt(lesson.title, lesson.id);
    assert.ok(lesson.objectives.es.length && lesson.objectives.es.length === lesson.objectives.en.length, 'objectives es/en');
    assert.ok(lesson.steps.some((s) => s.kind === 'task'), 'no task');
    assert.ok(lesson.steps.filter((s) => s.kind === 'quiz').length >= 3, 'needs ≥ 3 quiz questions');
    for (const [i, st] of lesson.steps.entries()) {
      const where = `${lesson.id} step ${i}`;
      if ('part' in st && st.part) assert.ok(PARTS[st.part], `${where}: unknown part ${st.part}`);
      if (st.kind === 'scene') {
        txt(st.caption, where);
        const nodes = st.scene === 'explode' ? EXPLODE_NODES : COCKPIT_NODES;
        for (const c of st.cues) { assert.ok(nodes.includes(c.focus), `${where}: unknown ${st.scene} node ${c.focus}`); if (c.label) txt(c.label, where); }
      } else if (st.kind === 'explain') { txt(st.title, where); txt(st.text, where); }
      else if (st.kind === 'task') {
        for (const k of ['task', 'hint', 'why']) txt(st[k], `${where} ${k}`);
        assert.ok(st.demo.length, `${where}: empty demo`);
        if (st.view === 'explode') for (const d of st.demo) assert.ok(!d.part || d.part.startsWith('lru.'), `${where}: explode demo must pick an LRU`);
        for (const d of st.demo) txt(d.say, `${where} demo`);
      } else if (st.kind === 'quiz') {
        txt(st.q, where); txt(st.why, where);
        assert.ok(st.options.length >= 2 && st.answer >= 0 && st.answer < st.options.length, `${where}: bad options/answer`);
        st.options.forEach((o) => txt(o, where));
      } else assert.fail(`${where}: unknown kind ${st.kind}`);
    }
  });
  for (const task of lesson.steps.filter((s) => s.kind === 'task')) {
    check(`${task.id}: not solved at setup, solved by its demo`, () => {
      const s0 = createState(task.setup.scenario);
      task.setup.apply?.(s0);
      assert.equal(task.check(s0, { lastPart: null }), false, 'already solved before the demo');
      const { s, ctx } = replay(task);
      assert.equal(task.check(s, ctx), true, 'demo does not solve it');
    });
  }
}

check('parts: es/en title/what/read/why', () => {
  for (const [id, p] of Object.entries(PARTS)) for (const l of ['es', 'en']) for (const k of ['title', 'what', 'read', 'why']) assert.ok(p[l]?.[k], `${id}.${l}.${k}`);
});
check('every LRU has a part', () => { for (const l of LRUS) assert.ok(PARTS[l.part], l.id); });
check('glossary: unique ids and aliases, es/en', () => {
  assert.equal(new Set(GLOSSARY.map((g) => g.id)).size, GLOSSARY.length);
  const aliases = GLOSSARY.flatMap((g) => g.a);
  assert.equal(new Set(aliases).size, aliases.length);
  for (const g of GLOSSARY) { txt(g.n, g.id); txt(g.d, g.id); }
});

/** Minimal localStorage stand-in for Node. */
function fakeStorage(init = {}, { throws = false } = {}) {
  const data = { ...init };
  globalThis.localStorage = /** @type {any} */ ({
    getItem: (k) => { if (throws) throw new Error('blocked'); return k in data ? data[k] : null; },
    setItem: (k, v) => { if (throws) throw new Error('blocked'); data[k] = String(v); },
  });
  return data;
}
check('course: saved position round trip; corrupt or out-of-range position falls back to the start', () => {
  fakeStorage();
  savePos({ lesson: 5, step: 3 }); assert.deepEqual(loadPos(), { lesson: 5, step: 3 });
  fakeStorage({ 'qubits.g1000.pos.v1': '{"lesson":42,"step":0}' }); assert.deepEqual(loadPos(), { lesson: 0, step: 0 });
  fakeStorage({ 'qubits.g1000.pos.v1': '{"lesson":0,"step":99}' }); assert.deepEqual(loadPos(), { lesson: 0, step: 0 });
  fakeStorage({ 'qubits.g1000.pos.v1': 'not json' }); assert.deepEqual(loadPos(), { lesson: 0, step: 0 });
  fakeStorage({ 'qubits.g1000.pos.v1': '{"lesson":"1","step":0}' }); assert.deepEqual(loadPos(), { lesson: 0, step: 0 });
});
check('quizzes: quizOrder is a deterministic permutation and the correct answer is spread over positions', () => {
  const pos = {}; let total = 0;
  for (const l of LESSONS) for (const st of l.steps) {
    if (st.kind !== 'quiz') continue;
    const n = st.options.length, o = quizOrder(st.id, n);
    assert.deepEqual([...o].sort((a, b) => a - b), Array.from({ length: n }, (_, i) => i), st.id);
    assert.deepEqual(quizOrder(st.id, n), o, st.id);
    const k = o.indexOf(st.answer); pos[k] = (pos[k] ?? 0) + 1; total++;
  }
  assert.ok(total > 0);
  assert.ok(Object.keys(pos).length >= 2, JSON.stringify(pos));
  assert.ok(Math.max(...Object.values(pos)) / total <= 0.7, JSON.stringify(pos));
});
check('course: blocked storage never throws; progress counts tasks and quizzes', () => {
  fakeStorage({}, { throws: true });
  assert.deepEqual(loadProgress(), {}); saveProgress({ x: true }); savePos({ lesson: 1, step: 1 }); assert.deepEqual(loadPos(), { lesson: 0, step: 0 });
  fakeStorage({ 'qubits.g1000.progress.v1': 'null' }); assert.deepEqual(loadProgress(), {});
  const p = lessonProgress(LESSONS[0], { 'l1.ahrs': true, 'l1.q1': true });
  assert.equal(p.done, 2); assert.equal(p.total, progressIds(LESSONS[0]).length);
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
