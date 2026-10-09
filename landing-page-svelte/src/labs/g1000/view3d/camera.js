// Pure camera framing for the G1000 3D scenes: where to put the camera to show a box, and the eased tween between
// two framings. No three.js here so it is testable in Node.

/** @typedef {[number, number, number]} V3 */

/**
 * Camera position/target that fit an axis-aligned box seen from +z (the pilot side), slightly from above.
 * @param {{min: V3, max: V3}} box
 * @param {number} fovDeg vertical field of view
 * @param {number} aspect width / height
 * @returns {{ pos: V3, target: V3 }}
 */
export function frameBox(box, fovDeg = 40, aspect = 16 / 9) {
  const c = /** @type {V3} */ ([0, 1, 2].map((i) => (box.min[i] + box.max[i]) / 2));
  const w = box.max[0] - box.min[0], h = box.max[1] - box.min[1];
  const half = Math.tan(((fovDeg / 2) * Math.PI) / 180);
  const fit = Math.max(h / 2 / half, w / 2 / (half * aspect)) * 1.35;
  const dist = Math.max(fit, 0.12) + (box.max[2] - c[2]);
  return { pos: [c[0], c[1] + dist * 0.12, c[2] + dist], target: c };
}

export const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const lerp3 = (a, b, t) => /** @type {V3} */ (a.map((v, i) => v + (b[i] - v) * t));

/** Eased point between two framings at t ∈ [0, 1]. */
export function tweenFrame(from, to, t) {
  const e = ease(Math.max(0, Math.min(1, t)));
  return { pos: lerp3(from.pos, to.pos, e), target: lerp3(from.target, to.target, e) };
}
