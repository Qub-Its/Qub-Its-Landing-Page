// Cockpit fly-in intro for the labs trainers: decides whether to play, mounts a full-screen overlay, lazy-loads
// the three.js scene (flyin.js) and fades out to the page. Eager and three-free; never blocks the page — no
// WebGL, a load slower than LOAD_MS or any error just removes the overlay.
import './intro.css';
import { shouldPlay } from './decide.js';
import { FADE } from './path.js';

const KEY = 'qubits.labs.introSeen';
const LOAD_MS = 2000;
const TEXT = {
  es: { title: 'Entrando a la cabina del A320…', skip: 'Saltar intro', label: 'Intro de cabina' },
  en: { title: 'Entering the A320 cockpit…', skip: 'Skip intro', label: 'Cockpit intro' },
};
const query = () => new URLSearchParams(location.search);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const readSeen = () => { try { return localStorage.getItem(KEY); } catch { return undefined; } };
const markSeen = () => { try { localStorage.setItem(KEY, '1'); } catch { /* private mode */ } };

let running = false;
let state = 'idle';
/** @type {{frames: number}|null} */
let current = null;
if (query().get('debug3d') !== null) window.__intro = () => ({ state, frames: current?.frames ?? 0 });

/** @param {{target?: 'pfd'|'mcdu', lang?: string, force?: boolean}} [opts] */
export async function maybeIntro({ target = 'pfd', lang = 'es', force = false } = {}) {
  if (running) return;
  const q = query();
  const reducedMotion = !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (!shouldPlay({ force, param: q.get('intro'), seen: readSeen(), reducedMotion })) return;
  running = true; state = 'loading'; current = null;
  markSeen();

  const t = TEXT[lang] ?? TEXT.es;
  const prev = /** @type {HTMLElement|null} */ (document.activeElement);
  const el = document.createElement('div');
  el.className = 'labs-intro';
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-modal', 'true');
  el.setAttribute('aria-label', t.label);
  el.innerHTML = '<canvas class="labs-intro-canvas"></canvas><p class="labs-intro-title"></p><button type="button" class="labs-intro-skip"></button>';
  el.querySelector('.labs-intro-title').textContent = t.title;
  const skipBtn = /** @type {HTMLButtonElement} */ (el.querySelector('.labs-intro-skip'));
  skipBtn.textContent = t.skip;
  document.body.append(el);
  document.documentElement.classList.add('labs-intro-open');
  skipBtn.focus();

  /** @type {any} */
  let view = null, abandoned = false, skipped = false;
  /** @type {() => void} */
  let resolveSkip = () => {};
  const skipP = new Promise((r) => { resolveSkip = r; });
  const skip = () => { skipped = true; view?.skip(); resolveSkip(); };
  // Window capture: runs before the page's own key handlers (PFD sidestick arrows) and keeps the key from them.
  const onKey = (e) => { e.stopPropagation(); if (e.key === 'Escape') e.preventDefault(); skip(); };
  const fit = () => view?.resize(innerWidth, innerHeight);
  window.addEventListener('keydown', onKey, true);
  el.addEventListener('pointerdown', skip);
  window.addEventListener('resize', fit);

  try {
    const canvas = /** @type {HTMLCanvasElement} */ (el.querySelector('canvas'));
    const load = import('./flyin.js')
      .then((m) => m.createFlyin(canvas, { target, debugFail: q.get('debug3d') === 'nowebgl' }))
      .then((v) => { if (abandoned) { v.dispose(); return null; } return v; });
    view = (await Promise.race([load, wait(LOAD_MS), skipP]).catch(() => null)) || null;
    if (!view) abandoned = true;
    if (view && !skipped) {
      current = view; fit(); state = 'playing';
      await Promise.race([view.play(), skipP]);
      el.classList.add('labs-intro-out');
      await wait(FADE * 1000);
    }
  } finally {
    window.removeEventListener('keydown', onKey, true);
    window.removeEventListener('resize', fit);
    el.remove();
    document.documentElement.classList.remove('labs-intro-open');
    view?.dispose();
    if (prev && prev !== document.body && prev.isConnected) prev.focus();
    state = 'done'; running = false;
  }
}
