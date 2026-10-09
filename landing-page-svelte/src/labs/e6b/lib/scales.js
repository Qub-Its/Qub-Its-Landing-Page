// Maths of the mechanical E6B: log scale, conversion markers, ISA atmosphere and the TAS / density-altitude
// windows. Pure JS, no DOM. Screen angles are degrees clockwise from 12 o'clock; the 10 index sits at 0°.
// Computer-side state `rot` turns the inner disc clockwise: inner value v is drawn at theta(v) + rot.

// ---------------------------------------------------------------------------------------------------------
// Angles and the log scale
// ---------------------------------------------------------------------------------------------------------

/** Angle in [0, 360). */
export const norm360 = (a) => ((a % 360) + 360) % 360;
/** Signed difference a − b in (−180, 180]. */
export function angleDiff(a, b) {
  const d = norm360(a - b);
  return d > 180 ? d - 360 : d;
}

const frac = (x) => x - Math.floor(x);

/** Screen angle (deg) of a value on the log scale; any power of ten is at 0°. */
export const theta = (v) => 360 * frac(Math.log10(v));
/** Mantissa of v in [10, 100). */
export const mantissa = (v) => Math.pow(10, 1 + frac(Math.log10(v)));
const fromAngle = (a) => Math.pow(10, 1 + norm360(a) / 360);

/** Disc rotation that puts inner value `inner` under outer value `outer`. */
export const rotFor = (outer, inner) => norm360(theta(outer) - theta(inner));
/** Outer-scale reading (mantissa) over inner value `inner`. */
export const outerAt = (rot, inner) => fromAngle(theta(inner) + rot);
/** Inner-scale reading (mantissa) under outer value `outer`. */
export const innerAt = (rot, outer) => fromAngle(theta(outer) - rot);

/** Conversion arrows on the outer scale (mantissa positions). */
export const MARKERS = [
  { id: 'naut', v: 66, label: 'NAUT' },
  { id: 'stat', v: 76, label: 'STAT' },
  { id: 'km', v: 12.2, label: 'KM' },
  { id: 'gal', v: 11.67, label: 'U.S. GAL' },
  { id: 'liters', v: 44.17, label: 'LITERS' },
  { id: 'lbs', v: 70, label: 'FUEL LBS' },
  { id: 'meters', v: 15.24, label: 'METERS' },
  { id: 'feet', v: 50, label: 'FEET' }
];
/** Speed index (inner scale 60 = one hour) and seconds index (36 = 3600 s). */
export const SPEED_INDEX = 60;
export const SECONDS_INDEX = 36;

/**
 * Ticks of the 10–100 scale (100 excluded, it is the 10 index again).
 * 10–20: 0.1 / 0.5 / 1; 20–50: 0.5 / 1 / 5; 50–100: 1 / 5.
 * @returns {{v:number, size:'major'|'mid'|'minor', label?:string}[]}
 */
export function logTicks() {
  const out = [];
  const add = (v, size, label) => out.push(label ? { v, size, label } : { v, size });
  for (let i = 100; i < 200; i++) {
    const v = i / 10;
    if (i % 10 === 0) add(v, 'major', String(v));
    else add(v, i % 5 === 0 ? 'mid' : 'minor');
  }
  for (let j = 40; j < 100; j++) {
    const v = j / 2;
    if (!Number.isInteger(v)) add(v, 'minor');
    else if (v % 5 === 0) add(v, 'major', String(v));
    else if (v <= 25 || (v <= 40 && v % 2 === 0)) add(v, 'mid', String(v));
    else add(v, 'mid');
  }
  for (let v = 50; v < 100; v++) {
    if (v % 5 === 0) add(v, 'major', String(v));
    else add(v, 'minor');
  }
  return out;
}

/** Hours-ring labels (minutes → h:mm). */
export function hoursLabels() {
  return [60, 70, 80, 90, 100, 120, 150, 180, 210, 240, 300, 360, 420, 480, 540].map((min) => ({ min, label: fmtHm(min) }));
}

// ---------------------------------------------------------------------------------------------------------
// ISA atmosphere (feet, °C)
// ---------------------------------------------------------------------------------------------------------

/** Pressure ratio at pressure altitude. */
export const deltaP = (pa) => Math.pow(1 - 6.8756e-6 * pa, 5.2559);
/** ISA temperature (°C). */
export const tStdC = (pa) => 15 - 0.0019812 * pa;
/** Density ratio at pressure altitude and OAT. */
export const sigma = (pa, oatC) => (deltaP(pa) * 288.15) / (oatC + 273.15);
/** Standard density ratio at altitude h. */
export const sigmaStd = (h) => Math.pow(1 - 6.8756e-6 * h, 4.2559);
/** Density altitude (ft): altitude where the ISA density ratio equals sigma(pa, oatC). */
export function densityAltitude(pa, oatC) {
  return (1 - Math.pow(sigma(pa, oatC), 1 / 4.2559)) / 6.8756e-6;
}
/** TAS / CAS. */
export const tasFactor = (pa, oatC) => 1 / Math.sqrt(sigma(pa, oatC));
/** True airspeed from calibrated airspeed (no compressibility, like the E6B). */
export const trueAirspeed = (cas, pa, oatC) => cas * tasFactor(pa, oatC);

// ---------------------------------------------------------------------------------------------------------
// TAS and density-altitude windows
// ---------------------------------------------------------------------------------------------------------

export const TAS_A0 = 215;
/** PA mark angle on the disc (add `rot` for screen). */
export const paAngle = (pa) => TAS_A0 + 180 * Math.log10(deltaP(pa));
/** Temperature mark angle on the base (screen). */
export const oatAngle = (c) => TAS_A0 + 180 * Math.log10((c + 273.15) / 288.15);
/** Disc rotation that aligns PA with OAT; TAS (outer) then sits over CAS (inner). */
export const tasRot = (pa, c) => norm360(oatAngle(c) - paAngle(pa));

export const DA_INDEX = 330;
/** DA mark angle on the disc (add `rot` for screen). */
export const daAngle = (h) => DA_INDEX + 180 * Math.log10(sigmaStd(h));
/** Density altitude under the DA index for disc rotation `rot` (inverse of the window). */
export function daAt(rot) {
  const s = Math.pow(10, -angleDiff(rot, 0) / 180);
  return (1 - Math.pow(s, 1 / 4.2559)) / 6.8756e-6;
}

// ---------------------------------------------------------------------------------------------------------
// Temperature and time
// ---------------------------------------------------------------------------------------------------------

export const cToF = (c) => (c * 9) / 5 + 32;
export const fToC = (f) => ((f - 32) * 5) / 9;

/** Minutes → "h:mm". */
export function fmtHm(min) {
  const t = Math.round(min);
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
}
/** "h:mm" → minutes (NaN if invalid). */
export function parseHm(str) {
  const m = /^\s*(\d+):(\d{1,2})\s*$/.exec(String(str));
  return m ? Number(m[1]) * 60 + Number(m[2]) : NaN;
}
