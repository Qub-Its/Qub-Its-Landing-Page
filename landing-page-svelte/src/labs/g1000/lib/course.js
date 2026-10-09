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
    if (p && LESSONS[p.lesson] && LESSONS[p.lesson].steps[p.step]) return { lesson: p.lesson, step: p.step };
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
