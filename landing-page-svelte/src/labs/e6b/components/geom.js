// Small SVG geometry helpers shared by the E6B instrument components (plain JS, no reactivity).
import { norm360 } from '../lib/scales.js';

/** Rounds to 2 decimals (keeps the generated path strings short). */
export const f = (n) => Math.round(n * 100) / 100;

/** Point at radius r, screen angle a (deg clockwise from 12 o'clock) around (cx, cy). */
export function pt(cx, cy, r, a) {
  const t = (a * Math.PI) / 180;
  return [f(cx + r * Math.sin(t)), f(cy - r * Math.cos(t))];
}

/** Radial segment "M..L.." between radii r1 and r2 at angle a. */
export function seg(cx, cy, r1, r2, a) {
  const [x1, y1] = pt(cx, cy, r1, a);
  const [x2, y2] = pt(cx, cy, r2, a);
  return `M${x1} ${y1}L${x2} ${y2}`;
}

/** Closed ring-sector path between radii r1 < r2 and angles a1 < a2 (span < 360). */
export function sector(cx, cy, r1, r2, a1, a2) {
  const large = a2 - a1 > 180 ? 1 : 0;
  const [x1, y1] = pt(cx, cy, r1, a1);
  const [x2, y2] = pt(cx, cy, r1, a2);
  const [x3, y3] = pt(cx, cy, r2, a2);
  const [x4, y4] = pt(cx, cy, r2, a1);
  return `M${x1} ${y1}A${r1} ${r1} 0 ${large} 1 ${x2} ${y2}L${x3} ${y3}A${r2} ${r2} 0 ${large} 0 ${x4} ${y4}Z`;
}

/** Text rotation that keeps tangential text upright-ish (flipped on the lower half). */
export const flipA = (a) => {
  const n = norm360(a);
  return n > 90 && n < 270 ? n + 180 : n;
};

/** A label placed at radius r, angle a, written along the tangent. */
export function label(cx, cy, r, a, text, extra = {}) {
  const [x, y] = pt(cx, cy, r, a);
  return { x, y, t: String(text), tr: `rotate(${f(flipA(a))} ${x} ${y})`, ...extra };
}

/** Pointer event → SVG user-space point. */
export function svgPoint(svg, e) {
  const m = svg.getScreenCTM();
  if (!m) return { x: 0, y: 0 };
  const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
  return { x: p.x, y: p.y };
}

/** Angle (deg clockwise from up) of the vector (dx, dy) in screen coordinates. */
export const vecAngle = (dx, dy) => (Math.atan2(dx, -dy) * 180) / Math.PI;

/** Keyboard step for slider-like groups: fine = arrows, big = Shift, huge = PageUp/Down. */
export function keyStep(e, fine, big, huge) {
  const sign = e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'PageUp' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowDown' || e.key === 'PageDown' ? -1 : 0;
  if (!sign) return 0;
  if (e.key === 'PageUp' || e.key === 'PageDown') return sign * (huge ?? big * 5);
  return sign * (e.shiftKey ? big : fine);
}
