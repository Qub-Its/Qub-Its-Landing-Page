// Reactive store of the G1000 course: the only module here that uses runes. Wraps the plain state of state.js,
// runs the fixed-step sim loop, routes control events through avionics.dispatch and reports their toast messages.
import { createState } from './state.js';
import { dispatch } from './avionics.js';
import { step, DT } from './sim.js';

export const g = $state(createState('enroute'));

/** UI-only state: the bezel control being "pressed" by a demo (for the flash), the last GDU touched. */
export const ui = $state({ flash: /** @type {string|null} */ (null), gdu: /** @type {'pfd'|'mfd'} */ ('pfd') });

/** @type {(msg: string) => void} */
let onMsg = () => {};
export function onMessage(fn) { onMsg = fn; }

/** Sends one control event; returns its message key (also reported to the onMessage listener). */
export function send(ev) {
  if ('gdu' in ev && ev.gdu) ui.gdu = ev.gdu;
  const msg = dispatch(g, ev);
  if (msg) onMsg(msg);
  return msg;
}

/** Replaces the whole state with a scenario, then applies an optional patch (a task setup). */
export function reset(scenario = 'enroute', apply) {
  const fresh = createState(scenario);
  apply?.(fresh);
  for (const k of Object.keys(fresh)) g[k] = fresh[k];
}

/** Runs the sim forward `secs` seconds at once (demo "wait" steps). */
export function fastForward(secs) {
  for (let i = 0; i < Math.round(secs / DT); i++) step(g, DT);
}

let raf = /** @type {number|null} */ (null);
let last = 0, acc = 0;
export function startLoop() {
  if (raf != null || typeof requestAnimationFrame !== 'function') return;
  last = performance.now();
  const tick = (now) => {
    acc = Math.min(acc + (now - last) / 1000, 0.25);
    last = now;
    while (acc >= DT) { step(g, DT); acc -= DT; }
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
}
export function stopLoop() {
  if (raf != null) cancelAnimationFrame(raf);
  raf = null;
}
