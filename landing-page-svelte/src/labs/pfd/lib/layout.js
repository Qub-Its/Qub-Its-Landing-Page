// PFD geometry and colours. Every instrument draws inside the single <svg viewBox="0 0 600 560"> of
// Pfd.svelte, in its own region below, so components can be built independently and still line up.
// Rule: an instrument never draws outside its region (use a clipPath for moving scales).

export const VIEW = { w: 600, h: 560 };

// Common horizontal reference: the aircraft symbol, speed and altitude readout windows share y = CY.
export const CY = 275;

export const REGIONS = {
  fma:      { x: 0,   y: 0,   w: 600, h: 72 },   // 5 columns × 3 rows
  speed:    { x: 40,  y: 105, w: 95,  h: 340 },  // tape incl. readout window and target/trend symbols
  mach:     { x: 40,  y: 452, w: 95,  h: 22 },   // Mach readout under the speed tape
  attitude: { x: 160, y: 105, w: 280, h: 340 },  // sphere + bank scale + FD; aircraft symbol at (CX, CY)
  ils:      { x: 160, y: 445, w: 280, h: 20 },   // LOC scale under the sphere; G/S scale at x 440–452 beside it
  heading:  { x: 160, y: 470, w: 280, h: 50 },   // heading tape
  altitude: { x: 458, y: 105, w: 80,  h: 340 },  // tape incl. drum window and selected altitude
  baro:     { x: 458, y: 452, w: 80,  h: 22 },   // QNH 1013 / STD
  vsi:      { x: 545, y: 120, w: 50,  h: 310 },  // vertical speed scale and needle
  ilsInfo:  { x: 4,   y: 520, w: 150, h: 38 }    // ILS ident / freq, bottom-left
};

export const CX = REGIONS.attitude.x + REGIONS.attitude.w / 2; // 300

// Scales
export const PX_PER_DEG_PITCH = 7;     // pitch ladder spacing
export const PX_PER_KT = 4;            // speed tape: 10 kt = 40 px, ≈ ±42 kt visible
export const PX_PER_FT = 0.3;          // altitude tape: 100 ft = 30 px, ≈ ±560 ft visible
export const PX_PER_DEG_HDG = 5;       // heading tape: ≈ ±28° visible
export const PX_PER_DOT = 26;          // ILS deviation scales (2 dots each side)

// Airbus display colours (see the design spec)
export const C = {
  bg: '#000000',
  sky: '#1b8fd6',
  ground: '#8a5a2b',
  white: '#ffffff',
  yellow: '#fff23c',
  green: '#3ff27c',
  cyan: '#30d3f2',
  magenta: '#ff5cf6',
  amber: '#ffa31a',
  red: '#ff2a1a',
  tape: '#4a4f55',
  font: "'B612 Mono', ui-monospace, Menlo, Consolas, monospace"
};

// Text sizes (SVG user units) so all instruments look like one display.
export const FONT = { small: 13, normal: 16, large: 20 };

// Shared helpers
export const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
export const wrap360 = (deg) => ((deg % 360) + 360) % 360;
/** Signed smallest difference a − b in degrees, −180…180. */
export const angleDiff = (a, b) => ((((a - b) % 360) + 540) % 360) - 180;
