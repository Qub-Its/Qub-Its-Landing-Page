// Typed answers: parsing ("1,5", "1:30") and reading tolerance. Pure JS.
import { angleDiff, parseHm } from './scales.js';

/** "1,5", "1.5", "-3", "+3" → number (NaN if invalid). */
export function parseNumber(str) {
  const s = String(str ?? '').trim().replace(',', '.');
  return /^[+-]?(\d+\.?\d*|\.\d+)$/.test(s) ? Number(s) : NaN;
}

/** Parses an answer for a field unit; for 'min' accepts "h:mm" or minutes. */
export function parseAnswer(str, unit) {
  if (unit === 'min' && String(str).includes(':')) return parseHm(str);
  return parseNumber(str);
}

/**
 * Is x within the field's tolerance? `field = {value, tol: {abs?, rel?}, angle?}`.
 * Tolerance is max(abs, rel·|value|); with `angle` the difference wraps at 360°.
 */
export function isClose(x, field) {
  if (!Number.isFinite(x)) return false;
  const { value, tol = {} } = field;
  const lim = Math.max(tol.abs ?? 0, (tol.rel ?? 0) * Math.abs(value));
  const diff = field.angle ? angleDiff(x, value) : x - value;
  return Math.abs(diff) <= lim;
}
