// Active navigation guidance for the selected CDI source: what the HSI, the navigation status bar and the
// instructor pilot all read. Pure function of the state.
import { byId, vorByFreq, VOR_RANGE_NM } from './world.js';
import { legGuidance, courseGuidance, vorCdi, gpsDefl } from './nav.js';

/**
 * @typedef {{ source: 'GPS'|'VOR1'|'VOR2', valid: boolean, id: string|null, dtk: number, xtk: number, dis: number,
 *   brg: number, toFrom: 'TO'|'FROM'|null, defl: number, legFrom: string|null }} Guidance
 */

/** GPS target: Direct-To first, else the active flight plan leg. @returns {{from: {lat:number,lon:number}, to: import('./world.js').Waypoint, fromId: string|null}|null} */
export function gpsTarget(s) {
  const { dto, fpl } = s.gps;
  if (dto) {
    const to = byId(dto.id);
    return to ? { from: dto.from, to, fromId: null } : null;
  }
  if (fpl.active >= 1 && fpl.active < fpl.legs.length) {
    const from = byId(fpl.legs[fpl.active - 1]), to = byId(fpl.legs[fpl.active]);
    return from && to ? { from, to, fromId: from.id } : null;
  }
  return null;
}

/** @returns {Guidance} */
export function guidance(s) {
  const p = s.ac;
  const none = { valid: false, id: null, dtk: 0, xtk: 0, dis: 0, brg: 0, toFrom: null, defl: 0, legFrom: null };
  if (s.pfd.cdi === 'GPS') {
    const tg = gpsTarget(s);
    if (!tg) return { source: 'GPS', ...none };
    if (s.pfd.obs) {
      const g = courseGuidance(tg.to, s.sel.obsCrs, p);
      return { source: 'GPS', valid: true, id: tg.to.id, ...g, defl: gpsDefl(g.xtk), legFrom: null };
    }
    const g = legGuidance(tg.from, tg.to, p);
    return { source: 'GPS', valid: true, id: tg.to.id, ...g, toFrom: 'TO', defl: gpsDefl(g.xtk), legFrom: tg.fromId };
  }
  const i = s.pfd.cdi === 'VOR1' ? 0 : 1;
  const source = s.pfd.cdi;
  const st = vorByFreq(s.nav[i].act);
  const crs = i === 0 ? s.sel.crs1 : s.sel.crs2;
  if (!st) return { source, ...none };
  const g = courseGuidance(st, crs, p);
  if (g.dis > VOR_RANGE_NM) return { source, ...none };
  const c = vorCdi(st, crs, p);
  return { source, valid: true, id: st.id, dtk: g.dtk, xtk: g.xtk, dis: g.dis, brg: g.brg, toFrom: c.toFrom, defl: c.defl, legFrom: null };
}
