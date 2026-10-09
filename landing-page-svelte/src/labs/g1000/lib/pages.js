// MFD page groups and the cursor fields the FMS knob walks through on each page or window.
import { byId, nearest } from './world.js';

export const GROUPS = /** @type {const} */ (['MAP', 'WPT', 'AUX', 'NRST']);
/** @type {Record<string, string[]>} */
export const PAGES = { MAP: ['MAP_NAV'], WPT: ['WPT_APT'], AUX: ['AUX_SETUP', 'AUX_GPS'], NRST: ['NRST_APT'] };
export const RANGES = [1, 2, 5, 10, 15, 20, 25, 30, 40, 50, 75, 100];

export const pageId = (s) => PAGES[s.mfd.group][s.mfd.page];

/** Airport shown on WPT - Airport Information (falls back to SQ01 if the stored id is not an airport). */
export function wptAirport(s) {
  const w = byId(s.mfd.wpt);
  return /** @type {import('./world.js').Airport} */ (w?.kind === 'apt' ? w : byId('SQ01'));
}

/** Airport selected on the MFD nearest page. */
export const nrstAirport = (s) => nearest(s.ac)[Math.min(s.mfd.nrstSel, 4)].apt;

/** Cursor fields of the MFD: the flight plan window when open, else the current page. */
export function mfdFields(s) {
  if (s.mfd.win === 'fpl') return [...s.gps.fpl.legs.map((_, i) => `r${i}`), `r${s.gps.fpl.legs.length}`];
  const id = pageId(s);
  if (id === 'WPT_APT') return ['ident', ...wptAirport(s).freqs.map((_, i) => `f${i}`)];
  if (id === 'NRST_APT') return ['a0', 'a1', 'a2', 'a3', 'a4', ...nrstAirport(s).freqs.map((_, i) => `f${i}`)];
  return [];
}

/** Field under the MFD cursor, or null when the cursor is off. */
export function mfdField(s) {
  if (s.mfd.cursor < 0) return null;
  const f = mfdFields(s);
  return f[Math.min(s.mfd.cursor, f.length - 1)] ?? null;
}
