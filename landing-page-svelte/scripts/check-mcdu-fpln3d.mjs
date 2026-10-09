// Checks for the MCDU trainer's 3D flight plan map geometry (fpln3d/route.js).
// Run from landing-page-svelte/:  node scripts/check-mcdu-fpln3d.mjs
import assert from 'node:assert/strict';
import { haversineNm, project, runwayHeading, buildRoute, profileAt, pointAt } from '../src/labs/mcdu/fpln3d/route.js';

let passed = 0, failed = 0;
function check(name, fn) {
  try { fn(); passed++; console.log(`  ok   ${name}`); }
  catch (e) { failed++; console.log(`  FAIL ${name}\n       ${e.message}`); }
}
const near = (a, b, eps, msg = '') => assert.ok(Math.abs(a - b) <= eps, `${msg} ${a} ≉ ${b} (±${eps})`);

// Fixture copied from the trainer database (src/labs/mcdu/trainer.js: AP, WP, CO.MROCKMIA1).
const AP = {
  MROC: { lat: 9.9939, lon: -84.2088, el: 3021, rwys: [['07', 3012], ['25', 3012]] },
  MRLB: { lat: 10.5933, lon: -85.5444, el: 270, rwys: [['07', 2750], ['25', 2750]] },
  KMIA: { lat: 25.7932, lon: -80.2906, el: 8, rwys: [['08R', 3962], ['09', 2621], ['12', 2851], ['27', 2621]] },
};
const WP = { ESPOX: [11.20, -83.90], TALUK: [13.50, -83.20], BOLOS: [16.00, -82.50], GUSKE: [18.70, -81.90], URSUS: [21.30, -81.30], PIKIS: [23.60, -80.70] };
const apt = (id, kind) => ({ t: 'wpt', id, kind, lat: AP[id].lat, lon: AP[id].lon });
const wpt = (id) => ({ t: 'wpt', id, lat: WP[id][0], lon: WP[id][1] });
const snap = (items, extra = {}) => ({ items, tmpy: false, crz: null, depRwy: null, arrRwy: null,
  airports: Object.fromEntries(items.filter((i) => i.kind).map((i) => [i.id, AP[i.id]])), ...extra });
const coRoute = ['ESPOX', 'TALUK', 'BOLOS', 'GUSKE', 'URSUS', 'PIKIS'].map(wpt);
const full = (extra) => snap([apt('MROC', 'orig'), ...coRoute, apt('KMIA', 'dest')], extra);

check('project: east → +x, north → −z', () => {
  const p = project([{ lat: 10, lon: -84 }, { lat: 20, lon: -80 }]);
  const [x1, z1] = p.toXZ(15, -81), [x0, z0] = p.toXZ(15, -82);
  assert.ok(x1 > x0, 'east is +x');
  const [, zn] = p.toXZ(16, -82); assert.ok(zn < z0, 'north is −z');
});
check('project: MROC→KMIA length within 2 % of haversine', () => {
  const a = AP.MROC, b = AP.KMIA, p = project([a, b]);
  const [ax, az] = p.toXZ(a.lat, a.lon), [bx, bz] = p.toXZ(b.lat, b.lon);
  const flat = Math.hypot(bx - ax, bz - az), gc = haversineNm(a, b);
  assert.ok(Math.abs(flat - gc) / gc < 0.02, `${flat} vs ${gc}`);
});
check('runwayHeading', () => {
  assert.equal(runwayHeading('08R'), 80); assert.equal(runwayHeading('27'), 270); assert.equal(runwayHeading('36'), 0);
});
check('profile with CRZ FL350: TOC, cruise, TOD where the rules put them', () => {
  const r = buildRoute(full({ crz: 350 }));
  near(r.toc.distNm, 2.5 * (35000 - 3021) / 1000, 1e-6, 'TOC');
  near(r.totalNm - r.tod.distNm, 3 * (35000 - 8) / 1000, 1e-6, 'TOD');
  assert.equal(r.flat, false);
  for (const p of r.points.slice(1, -1)) {
    if (p.distNm >= r.toc.distNm && p.distNm <= r.tod.distNm) assert.equal(p.altFt, 35000, p.id);
    else assert.ok(p.altFt < 35000 && p.altFt > 3021 - 1, `${p.id} climbing/descending: ${p.altFt}`);
  }
  assert.ok(r.points.filter((p) => p.altFt === 35000).length >= 4, 'most of the route at cruise');
  assert.equal(r.points[0].altFt, 3021); assert.equal(r.points.at(-1).altFt, 8);
});
check('short route (MROC→MRLB, FL350): peaks below cruise, no TOC/TOD', () => {
  const r = buildRoute(snap([apt('MROC', 'orig'), apt('MRLB', 'dest')], { crz: 350 }));
  assert.equal(r.toc, null); assert.equal(r.tod, null); assert.ok(r.peak);
  assert.ok(r.peak.altFt < 35000 && r.peak.altFt > 3021, `peak ${r.peak.altFt}`);
  near(profileAt(r, r.peak.distNm), r.peak.altFt, 1e-6);
  assert.ok(r.segments[0].pts.length === 3, 'peak inserted in the leg');
});
check('no CRZ → flat at origin elevation', () => {
  const r = buildRoute(full());
  assert.equal(r.flat, true);
  for (const p of r.points) assert.equal(p.altFt, 3021);
});
check('discontinuity → disco leg (dashed), not skipped', () => {
  const r = buildRoute(snap([apt('MROC', 'orig'), { t: 'disco' }, apt('KMIA', 'dest')]));
  assert.equal(r.legs.length, 1); assert.equal(r.legs[0].disco, true); assert.equal(r.segments[0].disco, true);
});
check('fewer than two waypoints → empty legs, no throw', () => {
  for (const items of [[], [apt('MROC', 'orig')], [{ t: 'disco' }]]) {
    const r = buildRoute(snap(items));
    assert.equal(r.legs.length, 0); assert.equal(r.totalNm, 0); assert.equal(r.toc, null);
  }
  assert.doesNotThrow(() => buildRoute(null));
});
check('pointAt: ends and middle follow the route and profile', () => {
  const r = buildRoute(full({ crz: 350 }));
  const a = pointAt(r, 0), b = pointAt(r, 1), m = pointAt(r, 0.5);
  near(a.x, r.points[0].x, 1e-9); near(a.z, r.points[0].z, 1e-9);
  near(b.x, r.points.at(-1).x, 1e-9); near(b.z, r.points.at(-1).z, 1e-9);
  near(m.altFt, profileAt(r, r.totalNm / 2), 1e-9);
  assert.ok(a.headingDeg > 0 && a.headingDeg < 90, `initial heading NE: ${a.headingDeg}`);
});
check('real trainer route: finite numbers everywhere', () => {
  const r = buildRoute(full({ crz: 370, depRwy: '07', arrRwy: '08R' }));
  const nums = [r.totalNm, ...r.points.flatMap((p) => [p.x, p.z, p.distNm, p.altFt]), ...r.segments.flatMap((s) => s.pts.flatMap((p) => [p.x, p.z, p.altFt]))];
  assert.ok(nums.every(Number.isFinite));
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
