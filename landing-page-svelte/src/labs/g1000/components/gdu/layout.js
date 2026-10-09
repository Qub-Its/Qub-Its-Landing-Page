// Geometry of the 2D G1000: bezel (1240 × 900 SVG units) with a 1024 × 768 screen, knob and key positions, and the
// screen regions of each data-part (used for hit areas and the cyan highlight). Colours are G1000-like and given
// as presentation attributes so the SVG can be serialized to a 3D texture without the page stylesheet.

export const BEZEL = { w: 1240, h: 900, screen: { x: 108, y: 40, w: 1024, h: 768 } };

export const C = {
  bg: '#000000', white: '#ffffff', cyan: '#00f0ff', magenta: '#ff40ff', green: '#34e24a', yellow: '#ffe000',
  red: '#ff2a1a', amber: '#ffb000', grey: '#9aa3ab', dark: '#1b2228', sky: '#2f6fd1', ground: '#7a4a1d',
  bezel: '#26292d', bezelEdge: '#3a3f45', key: '#33383e', keyText: '#dfe5ea', boxBg: '#0d1216',
};
export const FONT = "'B612 Mono', ui-monospace, Menlo, Consolas, monospace";

/** Knobs in bezel coordinates. dual = two concentric rings (outer + inner). */
export const KNOBS = {
  nav: { x: 54, y: 140, dual: true, label: 'NAV', part: 'k.nav' },
  hdg: { x: 54, y: 340, dual: false, label: 'HDG', part: 'k.hdg' },
  alt: { x: 54, y: 560, dual: true, label: 'ALT', part: 'k.alt' },
  com: { x: 1186, y: 140, dual: true, label: 'COM', part: 'k.com' },
  crsbaro: { x: 1186, y: 330, dual: true, label: 'CRS/BARO', part: 'k.crsbaro' },
  range: { x: 1186, y: 450, dual: false, label: 'RANGE', part: 'k.range' },
  fms: { x: 1186, y: 790, dual: true, label: 'FMS', part: 'k.fms' },
};

/** Keys in bezel coordinates. */
export const KEYS = {
  navSwap: { x: 22, y: 206, w: 64, h: 30, label: '⇆', part: 'key.navSwap' },
  comSwap: { x: 1154, y: 206, w: 64, h: 30, label: '⇆', part: 'key.comSwap' },
  dto: { x: 1140, y: 540, w: 44, h: 34, label: 'D→', part: 'key.dto' },
  menu: { x: 1190, y: 540, w: 44, h: 34, label: 'MENU', part: 'key.menu' },
  fpl: { x: 1140, y: 582, w: 44, h: 34, label: 'FPL', part: 'key.fpl' },
  proc: { x: 1190, y: 582, w: 44, h: 34, label: 'PROC', part: 'key.proc' },
  clr: { x: 1140, y: 624, w: 44, h: 34, label: 'CLR', part: 'key.clr' },
  ent: { x: 1190, y: 624, w: 44, h: 34, label: 'ENT', part: 'key.ent' },
};

export const SOFTKEY = { y: 822, h: 34, n: 12, labelY: 742, labelH: 26 };
export const softkeyX = (i) => BEZEL.screen.x + (i * BEZEL.screen.w) / SOFTKEY.n;
export const SOFTKEY_W = BEZEL.screen.w / SOFTKEY.n;

/** Screen regions (screen coordinates) of the PFD and MFD data-parts: [x, y, w, h]. */
export const REGIONS = {
  'pfd.navBox': [0, 0, 230, 56], 'pfd.navStatus': [230, 0, 564, 56], 'pfd.comBox': [794, 0, 230, 56],
  'pfd.att': [340, 90, 344, 380], 'pfd.ias': [230, 110, 100, 360], 'pfd.alt': [694, 110, 100, 360],
  'pfd.vsi': [798, 130, 44, 320], 'pfd.selAlt': [694, 76, 100, 32], 'pfd.baro': [694, 472, 100, 30],
  'pfd.slip': [492, 100, 40, 30], 'pfd.hsi': [362, 470, 300, 272], 'pfd.inset': [0, 500, 230, 212],
  'pfd.nrst': [794, 500, 230, 212], 'pfd.xpdrBox': [794, 714, 230, 28], 'pfd.softkeys': [0, 742, 1024, 26],
  'mfd.eis': [0, 56, 180, 686], 'mfd.map': [180, 84, 844, 606], 'mfd.page': [180, 56, 844, 28],
  'mfd.pageGroup': [864, 690, 160, 52], 'mfd.fpl': [664, 84, 360, 386],
};
