// Reactive store of the E6B instrument: the only module here that uses runes. Everything else is plain JS.
import { norm360, angleDiff } from './scales.js';
import { WIND } from './wind.js';

const DEFAULTS = { face: 'calc', rot: 0, cursor: 0, dir: 0, slide: 100, dots: [], pencil: false, dragging: false };

export const e6b = $state({ ...DEFAULTS, dots: [] });

const clampSlide = (v) => Math.min(WIND.slideMax, Math.max(WIND.slideMin, v));
const ANGLES = ['rot', 'cursor', 'dir'];

/** Sets known keys of a StatePatch (angles normalized, slide clamped, dots: 'clear' or an array). */
export function applyState(patch = {}) {
  if (patch.face === 'calc' || patch.face === 'wind') e6b.face = patch.face;
  for (const k of ANGLES) if (Number.isFinite(patch[k])) e6b[k] = norm360(patch[k]);
  if (Number.isFinite(patch.slide)) e6b.slide = clampSlide(patch.slide);
  if (patch.dots === 'clear') e6b.dots = [];
  else if (Array.isArray(patch.dots)) e6b.dots = patch.dots.slice(-3).map((d) => ({ b: d.b, d: d.d }));
  if (typeof patch.pencil === 'boolean') e6b.pencil = patch.pencil;
}

export function resetState() {
  cancelTween();
  Object.assign(e6b, DEFAULTS, { dots: [] });
}

let tween = null; // { id, done }
function cancelTween() {
  if (!tween) return;
  if (tween.id != null && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(tween.id);
  tween.done();
  tween = null;
}

const reduced = () => {
  try {
    return typeof window === 'undefined' || !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return true;
  }
};
const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

/**
 * Tweens the numeric keys of a patch (angles by the shortest way, slide clamped) over `ms`; face and dots
 * apply at once. Resolves when finished (or superseded). Instant with reduced motion or without a window.
 * @returns {Promise<void>}
 */
export function animateTo(patch, ms = 700) {
  cancelTween();
  if (ms <= 0 || reduced() || typeof requestAnimationFrame !== 'function') {
    applyState(patch);
    return Promise.resolve();
  }
  applyState({ face: patch.face, dots: patch.dots, pencil: patch.pencil });
  const from = {};
  const delta = {};
  for (const k of ANGLES) {
    if (Number.isFinite(patch[k])) {
      from[k] = e6b[k];
      delta[k] = angleDiff(norm360(patch[k]), e6b[k]);
    }
  }
  if (Number.isFinite(patch.slide)) {
    from.slide = e6b.slide;
    delta.slide = clampSlide(patch.slide) - e6b.slide;
  }
  const keys = Object.keys(from);
  if (!keys.length) return Promise.resolve();
  return new Promise((resolve) => {
    const t = { id: null, done: resolve };
    tween = t;
    let t0 = null;
    const frame = (now) => {
      if (tween !== t) return;
      t0 ??= now;
      const p = Math.min(1, (now - t0) / ms);
      const e = ease(p);
      const next = {};
      for (const k of keys) next[k] = from[k] + delta[k] * e;
      applyState(next);
      if (p < 1) t.id = requestAnimationFrame(frame);
      else {
        tween = null;
        resolve();
      }
    };
    t.id = requestAnimationFrame(frame);
  });
}

/** Adds a pencil dot (max 3, the oldest is dropped). */
export function addDot(dot) {
  e6b.dots = [...e6b.dots, { b: dot.b, d: dot.d }].slice(-3);
}
export function clearDots() {
  e6b.dots = [];
}
