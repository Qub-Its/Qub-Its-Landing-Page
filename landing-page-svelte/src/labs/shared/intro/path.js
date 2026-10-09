// Camera path for the labs' cockpit fly-in intro. Pure math (no three import) so Node checks can run it.
// Same axes as buildA320: metres, nose −z, right +x, up +y, centre of gravity at the origin.

export const DURATION = 3.5; // s
export const FADE = 0.4; // s

const DIST = { pfd: 0.45, mcdu: 0.35 };

/**
 * Outside 3/4 → ahead of the nose → just through the windshield → in front of the target screen.
 * @param {'pfd'|'mcdu'} target
 * @param {number[]} screenPos world centre of the target screen
 * @param {number[]} screenNormal unit normal of its face (towards the pilots)
 */
export function keyframes(target, screenPos, screenNormal) {
  const d = DIST[target] ?? DIST.pfd;
  return [
    { t: 0, pos: [-30, 10, -32], look: [0, 0, -4] },
    { t: 0.45, pos: [0, 2.2, -27], look: [0, 1.1, -15.6] },
    { t: 0.7, pos: [0, 1.0, -14.3], look: [0, 0.6, -15.2] },
    { t: 1, pos: screenPos.map((v, i) => v + screenNormal[i] * d), look: [...screenPos] },
  ];
}

const sub = (a, b) => a.map((v, i) => v - b[i]);
const norm = (a) => Math.hypot(...a);
const smooth = (x) => x * x * (3 - 2 * x);
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

/** Camera pose at t ∈ [0, 1] (clamped; NaN → 0), eased with smoothstep. */
export function cameraAt(frames, t) {
  const x = smooth(Math.min(1, Math.max(0, Number.isFinite(t) ? t : 0)));
  let i = 0;
  while (i < frames.length - 2 && x > frames[i + 1].t) i++;
  const a = frames[i], b = frames[i + 1], u = (x - a.t) / (b.t - a.t);
  const m = tangents(frames), u2 = u * u, u3 = u2 * u;
  const h = [2 * u3 - 3 * u2 + 1, u3 - 2 * u2 + u, -2 * u3 + 3 * u2, u3 - u2];
  const pos = a.pos.map((v, k) => h[0] * v + h[1] * m[i][k] + h[2] * b.pos[k] + h[3] * m[i + 1][k]);
  return { pos, look: lerp(a.look, b.look, u) };
}
