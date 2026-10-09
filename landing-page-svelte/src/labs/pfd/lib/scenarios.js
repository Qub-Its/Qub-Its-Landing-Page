// Scenario presets for the PFD trainer. Pure JS: `applyScenario(state, id)` rewrites the state in place.
import { createInitialState } from './schema.js';
import { resetMem } from './autoflight.js';
import { phys, refresh, trimThrust } from './sim.js';

/** @type {{id: string, name: {es: string, en: string}}[]} */
export const SCENARIO_LIST = [
  { id: 'cruise', name: { es: 'Crucero FL100 (piloto automático)', en: 'Cruise FL100 (autopilot)' } },
  { id: 'climb', name: { es: 'Ascenso gestionado', en: 'Managed climb' } },
  { id: 'approach', name: { es: 'Aproximación ILS', en: 'ILS approach' } },
  { id: 'takeoff', name: { es: 'Despegue', en: 'Takeoff' } },
  { id: 'manual', name: { es: 'Vuelo manual FL100', en: 'Hand flying FL100' } }
];

const rad = (d) => (d * Math.PI) / 180;
const dir = (h) => ({ x: Math.sin(rad(h)), y: Math.cos(rad(h)) });

/** Deep assign in place so reactive proxies keep their identity. */
function assign(target, src) {
  for (const k of Object.keys(src)) {
    const v = src[k];
    if (v && typeof v === 'object' && !Array.isArray(v) && target[k] && typeof target[k] === 'object') assign(target[k], v);
    else target[k] = v;
  }
}

/**
 * @param {import('./schema.js').FlightState & {lever?: number}} s
 * @param {string} id
 */
export function applyScenario(s, id) {
  if (!SCENARIO_LIST.some((x) => x.id === id)) id = 'cruise';
  assign(s, createInitialState());
  const m = resetMem(s);
  s.scenario = id;
  s.paused = false;
  s.weight = 64;
  s.groundElev = 0;
  s.stick.pitch = 0;
  s.stick.roll = 0;

  const level = (alt, ias) => {
    s.alt = alt;
    s.ias = ias;
    s.fpa = 0;
    s.bank = 0;
    s.flaps = '0';
    s.gearDown = false;
  };
  const lever = (l) => {
    s.lever = l;
    s.thrust = l < 0.04 ? 'IDLE' : l <= 0.85 ? 'CL' : l <= 0.96 ? 'FLX' : 'TOGA';
  };

  if (id === 'cruise' || id === 'manual') {
    level(10000, 250);
    s.hdg = 90;
    const f = s.fcu;
    Object.assign(f, { spd: 250, spdManaged: false, hdg: 90, hdgManaged: false, alt: 10000, vs: 0, vsActive: false, fd: true, loc: false, appr: false });
    m.vert = 'ALT';
    m.lat = 'HDG';
    m.altHold = 10000;
    m.navHdg = 90;
    s.speeds.vls = 175; // placeholder until refresh()
    m.thrAct = trimThrust(s, 0);
    if (id === 'cruise') {
      f.ap1 = true;
      f.ap2 = false;
      f.athr = true;
      lever(0.8);
    } else {
      f.ap1 = false;
      f.ap2 = false;
      f.athr = false;
      lever(Math.round(m.thrAct * 100) / 100);
      m.thrAct = s.lever ?? m.thrAct;
    }
  } else if (id === 'climb') {
    level(5000, 250);
    s.hdg = 90;
    Object.assign(s.fcu, { spd: 250, spdManaged: true, hdg: 90, hdgManaged: true, alt: 15000, vs: 0, vsActive: false, ap1: true, ap2: false, athr: true, fd: true, loc: false, appr: false });
    m.vert = 'CLB';
    m.lat = 'NAV';
    m.navHdg = 90;
    lever(0.8);
    m.thrAct = 0.8;
    const sin = phys.thrustMax(s.alt, s.ias) * 0.8 - Math.min(0.2, phys.dragPerW(s, 1));
    s.fpa = (Math.asin(Math.max(0, Math.min(0.2, sin))) * 180) / Math.PI;
  } else if (id === 'approach') {
    level(3000, 160);
    s.flaps = '2';
    s.gearDown = true;
    s.hdg = 40;
    Object.assign(s.fcu, { spd: 160, spdManaged: false, hdg: 40, hdgManaged: false, alt: 3000, vs: 0, vsActive: false, ap1: true, ap2: false, athr: true, fd: true, loc: false, appr: false });
    m.vert = 'ALT';
    m.lat = 'HDG';
    m.altHold = 3000;
    m.ils = { course: 70, gs: 3 };
    m.ilsShown = true;
    // 14.5 NM before the threshold along the 070 course, 2.5 NM to the right of it
    const a = dir(70);
    const r = dir(160);
    m.pos = { x: -14.5 * a.x + 2.5 * r.x, y: -14.5 * a.y + 2.5 * r.y };
    lever(0.8);
    s.speeds.vls = 132;
    m.thrAct = trimThrust(s, 0);
    Object.assign(s.ils, { visible: true, ident: 'IMRC', freq: '109.30', course: 70 });
  } else if (id === 'takeoff') {
    level(0, 0);
    s.flaps = '1+F';
    s.gearDown = true;
    s.hdg = 70;
    s.pitch = 0;
    Object.assign(s.fcu, { spd: 250, spdManaged: true, hdg: 70, hdgManaged: true, alt: 5000, vs: 0, vsActive: false, ap1: false, ap2: false, athr: true, fd: true, loc: false, appr: false });
    m.ground = true;
    m.rwyHdg = 70;
    m.navHdg = 70;
    m.v2 = 150;
    m.thrAct = 0;
    lever(0);
  }
  s.track = s.hdg;
  refresh(s);
  // refresh() may have flipped nothing, but keep the FMA white boxes off on load
  return s;
}
