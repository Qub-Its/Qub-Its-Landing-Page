// Reactive flight store (Svelte 5 runes). The simulation itself is plain JS (sim.js / autoflight.js / scenarios.js);
// this module owns the single reactive FlightState, the fixed-step loop and the FCU / control entry points.
import { createInitialState } from './schema.js';
import { step, applyStick, applyThrust, applyLever, applyFlaps, toggleGear } from './sim.js';
import { applyScenario, SCENARIO_LIST } from './scenarios.js';
import { fcuOps } from './autoflight.js';

const DT = 1 / 30;
const MAX_STEPS_PER_FRAME = 8;

/** Single reactive state, mutated in place and never reassigned. `lever` (0–1) is an extra field beyond the schema. */
export const flight = $state({ ...createInitialState(), lever: 0.8 });
applyScenario(flight, 'cruise');

export const SCENARIOS = SCENARIO_LIST;

/** @type {Set<(s: typeof flight, dt: number) => void>} */
const listeners = new Set();

let raf = 0;
let running = false;
let last = 0;
let acc = 0;

function frame(now) {
  if (!running) return;
  raf = requestAnimationFrame(frame);
  if (document.hidden || !last) {
    last = now;
    return;
  }
  const elapsed = Math.min((now - last) / 1000, 0.25);
  last = now;
  if (flight.paused) return;
  acc += elapsed;
  let n = 0;
  while (acc >= DT && n < MAX_STEPS_PER_FRAME) {
    step(flight, DT);
    for (const fn of listeners) fn(flight, DT);
    acc -= DT;
    n++;
  }
  if (n === MAX_STEPS_PER_FRAME) acc = 0;
}

function onVisibility() {
  last = 0;
  acc = 0;
}

export function start() {
  if (running) return;
  running = true;
  last = 0;
  acc = 0;
  document.addEventListener('visibilitychange', onVisibility);
  raf = requestAnimationFrame(frame);
}

export function stop() {
  running = false;
  if (raf) cancelAnimationFrame(raf);
  raf = 0;
  document.removeEventListener('visibilitychange', onVisibility);
}

export function togglePause() {
  flight.paused = !flight.paused;
}

/** @param {string} id */
export function loadScenario(id) {
  applyScenario(flight, id);
  acc = 0;
}

/** Sidestick −1…1 (+ pitch = pull, + roll = right). The AP disconnects beyond 0.5. */
export function setStick(pitch, roll) {
  applyStick(flight, pitch, roll);
}

/** @param {'IDLE'|'CL'|'FLX'|'TOGA'} detent */
export function setThrust(detent) {
  applyThrust(flight, detent);
}

/** Extra (not in the plan): continuous lever 0–1; `flight.thrust` follows as the nearest detent class. */
export function setLever(lever) {
  applyLever(flight, lever);
}

/** Extra: flaps lever ('0' | '1' | '2' | '3' | 'FULL'; '1' on the ground selects 1+F). Returns false when refused (overspeed). */
export function setFlaps(cfg) {
  return applyFlaps(flight, cfg);
}

/** Extra: landing gear toggle (refused above 280 kt). */
export function toggleGearLever() {
  toggleGear(flight);
}

/** @param {(s: typeof flight, dt: number) => void} fn @returns {() => void} unsubscribe */
export function onTick(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** FCU actions bound to the reactive state. */
export const fcu = /** @type {{[K in keyof typeof fcuOps]: (...args: any[]) => void}} */ (
  Object.fromEntries(Object.entries(fcuOps).map(([k, fn]) => [k, (...args) => fn(flight, ...args)]))
);
