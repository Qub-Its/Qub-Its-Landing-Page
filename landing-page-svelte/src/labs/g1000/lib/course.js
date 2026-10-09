// Course progress and position in localStorage: done step ids (tasks + quizzes) and the last lesson/step.
import { LESSONS, progressIds } from '../content/lessons.js';

const PROGRESS_KEY = 'qubits.g1000.progress.v1';
const POS_KEY = 'qubits.g1000.pos.v1';

/** @returns {Record<string, true>} */
export function loadProgress() {
  try { return JSON.parse(localStorage.getItem(PROGRESS_KEY) ?? '{}') ?? {}; } catch { return {}; }
}
export function saveProgress(done) {
  try { localStorage.setItem(PROGRESS_KEY, JSON.stringify(done)); } catch { /* storage unavailable: progress lives for this load */ }
}

/** @returns {{lesson: number, step: number}} */
export function loadPos() {
  try {
    const p = JSON.parse(localStorage.getItem(POS_KEY) ?? 'null');
    if (p && Number.isInteger(p.lesson) && Number.isInteger(p.step) && LESSONS[p.lesson] && LESSONS[p.lesson].steps[p.step]) return { lesson: p.lesson, step: p.step };
  } catch { /* fall through */ }
  return { lesson: 0, step: 0 };
}
export function savePos(pos) {
  try { localStorage.setItem(POS_KEY, JSON.stringify(pos)); } catch { /* ignore */ }
}

/** Done / total counted steps of a lesson. */
export function lessonProgress(lesson, done) {
  const ids = progressIds(lesson);
  return { done: ids.filter((id) => done[id]).length, total: ids.length };
}

/**
 * Deterministic shuffle of a quiz's options: returns display position -> original option index.
 * FNV-1a hash of the step id seeds mulberry32; Fisher-Yates.
 */
export function quizOrder(id, n) {
  let h = 0x811c9dc5;
  for (let i = 0; i < id.length; i++) { h ^= id.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  let a = h >>> 0;
  const rnd = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const order = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}
