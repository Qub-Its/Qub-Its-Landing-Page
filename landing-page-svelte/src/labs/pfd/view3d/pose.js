// Pure attitude / flight-path math for the 3D exterior view. No three.js import: runs in Node checks.
// World: right-handed, y up, −z = north, +x = east. Aircraft model: nose −z, right wing +x, up +y.
// Euler order 'YXZ' (as three.js): yaw = −hdg, pitch = +pitch, roll = −bank (bank + = right wing down).
const rad = (d) => (d * Math.PI) / 180;
const num = (v) => (Number.isFinite(v) ? v : 0);

/**
 * @param {{pitch: number, bank: number, hdg: number, fpa: number, track: number}} s flight state (degrees)
 * @returns {{yaw: number, pitch: number, roll: number, fpv: [number, number, number], aoa: number, fpa: number}}
 *   yaw/pitch/roll in radians for the body; fpv = unit flight-path vector (world); aoa/fpa in degrees for labels
 */
export function poseFrom(s) {
  const pitch = num(s?.pitch), bank = num(s?.bank), hdg = num(s?.hdg), fpa = num(s?.fpa), track = num(s?.track);
  const g = rad(fpa), x = rad(track);
  return {
    yaw: -rad(hdg),
    pitch: rad(pitch),
    roll: -rad(bank),
    fpv: [Math.sin(x) * Math.cos(g), Math.sin(g), -Math.cos(x) * Math.cos(g)],
    aoa: pitch - fpa,
    fpa,
  };
}

/** Rotates a body-frame vector into the world like three.js Euler 'YXZ' (R = Ry · Rx · Rz). */
export function rotate([x, y, z], { yaw, pitch, roll }) {
  const x1 = x * Math.cos(roll) - y * Math.sin(roll), y1 = x * Math.sin(roll) + y * Math.cos(roll), z1 = z;
  const y2 = y1 * Math.cos(pitch) - z1 * Math.sin(pitch), z2 = y1 * Math.sin(pitch) + z1 * Math.cos(pitch);
  return [x1 * Math.cos(yaw) + z2 * Math.sin(yaw), y2, -x1 * Math.sin(yaw) + z2 * Math.cos(yaw)];
}

/** World → body frame: undoes 'YXZ' in reverse order (Ry⁻¹, then Rx⁻¹, then Rz⁻¹). */
export function toBody(v, { yaw, pitch, roll }) {
  return rotate(rotate(rotate(v, { yaw: -yaw, pitch: 0, roll: 0 }), { yaw: 0, pitch: -pitch, roll: 0 }), { yaw: 0, pitch: 0, roll: -roll });
}

/**
 * AoA arc in the body frame: n points of radius r from the nose axis (0, 0, −1) to the FPV, in the plane those two
 * span (a slerp), so it always ends on the FPV, whatever the bank.
 * @param {ReturnType<typeof poseFrom>} p
 * @returns {{points: Float32Array, angle: number}} angle in degrees between nose and FPV
 */
export function aoaArc(p, n, r) {
  const a = [0, 0, -1], b = toBody(p.fpv, p);
  const ang = Math.acos(Math.min(1, Math.max(-1, -b[2])));
  const points = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const [wa, wb] = ang < 1e-6 ? [1 - t, t] : [Math.sin((1 - t) * ang) / Math.sin(ang), Math.sin(t * ang) / Math.sin(ang)];
    for (let k = 0; k < 3; k++) points[i * 3 + k] = r * (wa * a[k] + wb * b[k]);
  }
  return { points, angle: (ang * 180) / Math.PI };
}
