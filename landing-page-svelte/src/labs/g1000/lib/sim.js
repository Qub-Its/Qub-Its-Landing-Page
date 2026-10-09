// Kinematic C172 flown by the "instructor": it follows the HDG bug, or the active guidance (GPS leg/Direct-To/OBS or
// VOR course) in auto mode, and holds the selected (indicated) altitude. Also runs the power-up timeline and
// flight plan sequencing. Pure: mutates the plain state passed in.
import { destination, angleDiff, norm360, distNm, turnAnticipationNm, brgDeg } from './nav.js';
import { QNH, byId } from './world.js';
import { guidance } from './guidance.js';

export const DT = 0.05; // fixed step (s)
const TURN_RATE = 3; // °/s, standard rate
const KT_MS = 0.5144;

/** Display boot (s), ADC valid after (s), AHRS aligned after (s) — shortened from real life for the course. */
export const POWER_TIMES = { boot: 3, adc: 6, ahrs: 13 };

/** @param {'pfd'|'mfd'} gdu @returns {'off'|'boot'|'db'|'ready'} */
export function gduPhase(s, gdu) {
  const on = gdu === 'pfd' ? s.power.pfdOn : s.power.mfdOn;
  if (on == null) return 'off';
  if (s.t - on < POWER_TIMES.boot) return 'boot';
  if (gdu === 'mfd' && !s.power.dbOk) return 'db';
  return 'ready';
}
const upFor = (s, secs) => gduPhase(s, 'pfd') === 'ready' && s.t - /** @type {number} */ (s.power.pfdOn) >= secs;
export const adcValid = (s) => upFor(s, POWER_TIMES.adc);
export const ahrsValid = (s) => upFor(s, POWER_TIMES.ahrs);

/** Recomputes display power after a switch change: MASTER feeds the PFD, MASTER + AVIONICS the MFD. */
export function applyPower(s) {
  const p = s.power;
  if (!p.master) p.engine = false;
  p.pfdOn = p.master ? (p.pfdOn ?? s.t) : null;
  p.mfdOn = p.master && p.avionics ? (p.mfdOn ?? s.t) : null;
  if (p.mfdOn == null) p.dbOk = false;
}

/** Altimeter reading for a true altitude with the selected baro setting. */
export const indicatedAlt = (s) => s.ac.alt + (s.sel.baro - QNH) * 1000;

/** Track the instructor wants to fly: null = fly the HDG bug. */
export function targetTrack(s) {
  if (s.pilot.mode === 'hdg') return null;
  const g = guidance(s);
  if (!g.valid) return null;
  // Intercept: 25° per NM of cross-track, at most 40°, toward the course.
  return norm360(g.dtk - Math.max(-40, Math.min(40, g.xtk * 25)));
}

/** Advances the state by `dt` seconds (call with DT; the store accumulates frame time). */
export function step(s, dt = DT) {
  s.t += dt;
  if (s.xpdr.ident > 0) s.xpdr.ident = Math.max(0, s.xpdr.ident - dt);
  const ac = s.ac;
  const rpmTarget = !s.power.engine ? 0 : ac.onGround ? 1000 : ac.vs > 200 ? 2500 : ac.vs < -200 ? 2000 : 2400;
  ac.rpm += Math.max(-400 * dt, Math.min(400 * dt, rpmTarget - ac.rpm));
  if (s.power.engine) ac.fuel = Math.max(0, ac.fuel - ((ac.onGround ? 2.5 : 8.5) / 3600) * dt);
  if (ac.onGround) return;

  // Heading: steer to the HDG bug, or to the heading that makes good the target track (wind correction).
  const trk = targetTrack(s);
  const wca = (t) => {
    const xw = s.wind.kt * Math.sin(((s.wind.dir - t) * Math.PI) / 180);
    return (Math.asin(Math.max(-1, Math.min(1, xw / Math.max(ac.tas, 1)))) * 180) / Math.PI;
  };
  const hdgTarget = trk == null ? s.sel.hdg : norm360(trk + wca(trk));
  const err = angleDiff(hdgTarget, ac.hdg);
  const turn = Math.max(-TURN_RATE * dt, Math.min(TURN_RATE * dt, err * 0.8 * dt));
  ac.hdg = norm360(ac.hdg + turn);
  const rate = ((turn / dt) * Math.PI) / 180;
  const bankTarget = (Math.atan((ac.tas * KT_MS * rate) / 9.81) * 180) / Math.PI;
  ac.bank += (bankTarget - ac.bank) * Math.min(1, 2 * dt);

  // Vertical: capture the selected indicated altitude (500 fpm down, 700 fpm up, smooth capture).
  const diff = s.sel.alt - indicatedAlt(s);
  const vsTarget = Math.max(-500, Math.min(700, diff * 6));
  ac.vs += (vsTarget - ac.vs) * Math.min(1, 1.5 * dt);
  ac.alt += (ac.vs / 60) * dt;
  ac.pitch = 2 + ac.vs / 250;
  const iasTarget = ac.vs > 200 ? 75 : ac.vs < -200 ? 115 : 110;
  ac.ias += (iasTarget - ac.ias) * Math.min(1, 0.5 * dt);
  ac.tas = ac.ias * (1 + (0.02 * ac.alt) / 1000);

  // Ground vector = air vector + wind (wind blows FROM dir).
  const h = (ac.hdg * Math.PI) / 180, w = ((s.wind.dir + 180) * Math.PI) / 180;
  const vx = ac.tas * Math.sin(h) + s.wind.kt * Math.sin(w), vy = ac.tas * Math.cos(h) + s.wind.kt * Math.cos(w);
  ac.gs = Math.hypot(vx, vy);
  ac.trk = norm360((Math.atan2(vx, vy) * 180) / Math.PI);
  Object.assign(ac, destination(ac, ac.trk, (ac.gs * dt) / 3600));

  sequence(s);
}

/** Flight plan sequencing with turn anticipation (not in OBS mode). Direct-To to an FPL waypoint rejoins the plan. */
export function sequence(s) {
  const { fpl } = s.gps;
  if (s.pfd.obs || fpl.active < 1 || fpl.active >= fpl.legs.length) return;
  const to = byId(fpl.legs[fpl.active]);
  if (!to) return;
  if (s.gps.dto && s.gps.dto.id !== to.id) return; // off-plan Direct-To
  const last = fpl.active === fpl.legs.length - 1;
  const next = last ? null : byId(fpl.legs[fpl.active + 1]);
  const d = distNm(s.ac, to);
  const lead = next ? turnAnticipationNm(s.ac.gs, angleDiff(brgDeg(to, next), s.ac.trk)) : 0;
  if (next && d <= Math.max(lead, 0.2)) {
    fpl.active += 1;
    s.gps.dto = null;
  }
}
