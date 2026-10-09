// Wind triangle and the geometry of the wind side (shared by the SVG face, checks and demos). Pure JS.
import { norm360, angleDiff } from './scales.js';

const rad = (d) => (d * Math.PI) / 180;
const deg = (r) => (r * 180) / Math.PI;

/** Wind-face geometry, viewBox 0 0 400 470. `unit` = svg units per knot. */
export const WIND = { cx: 200, cy: 190, rDisc: 150, unit: 2.2, slideMin: 30, slideMax: 270 };

/**
 * Wind triangle: true course, TAS and wind (from wdir, wspd kt) → WCA (+ = right), TH and GS.
 * @returns {{wca:number, th:number, gs:number} | null} null if the wind cannot be corrected for.
 */
export function solveWind({ tc, tas, wdir, wspd }) {
  const t = rad(wdir - tc);
  const s = (wspd * Math.sin(t)) / tas;
  if (Math.abs(s) > 1) return null;
  const wca = Math.asin(s);
  return { wca: deg(wca), th: norm360(tc + deg(wca)), gs: tas * Math.cos(wca) - wspd * Math.cos(t) };
}

/** Inverse: TC, TH, TAS and GS → wind (from wdir, wspd kt). */
export function findWind({ tc, th, tas, gs }) {
  const gx = gs * Math.cos(rad(tc));
  const gy = gs * Math.sin(rad(tc));
  const ax = tas * Math.cos(rad(th));
  const ay = tas * Math.sin(rad(th));
  const wx = gx - ax; // wind vector (towards), north / east
  const wy = gy - ay;
  return { wdir: norm360(deg(Math.atan2(wy, wx)) + 180), wspd: Math.hypot(wx, wy) };
}

/** Screen position of a dot (bearing b on the rose, distance d kt from the grommet) for rose value `dir`. */
export function dotScreen(dot, dir) {
  const a = rad(angleDiff(dot.b, dir));
  return { x: WIND.cx + dot.d * WIND.unit * Math.sin(a), y: WIND.cy - dot.d * WIND.unit * Math.cos(a) };
}

/** Speed (kt) and drift (deg, + = right) of a dot read from the card origin at (cx, cy + slide·unit). */
export function readDot(dot, { dir, slide }) {
  const p = dotScreen(dot, dir);
  const dx = p.x - WIND.cx;
  const dy = p.y - (WIND.cy + slide * WIND.unit);
  return { speed: Math.hypot(dx, dy) / WIND.unit, drift: deg(Math.atan2(dx, -dy)) };
}

/** The wind dot for the "wind up" method. */
export const dotFor = (wdir, wspd) => ({ b: wdir, d: wspd });
