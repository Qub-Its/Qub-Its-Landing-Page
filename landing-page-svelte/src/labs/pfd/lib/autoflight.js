// Autoflight for the PFD trainer: FMGC-like mode logic, FD commands, A/THR and the FMA text. Pure JS, no DOM.
// `update(s, dt, phys)` is called by sim.js `step()` once per step, before the aircraft dynamics. It manages the
// modes (SRS/RWY, HDG/NAV/LOC*/LOC, ALT/ALT*/OP CLB/OP DES/CLB/DES/V/S/G/S*/G/S), fills `s.fma`, `s.fd`, `s.ils`
// and returns the commands the dynamics follow: { bank, fpa, thrust } (bank/fpa = null → no guidance).
// Physics helpers come in through `phys` (injected by sim.js) so there is no import cycle.
//
// Internal (non-schema) data lives in a WeakMap keyed by the state object (see `mem`), except `s.lever`
// (continuous thrust lever 0–1, optional extra field; falls back to the detent value).
import { clamp, wrap360, angleDiff } from './layout.js';

/** @typedef {import('./schema.js').FlightState & { lever?: number }} Sim */

const rad = (d) => (d * Math.PI) / 180;
const deg = (r) => (r * 180) / Math.PI;
const G_KT = 19.07; // kt/s per g

export const DETENT = { IDLE: 0, CL: 0.8, FLX: 0.92, TOGA: 1 };
const CL_MAX = 0.85; // lever positions above this are FLX/TOGA (manual thrust)

/** Thrust lever 0–1 (continuous when `lever` is set, else the detent value). @param {Sim} s */
export function leverOf(s) {
  if (Number.isFinite(s.lever)) return clamp(/** @type {number} */ (s.lever), 0, 1);
  return DETENT[s.thrust] ?? DETENT.CL;
}
/** Detent class for a lever position. @param {number} l @returns {'IDLE'|'CL'|'FLX'|'TOGA'} */
export function detentOf(l) {
  if (l < 0.04) return 'IDLE';
  if (l <= CL_MAX) return 'CL';
  if (l <= 0.96) return 'FLX';
  return 'TOGA';
}

// ---------------------------------------------------------------------------------------------------------
// Internal memory
// ---------------------------------------------------------------------------------------------------------

const WM = new WeakMap();
function freshMem() {
  return {
    vert: '', // SRS | CLB | OPCLB | DES | OPDES | ALT* | ALT | VS | GS* | GS
    lat: '', // RWY | NAV | HDG | LOC* | LOC
    altHold: 0,
    navHdg: 90,
    rwyHdg: 90,
    v2: 150,
    pos: { x: 0, y: 0 }, // NM east / north of the runway threshold
    ils: /** @type {null | {course: number, gs: number}} */ (null),
    ilsShown: false,
    ilsGeom: /** @type {any} */ (null),
    thrAct: 0.3, // actual thrust fraction (spooled)
    rollRate: 0,
    fpaRate: 0,
    aoa: 3,
    iasPrev: /** @type {number|null} */ (null),
    iasAcc: 0,
    ground: false,
    toPhase: false,
    gsT: 0,
    locT: 0,
    prevEng: '',
    athrActive: false
  };
}
/** @param {object} s */
export function mem(s) {
  let m = WM.get(s);
  if (!m) {
    m = freshMem();
    WM.set(s, m);
  }
  return m;
}
/** @param {object} s */
export function resetMem(s) {
  const m = freshMem();
  WM.set(s, m);
  return m;
}

// ---------------------------------------------------------------------------------------------------------
// ILS geometry (localizer course through the runway threshold at the origin, 3° glideslope)
// ---------------------------------------------------------------------------------------------------------

/** @param {Sim} s @param {ReturnType<typeof freshMem>} m */
function ilsGeom(s, m) {
  const I = m.ils;
  if (!I) return null;
  const c = rad(I.course);
  const px = m.pos.x;
  const py = m.pos.y;
  const u = px * Math.sin(c) + py * Math.cos(c);
  const v = px * Math.cos(c) - py * Math.sin(c); // + = right of the course
  const dist = -u;
  const prev = m.ilsGeom;
  if (dist < 0.3 && prev) return prev; // past the antenna: freeze
  const ang = deg(Math.atan2(v, Math.max(dist, 0.05)));
  const height = Math.max(0, s.alt - s.groundElev);
  const gsAng = deg(Math.atan2(height, Math.max(dist, 0.05) * 6076));
  const g = {
    dist,
    y: v,
    course: I.course,
    locDev: clamp(-ang / 1.25, -2, 2),
    gsDev: clamp((I.gs - gsAng) / 0.35, -2, 2)
  };
  m.ilsGeom = g;
  return g;
}

// ---------------------------------------------------------------------------------------------------------
// Targets
// ---------------------------------------------------------------------------------------------------------

/** @param {Sim} s */
function managedIas(s) {
  if (s.flaps !== '0') return (s.speeds.vls ?? 140) + 12;
  const prof = s.alt < 10000 ? 250 : 300;
  return prof;
}

/** Target IAS (kt). @param {Sim} s @param {ReturnType<typeof freshMem>} m */
function targetIas(s, m, phys) {
  const f = s.fcu;
  let t;
  if (m.vert === 'SRS') t = m.v2 + 10;
  else if (f.spdIsMach) t = phys.machToIas(f.spdManaged ? 0.78 : f.mach, s.alt);
  else t = f.spdManaged ? managedIas(s) : f.spd;
  if (f.spdManaged && !f.spdIsMach && m.vert !== 'SRS') t = Math.min(t, phys.machToIas(0.78, s.alt));
  const lo = s.speeds.vls ?? 100;
  const hi = (s.speeds.vmax ?? 350) - 5;
  return clamp(t, Math.min(lo, hi), hi);
}

/** Flight-path angle that holds `tgt` IAS on the elevator with the thrust actually applied. */
function speedHoldFpa(s, m, phys, tgt) {
  const ias = Math.max(s.ias, 40);
  const tasr = Math.max(1, phys.tas(s) / ias);
  const aD = clamp(0.25 * (tgt - s.ias), -2, 2);
  const Tw = phys.thrustMax(s.alt, s.ias) * m.thrAct;
  const Dw = phys.dragPerW(s, phys.nz(s));
  const sin = clamp(Tw - Dw - (aD * tasr) / G_KT, -0.5, 0.5);
  return deg(Math.asin(sin));
}

function bankFromPsi(s, phys, psi) {
  const d = angleDiff(psi, s.hdg);
  const wd = clamp(0.35 * d, -3, 3); // wanted turn rate °/s
  const tas = Math.max(phys.tas(s), 80);
  return clamp(deg(Math.atan((wd * tas) / 1091)), -25, 25);
}

// ---------------------------------------------------------------------------------------------------------
// Mode management
// ---------------------------------------------------------------------------------------------------------

const guidanceOn = (s) => s.fcu.ap1 || s.fcu.ap2 || s.fcu.fd;
const apOn = (s) => s.fcu.ap1 || s.fcu.ap2;

function setVsMode(s, m, vs) {
  m.vert = 'VS';
  s.fcu.vs = clamp(Math.round(vs / 100) * 100, -6000, 6000);
  s.fcu.vsActive = true;
}

/** @param {Sim} s */
function manage(s, m, dt, phys) {
  const f = s.fcu;
  const guid = guidanceOn(s);
  const ra = s.alt - s.groundElev;
  const geo = ilsGeom(s, m);
  if (geo && m.ilsShown) {
    s.ils.loc = geo.locDev;
    s.ils.gs = geo.gsDev;
  }
  s.ils.visible = m.ilsShown;

  // ---- ground: takeoff roll
  if (m.ground) {
    const lev = leverOf(s);
    if (guid && lev >= 0.9 && !m.toPhase) {
      m.toPhase = true;
      m.rwyHdg = s.hdg;
      m.navHdg = s.hdg;
    }
    if (m.toPhase && lev < 0.1 && s.ias < 40) m.toPhase = false;
    if (m.toPhase && guid) {
      m.vert = 'SRS';
      m.lat = 'RWY';
    } else {
      m.vert = '';
      m.lat = '';
    }
    return;
  }

  // ---- airborne
  if (!guid) {
    m.vert = '';
    m.lat = '';
    if (f.vsActive) {
      f.vsActive = false;
      f.vs = 0;
    }
    return;
  }
  if (m.lat === 'RWY' && ra > 30) m.lat = f.hdgManaged ? 'NAV' : 'HDG';
  if (m.vert === 'SRS' && ra >= 1500) {
    m.toPhase = false;
    const e = f.alt - s.alt;
    if (e > 150) m.vert = f.hdgManaged ? 'CLB' : 'OPCLB';
    else if (e < -150) m.vert = f.hdgManaged ? 'DES' : 'OPDES';
    else m.vert = 'ALT*';
  }
  if (m.vert === '') setVsMode(s, m, s.vs);
  if (m.lat === '') m.lat = f.hdgManaged ? 'NAV' : 'HDG';

  // ---- localizer
  const wantLoc = f.loc || f.appr;
  if (geo && wantLoc && (m.lat === 'HDG' || m.lat === 'NAV')) {
    const tasNmS = phys.tas(s) / 3600;
    const vLat = tasNmS * Math.sin(rad(angleDiff(s.track, geo.course))); // + = moving to the right
    const toward = geo.y * vLat <= 0;
    if (geo.dist > 0.5 && toward && Math.abs(geo.y) <= Math.max(0.12, Math.abs(vLat) * 9)) {
      m.lat = 'LOC*';
      m.locT = 0;
    }
  }
  if (m.lat === 'LOC*') {
    m.locT += dt;
    if (geo && ((Math.abs(geo.y) < 0.05 && Math.abs(angleDiff(s.track, geo.course)) < 4) || m.locT > 25)) m.lat = 'LOC';
  }
  if ((m.lat === 'LOC*' || m.lat === 'LOC') && (!wantLoc || !geo)) m.lat = f.hdgManaged ? 'NAV' : 'HDG';

  // ---- glideslope
  if (f.appr && geo && (m.lat === 'LOC*' || m.lat === 'LOC') && m.vert !== 'GS*' && m.vert !== 'GS') {
    if (Math.abs(geo.gsDev) < 0.5 && geo.dist > 1) {
      m.vert = 'GS*';
      m.gsT = 0;
    }
  }
  if (m.vert === 'GS*') {
    m.gsT += dt;
    if (geo && (Math.abs(geo.gsDev) < 0.15 || m.gsT > 10)) m.vert = 'GS';
  }
  if ((m.vert === 'GS*' || m.vert === 'GS') && (!f.appr || !geo)) setVsMode(s, m, s.vs);

  // ---- altitude capture
  const err = f.alt - s.alt;
  if (m.vert === 'OPCLB' || m.vert === 'CLB') {
    if (err < -30) setVsMode(s, m, s.vs);
  } else if (m.vert === 'OPDES' || m.vert === 'DES') {
    if (err > 30) setVsMode(s, m, s.vs);
  }
  if (m.vert === 'VS' || m.vert === 'OPCLB' || m.vert === 'OPDES' || m.vert === 'CLB' || m.vert === 'DES') {
    const cap = Math.max(120, Math.abs(s.vs) / 4.5);
    if (Math.abs(s.vs) >= 100 && Math.abs(err) <= cap && Math.sign(err) === Math.sign(s.vs)) m.vert = 'ALT*';
  }
  if (m.vert === 'ALT*' && Math.abs(err) < 40) {
    m.vert = 'ALT';
    m.altHold = f.alt;
  }
  if (m.vert !== 'VS' && f.vsActive) {
    f.vsActive = false;
    f.vs = 0;
  }
}

// ---------------------------------------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------------------------------------

function lateralBank(s, m, phys) {
  const geo = m.ilsGeom;
  switch (m.lat) {
    case 'HDG':
      return bankFromPsi(s, phys, s.fcu.hdg);
    case 'NAV':
      return bankFromPsi(s, phys, m.navHdg);
    case 'RWY':
      return m.ground ? 0 : bankFromPsi(s, phys, m.rwyHdg);
    case 'LOC*':
    case 'LOC':
      return geo ? bankFromPsi(s, phys, geo.course - clamp(geo.y * 40, -30, 30)) : bankFromPsi(s, phys, s.hdg);
    default:
      return null;
  }
}

function verticalFpa(s, m, phys, tgt) {
  const tas = phys.tas(s);
  const f = s.fcu;
  switch (m.vert) {
    case 'SRS': {
      const aoa = m.aoa;
      return Math.min(speedHoldFpa(s, m, phys, tgt), 18 - aoa);
    }
    case 'CLB':
    case 'OPCLB':
    case 'DES':
    case 'OPDES':
      return clamp(speedHoldFpa(s, m, phys, tgt), -15, 25);
    case 'ALT':
      return phys.vsToFpa(clamp((m.altHold - s.alt) * 4, -1000, 1000), tas);
    case 'ALT*':
      return phys.vsToFpa(clamp((f.alt - s.alt) * 3.5, -2500, 2500), tas);
    case 'VS':
      return phys.vsToFpa(f.vs, tas);
    case 'GS*':
    case 'GS': {
      const dev = m.ilsGeom ? m.ilsGeom.gsDev : 0;
      return clamp(-(m.ils?.gs ?? 3) + 1.2 * dev, -6, 0);
    }
    default:
      return null;
  }
}

/** A/THR: returns { thrust, mode ('' | 'MAN' | 'SPEED' | 'THR CLB' | 'THR IDLE') } */
function thrustLaw(s, m, phys, tgt) {
  const f = s.fcu;
  const lev = leverOf(s);
  if (m.ground || !f.athr || lev > CL_MAX) {
    m.athrActive = false;
    return { thrust: lev, mode: !m.ground && !f.athr ? '' : 'MAN' };
  }
  m.athrActive = true;
  if (m.vert === 'SRS' || m.vert === 'CLB' || m.vert === 'OPCLB') return { thrust: Math.min(DETENT.CL, lev), mode: 'THR CLB' };
  if (m.vert === 'DES' || m.vert === 'OPDES') return { thrust: 0, mode: 'THR IDLE' };
  const ias = Math.max(s.ias, 40);
  const tasr = Math.max(1, phys.tas(s) / ias);
  const aD = clamp(0.25 * (tgt - s.ias), -2, 2);
  const Dw = phys.dragPerW(s, phys.nz(s));
  const Tw = Dw + Math.sin(rad(s.fpa)) + (aD * tasr) / G_KT;
  const l = Tw / Math.max(0.03, phys.thrustMax(s.alt, s.ias));
  return { thrust: clamp(l, 0, lev), mode: 'SPEED' };
}

// ---------------------------------------------------------------------------------------------------------
// FMA
// ---------------------------------------------------------------------------------------------------------

const VERT_TEXT = { SRS: 'SRS', CLB: 'CLB', OPCLB: 'OP CLB', DES: 'DES', OPDES: 'OP DES', 'ALT*': 'ALT*', ALT: 'ALT', 'GS*': 'G/S*', GS: 'G/S' };

function vsText(vs) {
  const v = Math.round(Math.abs(vs) / 100) * 100;
  return v === 0 ? 'V/S 0' : `V/S ${vs < 0 ? '-' : '+'}${v}`;
}

/** @param {Sim} s */
function updateFma(s, m, athrMode) {
  const f = s.fcu;
  const fma = s.fma;
  const guid = guidanceOn(s);
  const lev = leverOf(s);

  let athr = '';
  if (m.ground) athr = lev >= 0.9 ? (lev > 0.96 ? 'MAN TOGA' : 'MAN FLX') : '';
  else if (f.athr) {
    if (lev > CL_MAX) athr = lev > 0.96 ? 'MAN TOGA' : 'MAN FLX';
    else if (athrMode === 'SPEED') athr = f.spdIsMach ? 'MACH' : 'SPEED';
    else athr = athrMode;
  }

  const vertical = !guid ? '' : m.vert === 'VS' ? vsText(f.vs) : (VERT_TEXT[m.vert] ?? '');
  const lateral = !guid ? '' : m.lat === 'LOC*' ? 'LOC*' : m.lat;

  let vertArmed = '';
  if (guid && !m.ground) {
    if (f.appr && m.vert !== 'GS' && m.vert !== 'GS*' && m.ils) vertArmed = 'G/S';
    else if (['VS', 'OPCLB', 'OPDES', 'CLB', 'DES'].includes(m.vert) && Math.abs(s.vs) >= 100 && Math.sign(f.alt - s.alt) === Math.sign(s.vs)) vertArmed = 'ALT';
  }
  let latArmed = '';
  if (guid && !m.ground) {
    if ((f.loc || f.appr) && m.ils && m.lat !== 'LOC' && m.lat !== 'LOC*') latArmed = 'LOC';
  } else if (guid && m.ground && f.hdgManaged && m.toPhase) latArmed = 'NAV';

  const approach = guid && f.appr && m.ils ? (f.ap1 && f.ap2 ? 'CAT 3 DUAL' : 'CAT 1') : '';

  let message = '';
  if (!m.ground && f.athr) {
    if (athrMode === 'THR CLB' && lev < DETENT.CL - 0.01) message = 'LVR CLB';
    else if (lev > CL_MAX && s.alt - s.groundElev >= 1500 && (m.vert === 'CLB' || m.vert === 'OPCLB' || m.vert === 'ALT*' || m.vert === 'ALT')) message = 'LVR CLB';
  }

  const ap = f.ap1 && f.ap2 ? 'AP1+2' : f.ap1 ? 'AP1' : f.ap2 ? 'AP2' : '';
  const athrActive = m.athrActive && f.athr;
  const eng = { ap, fd: f.fd ? '1 FD 2' : '', athr: f.athr ? 'A/THR' : '', athrArmed: f.athr && !athrActive };
  const engKey = `${eng.ap}|${eng.fd}|${eng.athr}|${eng.athrArmed}`;

  const t = s.simTime;
  if (fma.athr !== athr) fma.changedAt.athr = t;
  if (fma.vertical !== vertical) fma.changedAt.vertical = t;
  if (fma.lateral !== lateral) fma.changedAt.lateral = t;
  if (fma.approach !== approach) fma.changedAt.approach = t;
  if (m.prevEng !== engKey) {
    if (m.prevEng !== '') fma.changedAt.engagement = t;
    m.prevEng = engKey;
  }
  fma.athr = athr;
  fma.vertical = vertical;
  fma.verticalArmed = vertArmed;
  fma.lateral = lateral;
  fma.lateralArmed = latArmed;
  fma.approach = approach;
  fma.message = message;
  const e = fma.engagement;
  e.ap = eng.ap;
  e.fd = eng.fd;
  e.athr = eng.athr;
  e.athrArmed = eng.athrArmed;
}

// ---------------------------------------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------------------------------------

/**
 * @param {Sim} s
 * @param {number} dt
 * @param {any} phys  physics helpers from sim.js
 * @returns {{bank: number|null, fpa: number|null, thrust: number}}
 */
export function update(s, dt, phys) {
  const m = mem(s);
  manage(s, m, dt, phys);
  const tgt = targetIas(s, m, phys);
  const law = thrustLaw(s, m, phys, tgt);
  const guid = guidanceOn(s);

  let bank = guid ? lateralBank(s, m, phys) : null;
  let fpa = guid ? verticalFpa(s, m, phys, tgt) : null;
  if (!Number.isFinite(bank)) bank = null;
  if (!Number.isFinite(fpa)) fpa = null;

  // FD bars (deviation from the aircraft symbol)
  const fd = s.fd;
  fd.show = !!(s.fcu.fd && guid && (m.vert || m.lat));
  if (m.ground && m.vert === 'SRS') {
    fd.pitch = clamp(12.5 - s.pitch, -15, 15);
    fd.roll = clamp(angleDiff(m.rwyHdg, s.hdg), -15, 15);
  } else {
    fd.pitch = fpa === null ? 0 : clamp(fpa - s.fpa, -15, 15);
    fd.roll = bank === null ? 0 : clamp(bank - s.bank, -30, 30);
  }

  updateFma(s, m, law.mode);
  return { bank, fpa, thrust: clamp(law.thrust, 0, 1) };
}

/** Recompute modes/FMA without advancing time (used after loading a scenario). @param {Sim} s */
export function refreshGuidance(s, phys) {
  update(s, 0, phys);
  const c = s.fma.changedAt;
  c.athr = c.vertical = c.lateral = c.approach = c.engagement = -99;
}

// ---------------------------------------------------------------------------------------------------------
// FCU actions (pure, operate on the state)
// ---------------------------------------------------------------------------------------------------------

const round2 = (v) => Math.round(v * 100) / 100;

export const fcuOps = {
  spdTurn(/** @type {Sim} */ s, d) {
    const f = s.fcu;
    if (f.spdManaged) {
      // convenience: turning a managed knob selects at the current value
      f.spdManaged = false;
      f.spd = clamp(Math.round(s.ias), 100, 350);
      f.mach = clamp(round2(s.mach), 0.5, 0.82);
    }
    if (f.spdIsMach) f.mach = clamp(round2(f.mach + d * 0.01), 0.5, 0.82);
    else f.spd = clamp(Math.round(f.spd + d), 100, 350);
  },
  spdPush(/** @type {Sim} */ s) {
    s.fcu.spdManaged = true;
  },
  spdPull(/** @type {Sim} */ s) {
    const f = s.fcu;
    if (!f.spdManaged) return;
    f.spdManaged = false;
    f.spd = clamp(Math.round(s.ias), 100, 350);
    f.mach = clamp(round2(s.mach), 0.5, 0.82);
  },
  spdMachToggle(/** @type {Sim} */ s) {
    const f = s.fcu;
    f.spdIsMach = !f.spdIsMach;
    if (f.spdIsMach) f.mach = clamp(round2(s.mach), 0.5, 0.82);
    else f.spd = clamp(Math.round(s.ias), 100, 350);
  },
  hdgTurn(/** @type {Sim} */ s, d) {
    const f = s.fcu;
    if (f.hdgManaged) {
      // convenience: turning a managed knob selects HDG at the current heading
      const m = mem(s);
      f.hdgManaged = false;
      f.hdg = wrap360(Math.round(s.hdg));
      if (m.lat === 'LOC*' || m.lat === 'LOC') dropLoc(s);
      if (guidanceOn(s) && !m.ground) m.lat = 'HDG';
    }
    f.hdg = wrap360(Math.round(f.hdg + d));
  },
  hdgPush(/** @type {Sim} */ s) {
    const m = mem(s);
    s.fcu.hdgManaged = true;
    if (guidanceOn(s) && !m.ground && m.lat !== 'LOC*' && m.lat !== 'LOC') m.lat = 'NAV';
    else if (m.lat === 'LOC*' || m.lat === 'LOC') {
      dropLoc(s);
      m.lat = 'NAV';
    }
  },
  hdgPull(/** @type {Sim} */ s) {
    const m = mem(s);
    const f = s.fcu;
    if (f.hdgManaged) {
      f.hdgManaged = false;
      f.hdg = wrap360(Math.round(s.hdg));
    }
    if (m.lat === 'LOC*' || m.lat === 'LOC') dropLoc(s);
    if (guidanceOn(s) && !m.ground) m.lat = 'HDG';
  },
  altTurn(/** @type {Sim} */ s, d, big = false) {
    const f = s.fcu;
    f.alt = clamp(Math.round((f.alt + d * (big ? 1000 : 100)) / 100) * 100, 0, 41000);
  },
  altPush(/** @type {Sim} */ s) {
    altSelect(s, true);
  },
  altPull(/** @type {Sim} */ s) {
    altSelect(s, false);
  },
  vsTurn(/** @type {Sim} */ s, d) {
    const f = s.fcu;
    if (!f.vsActive && f.vs === 0) f.vs = Math.round(s.vs / 100) * 100;
    f.vs = clamp(f.vs + d * 100, -6000, 6000);
  },
  vsPush(/** @type {Sim} */ s) {
    const m = mem(s);
    if (!canChangeVert(s, m)) return;
    s.fcu.vs = 0;
    s.fcu.vsActive = true;
    m.vert = 'VS';
  },
  vsPull(/** @type {Sim} */ s) {
    const m = mem(s);
    if (!canChangeVert(s, m)) return;
    const f = s.fcu;
    if (!f.vsActive && f.vs === 0) f.vs = Math.round(s.vs / 100) * 100;
    f.vsActive = true;
    m.vert = 'VS';
  },
  ap1(/** @type {Sim} */ s) {
    toggleAp(s, 'ap1');
  },
  ap2(/** @type {Sim} */ s) {
    toggleAp(s, 'ap2');
  },
  athr(/** @type {Sim} */ s) {
    s.fcu.athr = !s.fcu.athr;
  },
  fd(/** @type {Sim} */ s) {
    s.fcu.fd = !s.fcu.fd;
  },
  loc(/** @type {Sim} */ s) {
    s.fcu.loc = !s.fcu.loc;
  },
  appr(/** @type {Sim} */ s) {
    s.fcu.appr = !s.fcu.appr;
  }
};

function dropLoc(s) {
  s.fcu.loc = false;
  s.fcu.appr = false;
}

function canChangeVert(s, m) {
  return guidanceOn(s) && !m.ground && m.vert !== 'GS*' && m.vert !== 'GS';
}

function altSelect(s, managed) {
  const m = mem(s);
  if (!canChangeVert(s, m)) return;
  const f = s.fcu;
  const err = f.alt - s.alt;
  f.vsActive = false;
  f.vs = 0;
  if (Math.abs(err) < 150) m.vert = 'ALT*';
  else if (err > 0) m.vert = managed ? 'CLB' : 'OPCLB';
  else m.vert = managed ? 'DES' : 'OPDES';
}

function toggleAp(s, key) {
  const m = mem(s);
  const f = s.fcu;
  if (f[key]) {
    f[key] = false;
    return;
  }
  if (m.ground || s.alt - s.groundElev < 30) return;
  f[key] = true;
  f.fd = true;
}

/** AP disconnect on large stick input. @param {Sim} s */
export function stickDisconnect(s) {
  if (Math.abs(s.stick.pitch) > 0.5 || Math.abs(s.stick.roll) > 0.5) {
    s.fcu.ap1 = false;
    s.fcu.ap2 = false;
  }
}
