// Every G1000 control as a pure state transition: dispatch(state, event) mutates the plain state and returns a
// message key for the toast (or null). Covers radios, transponder, audio panel, bugs, softkeys, FMS cursor and
// identifier entry, Direct-To, flight plan editing, MENU, CLR/ENT and the power switches.
import { MENUS, SUPPORTED } from './softkeys.js';
import { GROUPS, PAGES, RANGES, pageId, mfdFields, mfdField, wptAirport, nrstAirport } from './pages.js';
import { byId, complete, nearest, vorByFreq } from './world.js';
import { norm360, brgDeg } from './nav.js';
import { gduPhase, applyPower } from './sim.js';
import { gpsTarget } from './guidance.js';

/**
 * @typedef {'pfd'|'mfd'} Gdu
 * @typedef {{ type: 'switch', id: 'master'|'avionics'|'engine', on: boolean }
 *   | { type: 'pilot', mode: 'auto'|'hdg' }
 *   | { type: 'audio', id: 'com1mic'|'com2mic'|'com1'|'com2'|'nav1'|'nav2'|'backup' }
 *   | { type: 'knob', gdu: Gdu, id: 'com'|'nav'|'hdg'|'alt'|'crsbaro'|'fms'|'range'|'vol', ring: 'outer'|'inner', d: number }
 *   | { type: 'push', gdu: Gdu, id: 'com'|'nav'|'hdg'|'crsbaro'|'fms'|'range'|'alt'|'vol' }
 *   | { type: 'key', gdu: Gdu, id: 'comSwap'|'navSwap'|'dto'|'menu'|'fpl'|'proc'|'clr'|'ent', long?: boolean }
 *   | { type: 'soft', gdu: Gdu, n: number }
 *   | { type: 'char', gdu: Gdu, c: string }
 *   | { type: 'pan', gdu: 'mfd', dx: number, dy: number }} G1000Event
 * @typedef {'na'|'notFound'|'notAirport'|'useMfd'|'obsNeedsGps'|'pickLeg'|'freqLoaded'|'noPower'|null} Msg
 */

export const CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const r3 = (x) => Math.round(x * 1000) / 1000;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/** Steps a frequency: outer ring = MHz, inner = channel (25 kHz COM, 50 kHz NAV), both wrap like the real knobs. */
export function tuneFreq(f, kind, ring, d) {
  const [lo, hi, stepK] = kind === 'com' ? [118, 136, 25] : [108, 117, 50];
  let mhz = Math.floor(f + 1e-6), k = Math.round((f - mhz) * 1000 / stepK);
  const span = hi - lo + 1, n = 1000 / stepK;
  if (ring === 'outer') mhz = lo + ((((mhz - lo + d) % span) + span) % span);
  else k = (((k + d) % n) + n) % n;
  return r3(mhz + (k * stepK) / 1000);
}

/** Text shown in an identifier field being edited: the typed prefix auto-completed from the database. */
export const editValue = (e) => complete(e.typed) ?? e.typed;

/** @param {any} s @param {G1000Event} ev @returns {Msg} */
export function dispatch(s, ev) {
  if (ev.type === 'switch') {
    if (ev.id === 'engine' && ev.on && !s.power.master) return 'noPower';
    s.power[ev.id] = ev.on;
    applyPower(s);
    return null;
  }
  if (ev.type === 'pilot') { s.pilot.mode = ev.mode; return null; }
  if (ev.type === 'audio') return audio(s, ev.id);
  const phase = gduPhase(s, ev.gdu);
  if (phase === 'off' || phase === 'boot') return null;
  if (phase === 'db') {
    if (ev.type === 'key' && ev.id === 'ent') s.power.dbOk = true;
    return null;
  }
  switch (ev.type) {
    case 'knob': return knob(s, ev.gdu, ev.id, ev.ring, ev.d);
    case 'push': return push(s, ev.gdu, ev.id);
    case 'key': return key(s, ev.gdu, ev.id, !!ev.long);
    case 'soft': return soft(s, ev.gdu, ev.n);
    case 'char': return typeChar(s, ev.gdu, ev.c);
    case 'pan': return pan(s, ev.dx, ev.dy);
  }
  return null;
}

// ---------- audio panel (GMA 1347): powered by MASTER
function audio(s, id) {
  if (!s.power.master) return null;
  const a = s.audio;
  if (id === 'com1mic') { a.mic = 0; a.com1 = true; }
  else if (id === 'com2mic') { a.mic = 1; a.com2 = true; }
  else if (id === 'com1') { if (a.mic !== 0) a.com1 = !a.com1; }
  else if (id === 'com2') { if (a.mic !== 1) a.com2 = !a.com2; }
  else if (id === 'nav1') a.nav1 = !a.nav1;
  else if (id === 'nav2') a.nav2 = !a.nav2;
  else return 'na';
  return null;
}

// ---------- knobs
function knob(s, gdu, id, ring, d) {
  switch (id) {
    case 'com': { const r = s.com[s.comTune]; r.stby = tuneFreq(r.stby, 'com', ring, d); return null; }
    case 'nav': { const r = s.nav[s.navTune]; r.stby = tuneFreq(r.stby, 'nav', ring, d); return null; }
    case 'hdg': s.sel.hdg = norm360(Math.round(s.sel.hdg + d)); return null;
    case 'alt': s.sel.alt = clamp(Math.round(s.sel.alt / 100) * 100 + d * (ring === 'outer' ? 1000 : 100), 0, 20000); return null;
    case 'crsbaro':
      if (ring === 'outer') { s.sel.baro = clamp(Math.round((s.sel.baro + d * 0.01) * 100) / 100, 27.5, 31); return null; }
      return setCrs(s, (c) => norm360(Math.round(c + d)));
    case 'range': {
      const key = gdu === 'pfd' ? 'insetRange' : 'range';
      const i = RANGES.indexOf(s[gdu][key]);
      s[gdu][key] = RANGES[clamp((i < 0 ? 5 : i) + d, 0, RANGES.length - 1)];
      return null;
    }
    case 'fms': return fms(s, gdu, ring, d);
  }
  return 'na';
}

/** Changes the course of the active CDI source (VOR1/VOR2 course, or the GPS OBS course). */
function setCrs(s, fn) {
  if (s.pfd.cdi === 'VOR1') s.sel.crs1 = fn(s.sel.crs1);
  else if (s.pfd.cdi === 'VOR2') s.sel.crs2 = fn(s.sel.crs2);
  else if (s.pfd.obs) s.sel.obsCrs = fn(s.sel.obsCrs);
  return null;
}

function fms(s, gdu, ring, d) {
  if (s.menu?.gdu === gdu) { s.menu.sel = clamp(s.menu.sel + d, 0, s.menu.items.length - 1); return null; }
  if (s.edit?.gdu === gdu) { editKnob(s.edit, ring, d); return null; }
  if (s.dtoWin?.gdu === gdu) {
    if (ring === 'inner') { startEdit(s, gdu, 'dto', s.dtoWin.id); s.dtoWin.field = 0; editKnob(s.edit, ring, d); }
    else s.dtoWin.field = /** @type {0|1} */ (clamp(s.dtoWin.field + d, 0, 1));
    return null;
  }
  if (gdu === 'pfd') {
    if (s.pfd.win === 'tmr') {
      s.sel.mins = clamp(Math.round(((s.sel.mins ?? 500) + d * (ring === 'outer' ? 100 : 10)) / 10) * 10, 0, 16000);
    } else if (s.pfd.win === 'nrst' && s.pfd.cursor >= 0) {
      s.pfd.cursor = clamp(s.pfd.cursor + d, 0, 4);
      s.pfd.nrstSel = s.pfd.cursor;
    }
    return null;
  }
  const m = s.mfd;
  if (m.cursor >= 0) {
    const fields = mfdFields(s);
    if (ring === 'outer') {
      m.cursor = clamp(m.cursor + d, 0, fields.length - 1);
      const f = fields[m.cursor];
      if (pageId(s) === 'NRST_APT' && m.win !== 'fpl' && f[0] === 'a') m.nrstSel = Number(f.slice(1));
      return null;
    }
    const f = mfdField(s);
    if (m.win === 'fpl') { startEdit(s, gdu, 'fpl', ''); editKnob(s.edit, ring, d); }
    else if (f === 'ident') { startEdit(s, gdu, 'wpt', m.wpt); editKnob(s.edit, ring, d); }
    return null;
  }
  if (m.win === 'fpl') return null;
  if (ring === 'outer') {
    const i = GROUPS.indexOf(m.group);
    m.group = GROUPS[(i + d + GROUPS.length * 4) % GROUPS.length];
    m.page = 0;
  } else {
    const n = PAGES[m.group].length;
    m.page = (m.page + d + n * 4) % n;
  }
  return null;
}

function startEdit(s, gdu, target, prefill) {
  s.edit = { gdu, target, typed: prefill ?? '', pos: 0 };
}

/** Inner ring: cycles the character under the cursor; outer ring: moves the cursor. */
function editKnob(e, ring, d) {
  const value = editValue(e);
  if (ring === 'inner') {
    const ch = value[e.pos];
    const cur = ch ? CHARSET.indexOf(ch) : -1;
    const next = cur < 0 ? (d > 0 ? 0 : CHARSET.length - 1) : (cur + d + CHARSET.length) % CHARSET.length;
    e.typed = value.slice(0, e.pos) + CHARSET[next];
  } else if (d > 0) {
    if (e.pos < value.length) { e.typed = value.slice(0, e.pos + 1); e.pos = Math.min(e.pos + 1, 5); }
  } else {
    e.pos = Math.max(0, e.pos - 1);
    e.typed = value.slice(0, e.pos + 1);
  }
}

/** Keyboard shortcut for identifier entry (desktop): types at the cursor, opening the entry where it makes sense. */
function typeChar(s, gdu, c) {
  c = String(c).toUpperCase();
  if (c.length !== 1 || !CHARSET.includes(c)) return null;
  if (s.edit?.gdu !== gdu) {
    if (s.dtoWin?.gdu === gdu) { startEdit(s, gdu, 'dto', ''); s.dtoWin.field = 0; }
    else if (gdu === 'mfd' && s.mfd.win === 'fpl' && s.mfd.cursor >= 0) startEdit(s, gdu, 'fpl', '');
    else if (gdu === 'mfd' && mfdField(s) === 'ident') startEdit(s, gdu, 'wpt', '');
    else return null;
  }
  const e = s.edit;
  e.typed = editValue(e).slice(0, e.pos) + c;
  e.pos = Math.min(e.pos + 1, 5);
  return null;
}

// ---------- knob pushes
function push(s, gdu, id) {
  switch (id) {
    case 'com': s.comTune = 1 - s.comTune; return null;
    case 'nav': s.navTune = 1 - s.navTune; return null;
    case 'hdg': s.sel.hdg = norm360(Math.round(s.ac.hdg)); return null;
    case 'crsbaro': {
      // Centres the CDI with a TO indication: course = bearing to the station / waypoint.
      if (s.pfd.cdi !== 'GPS') {
        const st = vorByFreq(s.nav[s.pfd.cdi === 'VOR1' ? 0 : 1].act);
        return st ? setCrs(s, () => Math.round(brgDeg(s.ac, st)) % 360) : null;
      }
      const tg = gpsTarget(s);
      return s.pfd.obs && tg ? setCrs(s, () => Math.round(brgDeg(s.ac, tg.to)) % 360) : null;
    }
    case 'range':
      if (gdu === 'mfd') s.mfd.pan = s.mfd.pan ? null : { lat: s.ac.lat, lon: s.ac.lon };
      return null;
    case 'fms':
      if (s.edit?.gdu === gdu) { s.edit = null; return null; }
      if (gdu === 'pfd') {
        if (s.pfd.win === 'nrst') { s.pfd.cursor = s.pfd.cursor < 0 ? 0 : -1; s.pfd.nrstSel = Math.max(0, s.pfd.cursor); }
        return null;
      }
      if (!mfdFields(s).length) return null;
      s.mfd.cursor = s.mfd.cursor < 0 ? 0 : -1;
      return null;
  }
  return null;
}

function pan(s, dx, dy) {
  const p = s.mfd.pan;
  if (!p) return null;
  const nm = s.mfd.range / 4;
  p.lat += (dy * nm) / 60;
  p.lon += (dx * nm) / (60 * Math.cos((p.lat * Math.PI) / 180));
  return null;
}

// ---------- keys
function key(s, gdu, id, long) {
  switch (id) {
    case 'comSwap': { const r = s.com[s.comTune]; [r.act, r.stby] = [r.stby, r.act]; return null; }
    case 'navSwap': { const r = s.nav[s.navTune]; [r.act, r.stby] = [r.stby, r.act]; return null; }
    case 'dto': return openDto(s, gdu);
    case 'menu': return openMenu(s, gdu);
    case 'fpl':
      if (gdu === 'pfd') return 'useMfd';
      s.mfd.win = s.mfd.win === 'fpl' ? null : 'fpl';
      s.mfd.cursor = -1;
      if (s.edit?.gdu === 'mfd') s.edit = null;
      s.confirm = null;
      return null;
    case 'clr': return clr(s, gdu, long);
    case 'ent': return ent(s, gdu);
  }
  return 'na';
}

function openDto(s, gdu) {
  if (s.dtoWin?.gdu === gdu) { s.dtoWin = null; if (s.edit?.gdu === gdu) s.edit = null; return null; }
  let id = '';
  if (gdu === 'pfd' && s.pfd.win === 'nrst' && s.pfd.cursor >= 0) id = nearest(s.ac)[s.pfd.cursor].apt.id;
  else if (gdu === 'mfd') {
    const f = mfdField(s);
    if (s.mfd.win === 'fpl' && f) id = s.gps.fpl.legs[Number(f.slice(1))] ?? '';
    else if (f === 'ident' || (f && f[0] === 'f' && pageId(s) === 'WPT_APT')) id = wptAirport(s).id;
    else if (f && pageId(s) === 'NRST_APT') id = nrstAirport(s).id;
  }
  if (!id) id = gpsTarget(s)?.to.id ?? '';
  s.dtoWin = { gdu, field: 0, id };
  if (s.edit?.gdu === gdu) s.edit = null;
  return null;
}

function openMenu(s, gdu) {
  if (s.menu?.gdu === gdu) { s.menu = null; return null; }
  let items = [];
  if (s.dtoWin?.gdu === gdu) items = s.gps.dto ? ['cancelDto'] : [];
  else if (gdu === 'mfd' && s.mfd.win === 'fpl') items = ['activateLeg', 'deleteFpl'];
  else if (gdu === 'mfd' && pageId(s) === 'MAP_NAV') items = ['orient'];
  if (!items.length) return 'na';
  s.menu = { gdu, items, sel: 0 };
  return null;
}

function runMenu(s, item) {
  s.menu = null;
  const fpl = s.gps.fpl;
  if (item === 'cancelDto') { s.gps.dto = null; s.dtoWin = null; s.pfd.obs = false; return null; }
  if (item === 'orient') { s.mfd.orient = s.mfd.orient === 'north' ? 'track' : 'north'; return null; }
  if (item === 'deleteFpl') { s.gps.fpl = { legs: [], active: -1 }; s.mfd.cursor = -1; s.pfd.obs = false; return null; }
  if (item === 'activateLeg') {
    const f = mfdField(s);
    const n = f ? Number(f.slice(1)) : -1;
    if (n < 1 || n >= fpl.legs.length) return 'pickLeg';
    fpl.active = n;
    s.gps.dto = null;
    s.pfd.obs = false;
    return null;
  }
  return 'na';
}

function clr(s, gdu, long) {
  if (gdu === 'mfd' && long) {
    Object.assign(s.mfd, { group: 'MAP', page: 0, win: null, cursor: -1, pan: null, menu: 'root' });
    if (s.menu?.gdu === 'mfd') s.menu = null;
    if (s.edit?.gdu === 'mfd') s.edit = null;
    if (s.dtoWin?.gdu === 'mfd') s.dtoWin = null;
    s.confirm = null;
    return null;
  }
  if (s.menu?.gdu === gdu) { s.menu = null; return null; }
  if (s.edit?.gdu === gdu) { s.edit = null; return null; }
  if (gdu === 'mfd' && s.confirm) { s.confirm = null; return null; }
  if (s.dtoWin?.gdu === gdu) { s.dtoWin = null; return null; }
  if (gdu === 'pfd') {
    if (s.pfd.win) { s.pfd.win = null; s.pfd.cursor = -1; }
    return null;
  }
  const m = s.mfd;
  if (m.win === 'fpl' && m.cursor >= 0) {
    const n = Number(mfdField(s)?.slice(1));
    if (n < s.gps.fpl.legs.length) { s.confirm = { action: 'delete', idx: n }; return null; }
    m.cursor = -1;
    return null;
  }
  if (m.cursor >= 0) { m.cursor = -1; return null; }
  if (m.win) { m.win = null; return null; }
  return null;
}

function ent(s, gdu) {
  if (s.menu?.gdu === gdu) return runMenu(s, s.menu.items[s.menu.sel]);
  const fpl = s.gps.fpl;
  if (gdu === 'mfd' && s.confirm) {
    const i = s.confirm.idx;
    fpl.legs.splice(i, 1);
    if (fpl.legs.length < 2) fpl.active = -1;
    else if (i < fpl.active) fpl.active -= 1;
    else if (fpl.active >= fpl.legs.length) fpl.active = fpl.legs.length - 1;
    if (fpl.active === 0) fpl.active = 1;
    s.confirm = null;
    s.mfd.cursor = Math.min(s.mfd.cursor, fpl.legs.length);
    return null;
  }
  if (s.edit?.gdu === gdu) return acceptEdit(s);
  if (s.dtoWin?.gdu === gdu) {
    if (s.dtoWin.field === 0) {
      if (!byId(s.dtoWin.id)) return 'notFound';
      s.dtoWin.field = 1;
      return null;
    }
    const id = s.dtoWin.id;
    s.gps.dto = { id, from: { lat: s.ac.lat, lon: s.ac.lon } };
    const i = fpl.legs.indexOf(id);
    if (i >= 1) fpl.active = i;
    s.pfd.obs = false;
    s.dtoWin = null;
    return null;
  }
  if (gdu === 'mfd' && s.mfd.cursor >= 0) {
    const f = /** @type {string} */ (mfdField(s));
    const page = pageId(s);
    if (page === 'WPT_APT' && f[0] === 'f') return loadFreq(s, wptAirport(s).freqs[Number(f.slice(1))].f);
    if (page === 'NRST_APT' && f[0] === 'a') { s.mfd.nrstSel = Number(f.slice(1)); s.mfd.cursor = 5; return null; }
    if (page === 'NRST_APT' && f[0] === 'f') return loadFreq(s, nrstAirport(s).freqs[Number(f.slice(1))].f);
  }
  return null;
}

/** Loads a frequency into the standby field of the radio being tuned (COM or NAV by band). */
function loadFreq(s, f) {
  if (f >= 118) s.com[s.comTune].stby = f;
  else s.nav[s.navTune].stby = f;
  return 'freqLoaded';
}

function acceptEdit(s) {
  const e = s.edit;
  const id = editValue(e);
  const w = byId(id);
  if (!w) return 'notFound';
  if (e.target === 'dto') { s.dtoWin.id = id; s.dtoWin.field = 1; }
  else if (e.target === 'wpt') {
    if (w.kind !== 'apt') return 'notAirport';
    s.mfd.wpt = id;
  } else {
    const fpl = s.gps.fpl;
    const n = Number(mfdField(s)?.slice(1) ?? fpl.legs.length);
    fpl.legs.splice(n, 0, id);
    if (fpl.active >= 1 && n < fpl.active) fpl.active += 1;
    if (fpl.active < 1 && fpl.legs.length >= 2) fpl.active = 1;
    s.mfd.cursor = n + 1;
  }
  s.edit = null;
  return null;
}

// ---------- softkeys
function soft(s, gdu, n) {
  const menu = s[gdu].menu;
  const label = MENUS[gdu][menu]?.[n];
  if (!label) return null;
  if (gdu === 'pfd' && menu === 'code' && /^[0-7]$/.test(label)) {
    s.xpdr.entry = (s.xpdr.entry ?? '') + label;
    if (s.xpdr.entry.length === 4) { s.xpdr.code = s.xpdr.entry; s.xpdr.entry = null; s.pfd.menu = 'xpdr'; }
    return null;
  }
  if (!SUPPORTED.has(`${gdu}:${menu}:${label}`)) return 'na';
  const p = s.pfd, m = s.mfd;
  if (label === 'BACK') {
    if (menu === 'code') { s.xpdr.entry = null; p.menu = 'xpdr'; }
    else s[gdu].menu = 'root';
    return null;
  }
  if (gdu === 'pfd') {
    switch (label) {
      case 'INSET': p.inset = true; p.menu = 'inset'; return null;
      case 'OFF': p.inset = false; p.menu = 'root'; return null;
      case 'PFD': p.menu = 'pfd'; return null;
      case 'XPDR': p.menu = 'xpdr'; return null;
      case 'CODE': s.xpdr.entry = ''; p.menu = 'code'; return null;
      case 'OBS': {
        if (p.obs) { p.obs = false; return null; }
        const tg = gpsTarget(s);
        if (p.cdi !== 'GPS' || !tg) return 'obsNeedsGps';
        p.obs = true;
        s.sel.obsCrs = Math.round(brgDeg(tg.from, tg.to)) % 360;
        return null;
      }
      case 'CDI': p.cdi = p.cdi === 'GPS' ? 'VOR1' : p.cdi === 'VOR1' ? 'VOR2' : 'GPS'; p.obs = false; return null;
      case 'IDENT': if (s.xpdr.mode !== 'STBY') s.xpdr.ident = 18; s.xpdr.entry = null; p.menu = 'root'; return null;
      case 'TMR/REF': p.win = p.win === 'tmr' ? null : 'tmr'; p.cursor = -1; return null;
      case 'NRST': p.win = p.win === 'nrst' ? null : 'nrst'; p.cursor = -1; return null;
      case 'BRG1': p.brg1 = p.brg1 === 'off' ? 'nav1' : p.brg1 === 'nav1' ? 'gps' : 'off'; return null;
      case 'BRG2': p.brg2 = p.brg2 === 'off' ? 'nav2' : p.brg2 === 'nav2' ? 'gps' : 'off'; return null;
      case 'STD BARO': s.sel.baro = 29.92; return null;
      case 'STBY': case 'ON': case 'ALT': s.xpdr.mode = label; return null;
      case 'VFR': s.xpdr.code = '1200'; return null;
      case 'BKSP': s.xpdr.entry = (s.xpdr.entry ?? '').slice(0, -1); return null;
    }
    return 'na';
  }
  switch (label) {
    case 'ENGINE': if (menu === 'root') m.menu = 'engine'; else m.eis = 'ENGINE'; return null;
    case 'LEAN': case 'SYSTEM': m.eis = label; return null;
    case 'MAP': m.menu = 'map'; return null;
    case 'TOPO': m.topo = !m.topo; return null;
    case 'DCLTR': m.dcltr = (m.dcltr + 1) % 4; return null;
  }
  return 'na';
}
