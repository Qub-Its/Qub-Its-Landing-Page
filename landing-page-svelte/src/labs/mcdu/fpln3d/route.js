// Pure geometry for the MCDU trainer's 3D flight plan map (no three.js import: runs in Node checks).
// Local equirectangular projection in NM around the route centre: +x = east, −z = north (as the PFD 3D view).
// Vertical profile is a teaching approximation: climb 2.5 NM / 1000 ft, descent 3 NM / 1000 ft (3:1 rule).
const R_NM = 3440.065, rad = Math.PI / 180;
export const CLIMB_NM_PER_KFT = 2.5, DESCENT_NM_PER_KFT = 3;

/** Great-circle distance in NM (same haversine as the trainer's dist()). */
export function haversineNm(a, b) {
  const dLat = (b.lat - a.lat) * rad, dLon = (b.lon - a.lon) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * R_NM * Math.asin(Math.sqrt(h));
}

/** @param {{lat: number, lon: number}[]} pts */
export function project(pts) {
  const n = pts.length || 1;
  const lat0 = pts.reduce((s, p) => s + p.lat, 0) / n, lon0 = pts.reduce((s, p) => s + p.lon, 0) / n;
  const k = 60 * Math.cos(lat0 * rad);
  return { center: { lat: lat0, lon: lon0 }, toXZ: (lat, lon) => [(lon - lon0) * k, -(lat - lat0) * 60] };
}

/** '08R' → 80, '27' → 270, '36' → 0. */
export function runwayHeading(id) {
  const n = parseInt(String(id), 10);
  return Number.isFinite(n) ? (n * 10) % 360 : 0;
}

/** Altitude (ft) at a distance along the route. */
export function profileAt(route, d) {
  const { crzFt, origEl, destEl, totalNm } = route;
  if (crzFt == null || route.points.length < 2) return origEl;
  const up = origEl + (d / CLIMB_NM_PER_KFT) * 1000, down = destEl + ((totalNm - d) / DESCENT_NM_PER_KFT) * 1000;
  return Math.min(Math.max(crzFt, origEl, destEl), up, down);
}

function posAt(route, d) {
  const pts = route.points;
  let i = 1;
  while (i < pts.length - 1 && pts[i].distNm < d) i++;
  const a = pts[i - 1], b = pts[i], span = b.distNm - a.distNm;
  const f = span > 0 ? Math.min(1, Math.max(0, (d - a.distNm) / span)) : 0;
  const headingDeg = (Math.atan2(b.x - a.x, -(b.z - a.z)) / rad + 360) % 360;
  return { x: a.x + (b.x - a.x) * f, z: a.z + (b.z - a.z) * f, headingDeg };
}

const at = (route, d) => { const { x, z } = posAt(route, d); return { distNm: d, x, z, altFt: profileAt(route, d) }; };

/** @param {any} snap mcdu:plan snapshot */
export function buildRoute(snap) {
  const airports = snap?.airports || {};
  const wpts = [];
  let gap = false;
  for (const it of snap?.items || []) {
    if (it?.t === 'disco') { gap = wpts.length > 0; continue; }
    if (it?.t !== 'wpt' || !Number.isFinite(it.lat) || !Number.isFinite(it.lon)) continue;
    wpts.push({ id: it.id, kind: it.kind || 'wpt', lat: it.lat, lon: it.lon, discoBefore: gap });
    gap = false;
  }
  const elOf = (p) => (p && (p.kind === 'orig' || p.kind === 'dest') && Number.isFinite(airports[p.id]?.el) ? airports[p.id].el : 0);
  const origEl = elOf(wpts[0]), destEl = elOf(wpts[wpts.length - 1]);
  const crzFt = Number.isFinite(snap?.crz) && snap.crz > 0 ? snap.crz * 100 : null;
  const proj = project(wpts);
  let cum = 0;
  const points = wpts.map((w, i) => {
    if (i) cum += haversineNm(wpts[i - 1], w);
    const [x, z] = proj.toXZ(w.lat, w.lon);
    return { id: w.id, kind: w.kind, x, z, distNm: cum, altFt: 0, discoBefore: w.discoBefore };
  });
  const route = { points, legs: [], segments: [], toc: null, tod: null, peak: null, totalNm: cum,
    flat: crzFt == null || points.length < 2, crzFt, origEl, destEl, center: proj.center };
  for (const p of points) p.altFt = profileAt(route, p.distNm);
  if (points.length < 2) return route;

  const breaks = [];
  if (crzFt != null) {
    const climbEnd = Math.max(0, ((crzFt - origEl) / 1000) * CLIMB_NM_PER_KFT);
    const descStart = cum - Math.max(0, ((crzFt - destEl) / 1000) * DESCENT_NM_PER_KFT);
    if (climbEnd < descStart) { route.toc = at(route, climbEnd); route.tod = at(route, descStart); breaks.push(route.toc, route.tod); }
    else {
      const k1 = 1000 / CLIMB_NM_PER_KFT, k2 = 1000 / DESCENT_NM_PER_KFT;
      const d = Math.min(cum, Math.max(0, (destEl - origEl + cum * k2) / (k1 + k2)));
      route.peak = at(route, d); breaks.push(route.peak);
    }
  }
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1], b = points[i];
    route.legs.push({ from: i - 1, to: i, disco: b.discoBefore });
    const inner = breaks.filter((p) => p.distNm > a.distNm && p.distNm < b.distNm).sort((p, q) => p.distNm - q.distNm);
    route.segments.push({ disco: b.discoBefore, pts: [a, ...inner, b].map(({ x, z, altFt }) => ({ x, z, altFt })) });
  }
  return route;
}

/** Position, altitude and heading at fraction t ∈ [0, 1] of the route (for "Fly route"). */
export function pointAt(route, t) {
  if (route.points.length < 2) {
    const p = route.points[0] || { x: 0, z: 0, altFt: 0 };
    return { x: p.x, z: p.z, altFt: p.altFt, headingDeg: 0, distNm: 0 };
  }
  const d = Math.min(1, Math.max(0, t)) * route.totalNm;
  const { x, z, headingDeg } = posAt(route, d);
  return { x, z, altFt: profileAt(route, d), headingDeg, distNm: d };
}
