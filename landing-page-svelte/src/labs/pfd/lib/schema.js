// Flight state contract shared by the simulation (sim.js, autoflight.js), the reactive store
// (flight.svelte.js), the PFD instruments, the FCU and the exercise checks. Plain data only, so the
// logic can run in Node (scripts/check-pfd.mjs) and a future 3D view can read the same object.
//
// Conventions: angles in degrees, pitch + nose up, bank + right wing down, headings 0–359 magnetic,
// speeds in knots (IAS unless named otherwise), altitude in feet, vertical speed in ft/min.

/** @typedef {'0'|'1'|'1+F'|'2'|'3'|'FULL'} Flaps */
/** @typedef {'IDLE'|'CL'|'FLX'|'TOGA'} ThrustDetent */

/**
 * @typedef {object} Speeds Characteristic speeds drawn on the speed tape; null = not displayed.
 * @property {number|null} vls     lowest selectable speed (amber strip)
 * @property {number|null} vaProt  alpha protection (amber/black barber)
 * @property {number|null} vaMax   alpha max (red strip)
 * @property {number|null} vmax    VMO/VFE of the current configuration (red/black barber)
 * @property {number|null} greenDot best lift/drag, clean only
 * @property {number|null} s       slat retraction speed (config 1)
 * @property {number|null} f       flap retraction speed (config 2/3)
 * @property {number|null} v1      takeoff only (cyan "1")
 */

/**
 * @typedef {object} Fcu Flight Control Unit. "managed" = pushed (dashes on the FCU, magenta targets);
 * selected = pulled (value shown, cyan targets).
 * @property {number} spd            selected IAS target (kt)
 * @property {number} mach           selected Mach target
 * @property {boolean} spdIsMach     SPD/MACH toggle
 * @property {boolean} spdManaged
 * @property {number} hdg            selected heading
 * @property {boolean} hdgManaged    true → NAV (or RWY/LOC)
 * @property {number} alt            FCU altitude (ft, 100 ft steps)
 * @property {number} vs             selected V/S (fpm), used when vsActive
 * @property {boolean} vsActive      V/S knob pulled
 * @property {boolean} ap1
 * @property {boolean} ap2
 * @property {boolean} athr          A/THR pushbutton (armed or active, see fma.engagement.athr)
 * @property {boolean} fd            FD on (both sides in MVP1)
 * @property {boolean} loc           LOC pushbutton
 * @property {boolean} appr          APPR pushbutton
 */

/**
 * @typedef {object} Fma Flight Mode Annunciator, 5 columns. Empty string = blank.
 * @property {string} athr            col1 row1: SPEED | MACH | THR CLB | THR IDLE | MAN TOGA | MAN FLX | THR LVR
 * @property {string} vertical        col2 row1: SRS | CLB | OP CLB | DES | OP DES | ALT* | ALT | V/S +1000 | G/S* | G/S
 * @property {string} verticalArmed   col2 row2 (cyan): ALT | G/S | CLB …
 * @property {string} lateral         col3 row1: RWY | NAV | HDG | LOC* | LOC
 * @property {string} lateralArmed    col3 row2 (cyan): NAV | LOC
 * @property {string} approach        col4: CAT 1 | CAT 3 DUAL | '' (white)
 * @property {string} message         row3 col1–3 text (white/amber): e.g. 'LVR CLB' (flashing in reality)
 * @property {{ap: string, fd: string, athr: string, athrArmed: boolean}} engagement
 *   col5: ap = 'AP1' | 'AP2' | 'AP1+2' | ''; fd = '1 FD 2' | ''; athr = 'A/THR' | ''; athrArmed → cyan
 * @property {Record<'athr'|'vertical'|'lateral'|'approach'|'engagement', number>} changedAt
 *   sim time (s) when each column's row-1 value last changed; the instrument draws a white box while
 *   simTime - changedAt < 10
 */

/**
 * @typedef {object} FlightState
 * @property {number} simTime    seconds since scenario start
 * @property {boolean} paused
 * @property {string} scenario   id from scenarios.js
 * @property {number} pitch
 * @property {number} bank
 * @property {number} fpa        flight path angle (deg)
 * @property {number} aoa        angle of attack (deg)
 * @property {number} ias
 * @property {number} iasTrend   predicted IAS change in 10 s (kt); arrow drawn when |iasTrend| ≥ 2
 * @property {number} mach
 * @property {number} alt        baro altitude (ft)
 * @property {number} vs         ft/min
 * @property {number} hdg
 * @property {number} track
 * @property {number|null} radioAlt  ft above ground; null when > 2500 (not displayed)
 * @property {number} groundElev     terrain/runway elevation (ft) under the aircraft
 * @property {{std: boolean, hpa: number}} baro
 * @property {Flaps} flaps
 * @property {boolean} gearDown
 * @property {number} weight     tonnes
 * @property {Speeds} speeds
 * @property {{pitch: number, roll: number}} stick  pilot input, −1…1 (pitch + = pull / nose up, roll + = right)
 * @property {ThrustDetent} thrust               thrust lever detent
 * @property {number} n1          engine N1 % (approx)
 * @property {Fcu} fcu
 * @property {Fma} fma
 * @property {{visible: boolean, loc: number, gs: number, ident: string, freq: string, course: number}} ils
 *   loc/gs deviations in dots (−2…+2; + = beam is right/above), visible = scales drawn
 * @property {{show: boolean, pitch: number, roll: number}} fd  FD bar commands: deviation from the
 *   aircraft symbol in deg of pitch / deg of bank to fly to; show = bars drawn
 */

/** @returns {FlightState} */
export function createInitialState() {
  return {
    simTime: 0,
    paused: false,
    scenario: 'cruise',
    pitch: 2.5,
    bank: 0,
    fpa: 0,
    aoa: 2.5,
    ias: 250,
    iasTrend: 0,
    mach: 0.52,
    alt: 10000,
    vs: 0,
    hdg: 90,
    track: 90,
    radioAlt: null,
    groundElev: 0,
    baro: { std: false, hpa: 1013 },
    flaps: '0',
    gearDown: false,
    weight: 64,
    speeds: { vls: 190, vaProt: 165, vaMax: 150, vmax: 350, greenDot: 210, s: null, f: null, v1: null },
    stick: { pitch: 0, roll: 0 },
    thrust: 'CL',
    n1: 75,
    fcu: {
      spd: 250, mach: 0.78, spdIsMach: false, spdManaged: true,
      hdg: 90, hdgManaged: false,
      alt: 10000, vs: 0, vsActive: false,
      ap1: true, ap2: false, athr: true, fd: true, loc: false, appr: false
    },
    fma: {
      athr: 'SPEED', vertical: 'ALT', verticalArmed: '', lateral: 'HDG', lateralArmed: '', approach: '', message: '',
      engagement: { ap: 'AP1', fd: '1 FD 2', athr: 'A/THR', athrArmed: false },
      changedAt: { athr: -99, vertical: -99, lateral: -99, approach: -99, engagement: -99 }
    },
    ils: { visible: false, loc: 0, gs: 0, ident: 'IMRC', freq: '109.30', course: 70 },
    fd: { show: true, pitch: 0, roll: 0 }
  };
}
