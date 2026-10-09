// Pure navigation maths (great circle on a sphere, nautical miles, degrees). Variation is zero in the course world.
// Sign conventions: xtk > 0 means the aircraft is RIGHT of the course; CDI deflection > 0 means the needle is right
// of centre (the course lies to the right, steer right).

export const R_NM = 3440.065;
const rad = (d) => (d * Math.PI) / 180;
const deg = (r) => (r * 180) / Math.PI;

/** Normalizes to [0, 360). */
export const norm360 = (x) => ((x % 360) + 360) % 360;
/** Signed difference a − b in (−180, 180]. */
export function angleDiff(a, b) {
  const d = norm360(a - b);
  return d > 180 ? d - 360 : d;
}

/** @typedef {{ lat: number, lon: number }} LatLon */

/** Great-circle distance in NM. */
export function distNm(a, b) {
  const dLat = rad(b.lat - a.lat), dLon = rad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R_NM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Initial great-circle bearing from a to b, [0, 360). */
export function brgDeg(a, b) {
  const φ1 = rad(a.lat), φ2 = rad(b.lat), dλ = rad(b.lon - a.lon);
  const y = Math.sin(dλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(dλ);
  return norm360(deg(Math.atan2(y, x)));
}

/** Point `nm` away from p on bearing `brg`. */
export function destination(p, brg, nm) {
  const δ = nm / R_NM, θ = rad(brg), φ1 = rad(p.lat), λ1 = rad(p.lon);
  const φ2 = Math.asin(Math.sin(φ1) * Math.cos(δ) + Math.cos(φ1) * Math.sin(δ) * Math.cos(θ));
  const λ2 = λ1 + Math.atan2(Math.sin(θ) * Math.sin(δ) * Math.cos(φ1), Math.cos(δ) - Math.sin(φ1) * Math.sin(φ2));
  return { lat: deg(φ2), lon: ((deg(λ2) + 540) % 360) - 180 };
}

/** Cross-track distance (NM) of p from the great circle from → to; > 0 right of course. */
export function xtkNm(from, to, p) {
  const d13 = distNm(from, p) / R_NM;
  if (d13 === 0) return 0;
  return Math.asin(Math.sin(d13) * Math.sin(rad(brgDeg(from, p) - brgDeg(from, to)))) * R_NM;
}

/**
 * Guidance along the leg from → to for the aircraft at p.
 * @returns {{ dtk: number, dis: number, brg: number, xtk: number }}
 */
export function legGuidance(from, to, p) {
  return { dtk: brgDeg(from, to), dis: distNm(p, to), brg: brgDeg(p, to), xtk: xtkNm(from, to, p) };
}

/**
 * Guidance on a course `crs` through `fix` (GPS OBS mode or a VOR radial): the course line ends at the fix.
 * @returns {{ dtk: number, dis: number, brg: number, xtk: number, toFrom: 'TO'|'FROM' }}
 */
export function courseGuidance(fix, crs, p) {
  const from = destination(fix, crs + 180, 200);
  const toFrom = Math.abs(angleDiff(brgDeg(p, fix), crs)) < 90 ? 'TO' : 'FROM';
  return { dtk: norm360(crs), dis: distNm(p, fix), brg: brgDeg(p, fix), xtk: xtkNm(from, fix, p), toFrom };
}

/** Radial (bearing FROM the station) the aircraft is on. */
export const radialOf = (station, p) => brgDeg(station, p);

/**
 * VOR CDI for a selected course: angular deviation, full scale ±10°.
 * @returns {{ toFrom: 'TO'|'FROM', defl: number }} defl in [−1, 1], > 0 needle right.
 */
export function vorCdi(station, crs, p) {
  const toBrg = brgDeg(p, station);
  if (Math.abs(angleDiff(toBrg, crs)) < 90) return { toFrom: 'TO', defl: clamp1(angleDiff(toBrg, crs) / 10) };
  return { toFrom: 'FROM', defl: clamp1(-angleDiff(radialOf(station, p), crs) / 10) };
}

/** GPS CDI deflection from cross-track, full scale `fsNm` (enroute 2.0 NM). */
export const gpsDefl = (xtk, fsNm = 2) => clamp1(-xtk / fsNm);

const clamp1 = (v) => Math.max(-1, Math.min(1, v));

/** Turn anticipation (NM) for a standard-rate (3°/s) turn of `delta` degrees at ground speed `gs` (kt). */
export function turnAnticipationNm(gs, delta) {
  const r = gs / (60 * Math.PI);
  return r * Math.tan(rad(Math.min(Math.abs(delta), 150)) / 2);
}
