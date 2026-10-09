// Grading of typed answers (shared by TaskBar exercises and Practice). Pure JS.
import { parseAnswer, isClose } from './lib/answers.js';

/**
 * Marks every field of a typed-answer problem.
 * @param {{key:string, value:number, tol:object, unit:string, angle?:boolean}[]} fields
 * @param {Record<string, string>} values raw input text by field key
 * @returns {{ marks: Record<string, boolean>, empty: boolean, all: boolean }}
 */
export function grade(fields, values) {
  const marks = {};
  let empty = false;
  let all = true;
  for (const f of fields) {
    const raw = String(values[f.key] ?? '').trim();
    if (!raw) empty = true;
    const ok = raw !== '' && isClose(parseAnswer(raw, f.unit), f);
    marks[f.key] = ok;
    if (!ok) all = false;
  }
  return { marks, empty, all };
}
