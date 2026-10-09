// Line-replaceable units of the C172 NAV III G1000 for the exploded-architecture scene and lesson 1.
// `pos` is the exploded position (metres, scene frame: x right, y up, z toward the viewer), `flows` the data
// buses drawn as pulse lines (from → to).

/** @typedef {{ id: string, part: string, model: string, name: {es: string, en: string}, pos: [number, number, number], size: [number, number, number] }} Lru */

/** @type {Lru[]} */
export const LRUS = [
  { id: 'gdu1', part: 'lru.gdu', model: 'GDU 1040', name: { es: 'PFD (pantalla)', en: 'PFD (display)' }, pos: [-0.9, 1.2, 0], size: [0.8, 0.55, 0.12] },
  { id: 'gdu2', part: 'lru.gdu', model: 'GDU 1040', name: { es: 'MFD (pantalla)', en: 'MFD (display)' }, pos: [0.9, 1.2, 0], size: [0.8, 0.55, 0.12] },
  { id: 'gma', part: 'lru.gma', model: 'GMA 1347', name: { es: 'Panel de audio', en: 'Audio panel' }, pos: [0, 1.2, 0.05], size: [0.15, 0.55, 0.12] },
  { id: 'gia1', part: 'lru.gia', model: 'GIA 63W', name: { es: 'Integrada 1: GPS/WAAS, COM1, NAV1', en: 'Integrated 1: GPS/WAAS, COM1, NAV1' }, pos: [-0.9, 0.35, -0.3], size: [0.35, 0.18, 0.5] },
  { id: 'gia2', part: 'lru.gia', model: 'GIA 63W', name: { es: 'Integrada 2: GPS/WAAS, COM2, NAV2', en: 'Integrated 2: GPS/WAAS, COM2, NAV2' }, pos: [0.9, 0.35, -0.3], size: [0.35, 0.18, 0.5] },
  { id: 'ahrs', part: 'lru.ahrs', model: 'GRS 77', name: { es: 'AHRS: actitud y rumbo', en: 'AHRS: attitude and heading' }, pos: [-0.5, -0.5, -0.6], size: [0.3, 0.15, 0.3] },
  { id: 'gmu', part: 'lru.gmu', model: 'GMU 44', name: { es: 'Magnetómetro', en: 'Magnetometer' }, pos: [-1.6, -0.4, -1.2], size: [0.18, 0.08, 0.18] },
  { id: 'adc', part: 'lru.adc', model: 'GDC 74A', name: { es: 'Computadora de datos de aire', en: 'Air data computer' }, pos: [0.5, -0.5, -0.6], size: [0.3, 0.15, 0.3] },
  { id: 'pitot', part: 'lru.pitot', model: 'Pitot / static / OAT', name: { es: 'Pitot, estática y OAT', en: 'Pitot, static and OAT' }, pos: [1.6, -0.4, -1.2], size: [0.1, 0.1, 0.35] },
  { id: 'gea', part: 'lru.gea', model: 'GEA 71', name: { es: 'Unidad de motor (EIS)', en: 'Engine unit (EIS)' }, pos: [1.4, 0.3, -0.9], size: [0.3, 0.12, 0.25] },
  { id: 'gtx', part: 'lru.gtx', model: 'GTX 33', name: { es: 'Transponder', en: 'Transponder' }, pos: [-1.4, 0.3, -0.9], size: [0.3, 0.12, 0.25] },
  { id: 'ant', part: 'lru.ant', model: 'GA 56 / COM / NAV', name: { es: 'Antenas GPS, COM y NAV', en: 'GPS, COM and NAV antennas' }, pos: [0, 0.9, -1.5], size: [0.3, 0.05, 0.2] },
];

/** Data flows (lesson 1 cues and the "what feeds what" story). */
export const FLOWS = [
  { id: 'airData', path: ['pitot', 'adc', 'gia1', 'gdu1'], name: { es: 'Velocidad, altitud y VSI', en: 'Airspeed, altitude and VSI' } },
  { id: 'attitude', path: ['gmu', 'ahrs', 'gia1', 'gdu1'], name: { es: 'Actitud y rumbo', en: 'Attitude and heading' } },
  { id: 'gps', path: ['ant', 'gia1', 'gdu1'], name: { es: 'Posición GPS y radios', en: 'GPS position and radios' } },
  { id: 'engine', path: ['gea', 'gia2', 'gdu2'], name: { es: 'Datos de motor al EIS', en: 'Engine data to the EIS' } },
  { id: 'xpdr', path: ['gia1', 'gtx'], name: { es: 'Código y altitud al transponder', en: 'Code and altitude to the transponder' } },
];

/** Exploded-scene cue targets: every LRU and every flow id. */
export const EXPLODE_NODES = ['all', ...LRUS.map((l) => l.id), ...FLOWS.map((f) => f.id)];
