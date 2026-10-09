// Shape of the whole G1000 course state (avionics + aircraft) and the starting scenarios. Plain data: the store
// wraps it in $state, Node checks use it as is. Every pure module (avionics, sim, guidance) reads/mutates this shape.
import { QNH, byId } from './world.js';

/** @typedef {'pfd'|'mfd'} Gdu */
/** @typedef {'cold'|'ground'|'enroute'} ScenarioId */

export const SCENARIOS = /** @type {const} */ (['cold', 'ground', 'enroute']);

export function createState(scenario = /** @type {ScenarioId} */ ('enroute')) {
  const home = /** @type {import('./world.js').Airport} */ (byId('SQ01'));
  const s = {
    t: 0,
    scenario,
    /** pfdOn/mfdOn: sim time the display got power (null = off). dbOk: database page acknowledged with ENT. */
    power: { master: true, avionics: true, engine: true, pfdOn: /** @type {number|null} */ (-60), mfdOn: /** @type {number|null} */ (-60), dbOk: true },
    ac: { lat: home.lat, lon: home.lon, alt: 4500, hdg: 45, trk: 45, ias: 110, tas: 120, gs: 120, vs: 0, bank: 0, pitch: 2,
          onGround: false, fuel: 40, rpm: 2400 },
    wind: { dir: 270, kt: 10 },
    pilot: { mode: /** @type {'auto'|'hdg'} */ ('auto') },
    /** Selected/bugged values. alt is the INDICATED altitude the instructor holds; mins null = off. */
    sel: { hdg: 45, alt: 4500, baro: QNH, crs1: 0, crs2: 0, obsCrs: 0, mins: /** @type {number|null} */ (null) },
    com: [{ act: 124.35, stby: 118.3 }, { act: 122.8, stby: 121.5 }],
    comTune: 0,
    nav: [{ act: 113.3, stby: 116.6 }, { act: 116.6, stby: 113.3 }],
    navTune: 0,
    audio: { mic: 0, com1: true, com2: false, nav1: false, nav2: false },
    xpdr: { code: '4721', mode: /** @type {'STBY'|'ON'|'ALT'} */ ('ALT'), ident: 0, entry: /** @type {string|null} */ (null) },
    pfd: { menu: 'root', inset: false, insetRange: 5, brg1: 'off', brg2: 'off', cdi: /** @type {'GPS'|'VOR1'|'VOR2'} */ ('GPS'),
           obs: false, win: /** @type {null|'nrst'|'tmr'} */ (null), cursor: -1, nrstSel: 0 },
    mfd: { menu: 'root', group: 'MAP', page: 0, range: 20, orient: /** @type {'north'|'track'} */ ('north'),
           pan: /** @type {null|{lat: number, lon: number}} */ (null), eis: 'ENGINE', topo: true, dcltr: 0,
           win: /** @type {null|'fpl'} */ (null), cursor: -1, wpt: 'SQ01', nrstSel: 0 },
    gps: { dto: /** @type {null|{id: string, from: {lat: number, lon: number}}} */ (null),
           fpl: { legs: /** @type {string[]} */ ([]), active: -1 } },
    /** Open Direct-To window: `id` shown in the identifier field; field 0 = identifier, 1 = "Activate?". */
    dtoWin: /** @type {null|{gdu: Gdu, field: 0|1, id: string}} */ (null),
    /** Identifier entry in progress (FMS small knob or keyboard): `typed` prefix, cursor `pos`. */
    edit: /** @type {null|{gdu: Gdu, target: 'dto'|'wpt'|'fpl', typed: string, pos: number}} */ (null),
    menu: /** @type {null|{gdu: Gdu, items: string[], sel: number}} */ (null),
    confirm: /** @type {null|{action: 'delete', idx: number}} */ (null),
  };
  if (scenario === 'cold' || scenario === 'ground') {
    Object.assign(s.ac, { alt: home.elev, hdg: 90, trk: 90, ias: 0, tas: 0, gs: 0, onGround: true, pitch: 0, rpm: 1000 });
    Object.assign(s.sel, { hdg: 90, alt: 3000 });
    s.com[0] = { act: 127.25, stby: 121.8 };
  }
  if (scenario === 'cold') {
    s.power = { master: false, avionics: false, engine: false, pfdOn: null, mfdOn: null, dbOk: false };
    s.ac.rpm = 0;
    s.sel.baro = 29.92;
    s.xpdr = { code: '1200', mode: 'STBY', ident: 0, entry: null };
  }
  return s;
}

/** @typedef {ReturnType<typeof createState>} G1000State */
