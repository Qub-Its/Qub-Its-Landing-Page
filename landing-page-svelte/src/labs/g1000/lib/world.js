// Fictional navigation world of the G1000 course: airports, VORs and fixes over open sea (no real data).
// Magnetic variation is zero everywhere, so true = magnetic. Frequencies are on the 25 kHz (COM) / 50 kHz (NAV) grid.
import { distNm, brgDeg } from './nav.js';

/** Regional altimeter setting (inHg). */
export const QNH = 30.12;

/** @typedef {{ type: 'ATIS'|'GND'|'TWR'|'APP'|'CTAF', f: number }} Freq */
/** @typedef {{ id: string, kind: 'apt', name: string, lat: number, lon: number, elev: number, rwys: {id: string, len: number}[], freqs: Freq[] }} Airport */
/** @typedef {{ id: string, kind: 'vor', name: string, lat: number, lon: number, freq: number, morse: string }} Vor */
/** @typedef {{ id: string, kind: 'int', name: string, lat: number, lon: number }} Fix */
/** @typedef {Airport|Vor|Fix} Waypoint */

/** @type {Airport[]} */
export const AIRPORTS = [
  { id: 'SQ01', kind: 'apt', name: 'PUERTO ALBA', lat: 10.0, lon: -64.0, elev: 45, rwys: [{ id: '09/27', len: 5200 }],
    freqs: [{ type: 'ATIS', f: 127.25 }, { type: 'GND', f: 121.8 }, { type: 'TWR', f: 118.3 }, { type: 'APP', f: 124.35 }] },
  { id: 'SQ02', kind: 'apt', name: 'ISLA VERDE', lat: 10.35, lon: -63.7, elev: 12, rwys: [{ id: '06/24', len: 4100 }],
    freqs: [{ type: 'CTAF', f: 122.8 }] },
  { id: 'SQ03', kind: 'apt', name: 'CERRO AZUL', lat: 9.7, lon: -63.55, elev: 1450, rwys: [{ id: '14/32', len: 3900 }],
    freqs: [{ type: 'CTAF', f: 122.7 }] },
  { id: 'SQ04', kind: 'apt', name: 'BAHIA SOL', lat: 10.55, lon: -64.35, elev: 30, rwys: [{ id: '03/21', len: 6500 }],
    freqs: [{ type: 'ATIS', f: 126.85 }, { type: 'GND', f: 121.7 }, { type: 'TWR', f: 119.1 }] },
  { id: 'SQ05', kind: 'apt', name: 'SAN RAFAEL', lat: 9.8, lon: -64.4, elev: 220, rwys: [{ id: '18/36', len: 4600 }],
    freqs: [{ type: 'CTAF', f: 123.0 }] },
  { id: 'SQ06', kind: 'apt', name: 'LLANO ALTO', lat: 10.1, lon: -63.2, elev: 600, rwys: [{ id: '10/28', len: 5000 }],
    freqs: [{ type: 'GND', f: 121.9 }, { type: 'TWR', f: 118.75 }] },
];

/** @type {Vor[]} */
export const VORS = [
  { id: 'ALB', kind: 'vor', name: 'ALBA', lat: 10.05, lon: -64.05, freq: 113.3, morse: '·— ·—·· —···' },
  { id: 'VRD', kind: 'vor', name: 'VERDE', lat: 10.3, lon: -63.75, freq: 116.6, morse: '···— ·—· —··' },
];

/** @type {Fix[]} */
export const FIXES = [
  { id: 'MIRA', kind: 'int', name: 'MIRA', lat: 10.2, lon: -63.95 },
  { id: 'TOLKA', kind: 'int', name: 'TOLKA', lat: 9.9, lon: -63.8 },
];

/** @type {Waypoint[]} */
export const ALL = [...AIRPORTS, ...VORS, ...FIXES].sort((a, b) => a.id.localeCompare(b.id));

/** @param {string} id @returns {Waypoint|null} */
export const byId = (id) => ALL.find((w) => w.id === id) ?? null;

/** First identifier (alphabetical) starting with `prefix`, like the G1000 auto-complete. Empty prefix → null. */
export function complete(prefix) {
  if (!prefix) return null;
  return ALL.find((w) => w.id.startsWith(prefix))?.id ?? null;
}

/** The `n` nearest airports to a position, with bearing and distance from it. */
export function nearest(p, n = 5) {
  return AIRPORTS.map((apt) => ({ apt, dis: distNm(p, apt), brg: brgDeg(p, apt) }))
    .sort((a, b) => a.dis - b.dis)
    .slice(0, n);
}

/** VOR transmitting on `freq` (MHz), or null. */
export const vorByFreq = (freq) => VORS.find((v) => Math.abs(v.freq - freq) < 0.001) ?? null;

/** VOR reception range (NM) at the course's cruise altitudes. */
export const VOR_RANGE_NM = 60;
