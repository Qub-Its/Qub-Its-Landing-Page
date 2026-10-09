// Pure maths of the exploded-architecture scene: where each LRU sits at explosion progress p, and where a data
// pulse is along a flow path. No three.js here so it is testable in Node.
import { LRUS } from '../content/lru.js';
import { ease, lerp3 } from './camera.js';

/** Packed position: every LRU tucked behind the panel. */
export const packed = (lru) => /** @type {[number, number, number]} */ ([lru.pos[0] * 0.25, 0.6 + lru.pos[1] * 0.15, -0.4]);

/** LRU centre at explosion progress p ∈ [0, 1] (eased, staggered by index so they fly out one after another). */
export function lruAt(lru, p) {
  const i = LRUS.indexOf(lru);
  const local = Math.max(0, Math.min(1, p * 1.6 - (i / LRUS.length) * 0.6));
  return lerp3(packed(lru), lru.pos, ease(local));
}

/** Point along a polyline of LRU ids at t ∈ [0, 1] (exploded positions, equal time per segment). */
export function flowPoint(path, t) {
  const pts = path.map((id) => /** @type {import('../content/lru.js').Lru} */ (LRUS.find((l) => l.id === id)).pos);
  const segs = pts.length - 1;
  const x = Math.max(0, Math.min(1, t)) * segs;
  const k = Math.min(segs - 1, Math.floor(x));
  return lerp3(pts[k], pts[k + 1], x - k);
}
