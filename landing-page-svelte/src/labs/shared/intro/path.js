// Camera path for the labs' cockpit fly-in intro. Pure math (no three import) so Node checks can run it.
// Same axes as buildA320: metres, nose −z, right +x, up +y, centre of gravity at the origin.
// The flight deck faces aft, so a continuous path in through the windshield would have to turn the view 180°.
// Instead the camera flies up to the glass, the view goes dark (veilAt) and cuts to the captain's eye point,
// then moves in to the target screen.

export const DURATION = 3.5; // s
export const FADE = 0.4; // s
export const T_CUT = 0.5; // eased time of the cut
const VEIL = 0.07; // eased time over which the veil fades in before the cut and out after it

const DIST = { pfd: 0.45, mcdu: 0.35 };

/**
 * Outside 3/4 → ahead of the nose → at the windshield | cut | captain's eye point → in front of the target screen.
 * The first frame after the cut has `cut: true` and the same t as the one before it.
 * @param {'pfd'|'mcdu'} target
 * @param {number[]} screenPos world centre of the target screen
 * @param {number[]} screenNormal unit normal of its face (towards the pilots)
 * @returns {{t: number, pos: number[], look: number[], cut?: boolean}[]}
 */
export function keyframes(target, screenPos, screenNormal) {
  const d = DIST[target] ?? DIST.pfd;
  return [
    { t: 0, pos: [-30, 10, -32], look: [0, 0, -4] },
    { t: 0.32, pos: [0, 2.4, -30], look: [0, 1.1, -15.6] },
    { t: T_CUT, pos: [0, 1.2, -17], look: [0, 1.1, -15.6] },
    { t: T_CUT, cut: true, pos: [-0.55, 1.05, -13.4], look: [-0.35, 0.6, -15.2] },
    { t: 1, pos: screenPos.map((v, i) => v + screenNormal[i] * d), look: [...screenPos] },
  ];
}

const sub = (a, b) => a.map((v, i) => v - b[i]);
const norm = (a) => Math.hypot(...a);
const smooth = (x) => x * x * (3 - 2 * x);
const ease = (t) => smooth(Math.min(1, Math.max(0, Number.isFinite(t) ? t : 0)));
const lerp = (a, b, u) => a.map((v, i) => v + (b[i] - v) * u);

// Hermite tangents: zero at the ends; inside, along the outgoing leg with half the shorter neighbouring leg's
// length, so the camera arrives at each keyframe already heading to the next one without swinging wide.
function tangents(frames) {
  return frames.map((f, k) => {
    const next = frames[k + 1], prev = frames[k - 1];
    if (!next || !prev) return [0, 0, 0];
    const out = sub(next.pos, f.pos), n = norm(out) || 1;
    const m = 0.5 * Math.min(n, norm(sub(f.pos, prev.pos)));
    return out.map((v) => (v / n) * m);
  });
}

function along(frames, x) {
  let i = 0;
  while (i < frames.length - 2 && x > frames[i + 1].t) i++;
  const a = frames[i], b = frames[i + 1], u = (x - a.t) / (b.t - a.t);
  const m = tangents(frames), u2 = u * u, u3 = u2 * u;
  const h = [2 * u3 - 3 * u2 + 1, u3 - 2 * u2 + u, -2 * u3 + 3 * u2, u3 - u2];
  const pos = a.pos.map((v, k) => h[0] * v + h[1] * m[i][k] + h[2] * b.pos[k] + h[3] * m[i + 1][k]);
  return { pos, look: lerp(a.look, b.look, u) };
}

/** Camera pose at t ∈ [0, 1] (clamped; NaN → 0), eased with smoothstep; separate splines before and after the cut. */
export function cameraAt(frames, t) {
  const x = ease(t), c = frames.findIndex((f) => f.cut);
  if (c < 0) return along(frames, x);
  return x < frames[c].t ? along(frames.slice(0, c), x) : along(frames.slice(c), x);
}

/** Opacity (0–1) of the dark veil that hides the cut. */
export function veilAt(t) {
  return Math.max(0, 1 - Math.abs(ease(t) - T_CUT) / VEIL);
}

/** Vertical FOV (deg): 50° on landscape; portrait widens it so the aircraft still fits, capped at 80°. */
export function fovFor(aspect) {
  if (!(aspect < 1)) return 50;
  const v = 2 * Math.atan(Math.tan((25 * Math.PI) / 180) / Math.max(aspect, 0.01)) * (180 / Math.PI);
  return Math.min(80, v);
}
