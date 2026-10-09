// Simplified A320-like flight model for the PFD trainer (normal-law flavour). Pure JS, no DOM.
// `step(s, dt)` advances a FlightState in place: autoflight (modes/FD/A/THR) → dynamics → derived values.
// Everything is deliberately simple and tuned for believable behaviour at 64 t, not for accuracy.
import { clamp, wrap360 } from './layout.js';
import { mem, update, refreshGuidance, leverOf, detentOf, stickDisconnect, DETENT } from './autoflight.js';

/** @typedef {import('./schema.js').FlightState & { lever?: number }} Sim */

const rad = (d) => (d * Math.PI) / 180;
const deg = (r) => (r * 180) / Math.PI;
const G_KT = 19.07; // kt/s per g

// ---------------------------------------------------------------------------------------------------------
// Atmosphere (ISA)
// ---------------------------------------------------------------------------------------------------------

function isa(alt) {
  const h = clamp(alt, -1000, 60000);
  let theta;
  let delta;
  if (h <= 36089) {
    theta = 1 - 6.8756e-6 * h;
    delta = Math.pow(theta, 5.2559);
  } else {
    theta = 0.7519;
    delta = 0.22336 * Math.exp(-(h - 36089) / 20806.7);
  }
  return { theta, delta, a: 661.47 * Math.sqrt(theta) };
}

/** Mach from calibrated airspeed (kt) and pressure altitude (ft). */
export function iasToMach(ias, alt) {
  const { delta } = isa(alt);
  const c = Math.max(0, ias) / 661.47;
  const qcp = (Math.pow(1 + 0.2 * c * c, 3.5) - 1) / delta;
  return Math.sqrt(5 * (Math.pow(qcp + 1, 2 / 7) - 1));
}
/** Calibrated airspeed (kt) for a Mach number at altitude. */
export function machToIas(mach, alt) {
  const { delta } = isa(alt);
  const qcp0 = (Math.pow(1 + 0.2 * mach * mach, 3.5) - 1) * delta;
  return 661.47 * Math.sqrt(5 * (Math.pow(qcp0 + 1, 2 / 7) - 1));
}
/** True airspeed (kt). */
export function tasOf(ias, alt) {
  return iasToMach(ias, alt) * isa(alt).a;
}

// ---------------------------------------------------------------------------------------------------------
// Aircraft tables
// ---------------------------------------------------------------------------------------------------------

/** Characteristic speeds at 64 t (1 g, wings level) by flaps configuration. */
export const SPEED_TABLE = {
  '0': { vls: 175, vaProt: 159, vaMax: 150, vmax: 350, s: null, f: null },
  '1': { vls: 150, vaProt: 136, vaMax: 128, vmax: 230, s: 183, f: null },
  '1+F': { vls: 138, vaProt: 125, vaMax: 118, vmax: 215, s: 183, f: null },
  '2': { vls: 132, vaProt: 120, vaMax: 113, vmax: 200, s: 183, f: 158 },
  '3': { vls: 128, vaProt: 117, vaMax: 110, vmax: 185, s: 183, f: 158 },
  FULL: { vls: 124, vaProt: 114, vaMax: 107, vmax: 177, s: 183, f: 158 }
};
export const FLAPS = ['0', '1', '1+F', '2', '3', 'FULL'];
const FLAP_DRAG = { '0': 0, '1': 0.12, '1+F': 0.2, '2': 0.45, '3': 0.7, FULL: 1.0 };
const ALPHA0 = { '0': -1.5, '1': -3, '1+F': -4, '2': -5, '3': -6, FULL: -7 };
const GREEN_DOT = 205;
const V1 = 140;

/** Lift/thrust/drag helpers (all per unit weight). */
function thrustMax(alt, ias) {
  return 0.34 * Math.exp(-Math.max(0, alt) / 32000) * clamp(1 - ias / 900, 0.4, 1);
}
function dragPerW(s, nz) {
  const v = Math.max(s.ias, 60) / 250;
  const a0 = 0.0388 * (1 + (FLAP_DRAG[s.flaps] ?? 0) + (s.gearDown ? 0.7 : 0));
  const a1 = 0.0212;
  return a0 * v * v + (a1 * nz * nz) / (v * v);
}
function loadFactor(s) {
  return clamp(Math.cos(rad(s.fpa)) / Math.max(0.3, Math.cos(rad(s.bank))), 0.3, 2.5);
}
function aoaFor(s, nz) {
  const t = SPEED_TABLE[s.flaps] ?? SPEED_TABLE['0'];
  const a0 = ALPHA0[s.flaps] ?? -1.5;
  const v = Math.max(s.ias, 40);
  return clamp(a0 + (12 - a0) * Math.pow(t.vaMax / v, 2) * nz, -5, 18);
}
function vsToFpa(vs, tas) {
  return deg(Math.asin(clamp(vs / (Math.max(tas, 60) * 101.27), -0.6, 0.6)));
}

/** Injected into autoflight.js (avoids an import cycle). */
export const phys = {
  tas: (s) => Math.max(tasOf(s.ias, s.alt), s.ias, 1),
  thrustMax,
  dragPerW,
  nz: loadFactor,
  vsToFpa,
  machToIas
};

// ---------------------------------------------------------------------------------------------------------
// Derived values
// ---------------------------------------------------------------------------------------------------------

/** Characteristic speeds, mach, RA… from the current state. @param {Sim} s */
export function updateDerived(s) {
  const nz = loadFactor(s);
  const f = Math.sqrt(clamp(nz, 1, 1.6));
  const t = SPEED_TABLE[s.flaps] ?? SPEED_TABLE['0'];
  const sp = s.speeds;
  sp.vls = t.vls * f;
  sp.vaProt = t.vaProt * f;
  sp.vaMax = t.vaMax * f;
  let vmax = t.vmax;
  if (s.flaps === '0') vmax = Math.min(vmax, machToIas(0.82, s.alt));
  if (s.gearDown) vmax = Math.min(vmax, 280);
  sp.vmax = Math.max(vmax, sp.vls + 5);
  sp.greenDot = s.flaps === '0' ? clamp(GREEN_DOT, sp.vls + 5, sp.vmax - 5) : null;
  sp.s = t.s;
  sp.f = t.f;
  sp.v1 = s.scenario === 'takeoff' && s.alt - s.groundElev < 400 ? V1 : null;

  s.mach = iasToMach(s.ias, s.alt);
  const ra = Math.max(0, s.alt - s.groundElev);
  s.radioAlt = ra > 2500 ? null : ra;
  s.track = s.hdg;
}

function sanitize(s) {
  const m = mem(s);
  const fix = (k, lo, hi, dflt) => {
    const v = s[k];
    s[k] = Number.isFinite(v) ? clamp(v, lo, hi) : dflt;
  };
  fix('pitch', -90, 90, 0);
  fix('bank', -180, 180, 0);
  fix('fpa', -90, 90, 0);
  fix('aoa', -10, 25, 3);
  fix('ias', 0, 450, 0);
  fix('iasTrend', -100, 100, 0);
  fix('mach', 0, 1.2, 0);
  fix('alt', -1000, 45000, 0);
  fix('vs', -20000, 20000, 0);
  fix('n1', 0, 110, 20);
  s.hdg = Number.isFinite(s.hdg) ? wrap360(s.hdg) : 0;
  s.track = s.hdg;
  if (!Number.isFinite(m.thrAct)) m.thrAct = 0.3;
  if (!Number.isFinite(m.rollRate)) m.rollRate = 0;
  if (!Number.isFinite(m.fpaRate)) m.fpaRate = 0;
  if (!Number.isFinite(m.aoa)) m.aoa = 3;
  if (!Number.isFinite(m.pos.x) || !Number.isFinite(m.pos.y)) m.pos = { x: 0, y: 0 };
}

const dz = (v, w) => (Math.abs(v) < w ? 0 : v);

// ---------------------------------------------------------------------------------------------------------
// Inputs
// ---------------------------------------------------------------------------------------------------------

/** Pilot sidestick input −1…1; the AP disconnects beyond 0.5. @param {Sim} s */
export function applyStick(s, pitch, roll) {
  s.stick.pitch = clamp(Number.isFinite(pitch) ? pitch : 0, -1, 1);
  s.stick.roll = clamp(Number.isFinite(roll) ? roll : 0, -1, 1);
  stickDisconnect(s);
}

/** @param {Sim} s @param {'IDLE'|'CL'|'FLX'|'TOGA'} detent */
export function applyThrust(s, detent) {
  if (!(detent in DETENT)) return;
  s.thrust = detent;
  s.lever = DETENT[detent];
}
/** Continuous lever 0–1; the detent field follows. @param {Sim} s */
export function applyLever(s, lever) {
  const l = clamp(Number.isFinite(lever) ? lever : 0, 0, 1);
  s.lever = l;
  s.thrust = detentOf(l);
}

/** @param {Sim} s @param {string} cfg */
export function applyFlaps(s, cfg) {
  const m = mem(s);
  let c = cfg === '1' && m.ground ? '1+F' : cfg;
  if (!(c in SPEED_TABLE)) return false;
  if (!m.ground && c === '1+F') c = '1';
  if (!m.ground && s.ias > SPEED_TABLE[c].vmax + 5) return false;
  s.flaps = /** @type {any} */ (c);
  updateDerived(s);
  return true;
}
/** @param {Sim} s */
export function toggleGear(s) {
  const m = mem(s);
  if (s.gearDown) {
    if (!m.ground && s.ias <= 280) s.gearDown = false;
  } else if (s.ias <= 280) s.gearDown = true;
  updateDerived(s);
}

/** Thrust fraction that holds the given flight path angle in steady flight. @param {Sim} s */
export function trimThrust(s, fpa = 0) {
  const Dw = dragPerW(s, Math.cos(rad(fpa)));
  return clamp((Dw + Math.sin(rad(fpa))) / thrustMax(s.alt, s.ias), 0, 1);
}

/** Make derived values, attitude and the FMA consistent with the current numbers (after loading a scenario). @param {Sim} s */
export function refresh(s) {
  const m = mem(s);
  updateDerived(s);
  m.aoa = aoaFor(s, loadFactor(s));
  s.aoa = m.aoa;
  s.pitch = m.ground ? s.pitch : s.fpa + s.aoa;
  s.vs = m.ground ? 0 : phys.tas(s) * 101.27 * Math.sin(rad(s.fpa));
  m.iasPrev = s.ias;
  m.iasAcc = 0;
  s.iasTrend = 0;
  s.n1 = 22 + 78 * Math.pow(clamp(m.thrAct, 0, 1), 0.75);
  s.track = s.hdg;
  refreshGuidance(s, phys);
}

// ---------------------------------------------------------------------------------------------------------
// Step
// ---------------------------------------------------------------------------------------------------------

/**
 * Advance the simulation by dt seconds (use ≤ 0.1; the store uses 1/30).
 * @param {Sim} s
 * @param {number} dt
 */
export function step(s, dt) {
  if (s.paused || !(dt > 0)) return;
  dt = Math.min(dt, 0.1);
  const m = mem(s);
  stickDisconnect(s);
  s.simTime += dt;

  const cmd = update(s, dt, phys);
  const ap = !!(s.fcu.ap1 || s.fcu.ap2);

  // thrust spool and N1
  m.thrAct += (cmd.thrust - m.thrAct) * (1 - Math.exp(-dt / 2.5));
  s.n1 = 22 + 78 * Math.pow(clamp(m.thrAct, 0, 1), 0.75);

  if (m.ground) groundStep(s, m, dt);
  else airStep(s, m, dt, cmd, ap);

  // speed trend (prediction over 10 s)
  if (m.iasPrev === null) m.iasPrev = s.ias;
  const acc = (s.ias - m.iasPrev) / dt;
  m.iasAcc += (acc - m.iasAcc) * (1 - Math.exp(-dt / 2));
  m.iasPrev = s.ias;
  s.iasTrend = clamp(m.iasAcc * 10, -80, 80);

  updateDerived(s);
  sanitize(s);
}

function advancePosition(s, m, dt, tas) {
  const h = rad(s.hdg);
  m.pos.x += (tas / 3600) * Math.sin(h) * dt;
  m.pos.y += (tas / 3600) * Math.cos(h) * dt;
}

function airStep(s, m, dt, cmd, ap) {
  const tas = phys.tas(s);
  const sp = s.speeds;

  // ---- roll
  let rollCmd;
  if (ap && cmd.bank !== null) {
    rollCmd = clamp((cmd.bank - s.bank) * 1.2, -5, 5);
  } else {
    const r = dz(s.stick.roll, 0.03);
    if (r !== 0) rollCmd = Math.abs(s.bank) >= 67 && Math.sign(r) === Math.sign(s.bank) ? 0 : r * 15;
    else if (Math.abs(s.bank) > 33) rollCmd = -Math.sign(s.bank) * Math.min(5, (Math.abs(s.bank) - 33) * 2);
    else rollCmd = 0;
  }
  m.rollRate += (rollCmd - m.rollRate) * (1 - Math.exp(-dt / 0.25));
  s.bank = clamp(s.bank + m.rollRate * dt, -67, 67);

  // ---- pitch (flight-path rate)
  let fpaCmd;
  if (ap && cmd.fpa !== null) {
    fpaCmd = clamp((cmd.fpa - s.fpa) * 1.0, -2.5, 2.5);
  } else {
    const p = dz(s.stick.pitch, 0.03);
    const kv = clamp(250 / Math.max(s.ias, 120), 0.7, 1.6);
    fpaCmd = p > 0 ? p * 4.5 * kv : p * 3.5 * kv;
  }
  if (s.ias < sp.vaMax) fpaCmd = Math.min(fpaCmd, 0) - (sp.vaMax - s.ias) * 0.3; // alpha-max protection
  if (s.ias > sp.vmax) fpaCmd = Math.max(fpaCmd, (s.ias - sp.vmax) * 0.15); // overspeed nose-up
  m.fpaRate += (fpaCmd - m.fpaRate) * (1 - Math.exp(-dt / 0.35));
  s.fpa = clamp(s.fpa + m.fpaRate * dt, -45, 45);
  if (s.alt >= 41000 && s.fpa > 0) s.fpa = 0;

  // ---- load factor, AoA, pitch limits
  const tasMs = tas * 0.5144;
  const nz = clamp(loadFactor(s) + (rad(m.fpaRate) * tasMs) / 9.81, 0.2, 2.5);
  m.aoa += (aoaFor(s, nz) - m.aoa) * (1 - Math.exp(-dt / 0.3));
  s.aoa = m.aoa;
  if (s.fpa + s.aoa > 30) {
    s.fpa = 30 - s.aoa;
    if (m.fpaRate > 0) m.fpaRate = 0;
  } else if (s.fpa + s.aoa < -15) {
    s.fpa = -15 - s.aoa;
    if (m.fpaRate < 0) m.fpaRate = 0;
  }
  s.pitch = s.fpa + s.aoa;

  // ---- speed
  const Tw = thrustMax(s.alt, s.ias) * m.thrAct;
  const Dw = dragPerW(s, nz);
  const dTas = G_KT * (Tw - Dw - Math.sin(rad(s.fpa)));
  const ratio = Math.max(1, tas / Math.max(s.ias, 30));
  s.ias = clamp(s.ias + (dTas / ratio) * dt, 0, 400);

  // ---- vertical
  s.vs = tas * 101.27 * Math.sin(rad(s.fpa));
  s.alt += (s.vs / 60) * dt;

  // ---- heading and position
  const hdgRate = (1091 * Math.tan(rad(s.bank))) / Math.max(tas, 60);
  s.hdg = wrap360(s.hdg + hdgRate * dt);
  s.track = s.hdg;
  advancePosition(s, m, dt, tas);

  // ---- touchdown
  if (s.alt <= s.groundElev) {
    s.alt = s.groundElev;
    m.ground = true;
    m.toPhase = false;
    s.fpa = 0;
    s.vs = 0;
    m.fpaRate = 0;
    s.fcu.ap1 = false;
    s.fcu.ap2 = false;
    s.lever = 0; // retard
    s.thrust = 'IDLE';
  }
}

function groundStep(s, m, dt) {
  const Tw = thrustMax(s.alt, s.ias) * m.thrAct;
  const Dw = dragPerW(s, 0);
  const fric = m.thrAct < 0.08 ? 0.07 : 0.025;
  const dV = s.ias > 0.5 ? G_KT * (Tw - Dw - fric) : Math.max(0, G_KT * (Tw - Dw - fric));
  s.ias = clamp(s.ias + dV * dt, 0, 400);

  // rotation: nose up with back stick above ~60 kt, nose wheel drops back when released
  const p = dz(s.stick.pitch, 0.05);
  if (p > 0 && s.ias > 60) s.pitch += p * 3 * dt;
  else s.pitch -= 3 * dt;
  s.pitch = clamp(s.pitch, 0, 20);
  m.aoa = aoaFor(s, 1);
  s.aoa = m.aoa;

  s.bank *= Math.exp(-2 * dt);
  m.rollRate = 0;
  s.alt = s.groundElev;
  s.vs = 0;
  s.fpa = 0;

  // lift-off
  if (s.ias > 100 && s.pitch - s.aoa > 0.5 && Tw >= 0) {
    m.ground = false;
    s.fpa = clamp(s.pitch - s.aoa, 0.5, 15);
    m.fpaRate = 0;
    s.pitch = s.fpa + s.aoa;
  }
  advancePosition(s, m, dt, s.ias);
}

export { leverOf };
