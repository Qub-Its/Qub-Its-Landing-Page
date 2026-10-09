// Endless exam-style problem generator for the E6B trainer. Pure JS, deterministic per (kind, seed).
// Each problem carries typed-answer fields (value + reading tolerance), the initial instrument `setup` and a
// `demo` (Show me): steps that move the instrument to the solution the traditional way.
import { theta, rotFor, MARKERS, SPEED_INDEX, tStdC, densityAltitude, trueAirspeed, tasRot, DA_INDEX, cToF, fmtHm, norm360 } from './scales.js';
import { solveWind, dotFor } from './wind.js';

/** mulberry32: seeded PRNG → () => [0, 1). */
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const KINDS = ['tsd', 'fuel', 'conv', 'tas', 'da', 'wind', 'navlog'];

// ---- helpers --------------------------------------------------------------------------------------------

/** Integer in [lo, hi] stepping by `step`. */
const pick = (r, lo, hi, step = 1) => lo + step * Math.floor(r() * (Math.floor((hi - lo) / step) + 1));
const oneOf = (r, arr) => arr[Math.floor(r() * arr.length)];
const pad3 = (n) => String(Math.round(n)).padStart(3, '0');
/** Number with at most `dec` decimals, no trailing zeros, decimal comma in Spanish. */
const num = (x, lang, dec = 1) => {
  const s = String(Number(x.toFixed(dec)));
  return lang === 'es' ? s.replace('.', ',') : s;
};
/** {es, en} from a function of the language. */
const both = (f) => ({ es: f('es'), en: f('en') });
const lab = (es, en) => ({ es, en });

const SETUP_CALC = { face: 'calc', rot: 0, cursor: 0, dots: 'clear' };
const SETUP_WIND = { face: 'wind', dir: 0, slide: 100, dots: 'clear' };

/** Wind case with a correctable wind (wspd < tas/3) so solveWind is never null. */
function windCase(r) {
  for (let i = 0; i < 50; i++) {
    const c = { tc: pick(r, 5, 360, 5), tas: pick(r, 90, 160, 5), wdir: pick(r, 10, 360, 10), wspd: pick(r, 5, 35) };
    if (c.wspd < c.tas / 3) return c;
  }
  return { tc: 90, tas: 120, wdir: 180, wspd: 20 };
}

/** The four wind-side demo steps (wind up method). */
function windSteps(c, w) {
  const { tc, tas, wdir, wspd } = c;
  return [
    { face: 'wind', dir: wdir, slide: 100, dots: 'clear', say: both((l) => (l === 'es' ? `Pon la dirección del viento (${pad3(wdir)}°) bajo el índice TRUE.` : `Set the wind direction (${pad3(wdir)}°) under the TRUE INDEX.`)) },
    { dots: [dotFor(wdir, wspd)], say: both((l) => (l === 'es' ? `Marca un punto ${wspd} kt por encima del ojal (viento "arriba").` : `Mark a dot ${wspd} kt above the grommet ("wind up").`)) },
    { dir: tc, say: both((l) => (l === 'es' ? `Gira el disco hasta poner el rumbo verdadero (${pad3(tc)}°) bajo el índice; el punto gira con él.` : `Turn the disc to put the true course (${pad3(tc)}°) under the index; the dot turns with it.`)) },
    { slide: w.gs, say: both((l) => (l === 'es' ? `Desliza la tarjeta hasta que el punto caiga en el arco de TAS (${tas} kt). Bajo el ojal lees GS ${Math.round(w.gs)} kt; la deriva (WCA) es ${num(w.wca, l)}° (${w.wca >= 0 ? 'derecha' : 'izquierda'}).` : `Slide the card until the dot sits on the TAS arc (${tas} kt). Under the grommet you read GS ${Math.round(w.gs)} kt; the drift (WCA) is ${num(w.wca, l)}° (${w.wca >= 0 ? 'right' : 'left'}).`)) }
  ];
}

// ---- generators -----------------------------------------------------------------------------------------

function genTsd(r) {
  const v = oneOf(r, ['dist', 'time', 'speed']);
  const speed = pick(r, 90, 160, 5);
  const min = pick(r, 10, 90, 5);
  const distIn = pick(r, 20, 180, 5);
  const idx = SPEED_INDEX;
  if (v === 'dist') {
    const rot = rotFor(speed, idx);
    return {
      prompt: both((l) => (l === 'es' ? `Velocidad ${speed} kt, tiempo ${min} min. ¿Qué distancia se recorre?` : `Ground speed ${speed} kt, time ${min} min. How far do you travel?`)),
      fields: [{ key: 'dist', label: lab('Distancia (NM)', 'Distance (NM)'), value: (speed * min) / 60, tol: { rel: 0.02, abs: 0.5 }, unit: 'NM' }],
      setup: SETUP_CALC,
      demo: [
        { face: 'calc', rot, say: both((l) => (l === 'es' ? `Pon el índice 60 bajo la velocidad (${speed}).` : `Put the 60 index under the speed (${speed}).`)) },
        { cursor: norm360(theta(min) + rot), say: both((l) => (l === 'es' ? `Sobre los ${min} min lees la distancia en la escala exterior.` : `Over ${min} min you read the distance on the outer scale.`)) }
      ]
    };
  }
  if (v === 'time') {
    const rot = rotFor(speed, idx);
    const t = (distIn / speed) * 60;
    return {
      prompt: both((l) => (l === 'es' ? `Velocidad ${speed} kt, distancia ${distIn} NM. ¿Cuánto tiempo tardas (h:mm o minutos)?` : `Ground speed ${speed} kt, distance ${distIn} NM. How long does it take (h:mm or minutes)?`)),
      fields: [{ key: 'time', label: lab('Tiempo (h:mm o min)', 'Time (h:mm or min)'), value: t, tol: { rel: 0.02, abs: 1 }, unit: 'min' }],
      setup: SETUP_CALC,
      demo: [
        { face: 'calc', rot, say: both((l) => (l === 'es' ? `Pon el índice 60 bajo la velocidad (${speed}).` : `Put the 60 index under the speed (${speed}).`)) },
        { cursor: theta(distIn), say: both((l) => (l === 'es' ? `Bajo la distancia (${distIn}) lees el tiempo en la escala interior: ${Math.round(t)} min (${fmtHm(t)}).` : `Under the distance (${distIn}) you read the time on the inner scale: ${Math.round(t)} min (${fmtHm(t)}).`)) }
      ]
    };
  }
  const dist = Math.max(10, Math.round((speed * min) / 60)); // distance flown at a typical speed
  const gs = (dist * 60) / min;
  const rot = rotFor(dist, min);
  return {
    prompt: both((l) => (l === 'es' ? `Recorres ${dist} NM en ${min} min. ¿Qué velocidad sobre el suelo llevas?` : `You fly ${dist} NM in ${min} min. What is your ground speed?`)),
    fields: [{ key: 'gs', label: lab('Velocidad (kt)', 'Speed (kt)'), value: gs, tol: { rel: 0.02, abs: 2 }, unit: 'kt' }],
    setup: SETUP_CALC,
    demo: [
      { face: 'calc', rot, say: both((l) => (l === 'es' ? `Pon el tiempo (${min} min) bajo la distancia (${dist}).` : `Put the time (${min} min) under the distance (${dist}).`)) },
      { cursor: norm360(theta(idx) + rot), say: both((l) => (l === 'es' ? `Sobre el índice 60 lees la velocidad: ${Math.round(gs)} kt.` : `Over the 60 index you read the speed: ${Math.round(gs)} kt.`)) }
    ]
  };
}

function genFuel(r) {
  const ff = pick(r, 6, 14, 0.5);
  const rot = rotFor(ff, SPEED_INDEX);
  const setupDemo = { face: 'calc', rot, say: both((l) => (l === 'es' ? `Pon el índice 60 bajo el consumo (${num(ff, l)} GPH).` : `Put the 60 index under the fuel flow (${num(ff, l)} GPH).`)) };
  if (r() < 0.5) {
    const min = pick(r, 20, 180, 5);
    const gal = (ff * min) / 60;
    return {
      prompt: both((l) => (l === 'es' ? `Consumo ${num(ff, l)} GPH, vuelo de ${fmtHm(min)} (${min} min). ¿Cuánto combustible quemas (gal)?` : `Fuel flow ${num(ff, l)} GPH, flight of ${fmtHm(min)} (${min} min). How much fuel do you burn (gal)?`)),
      fields: [{ key: 'burn', label: lab('Combustible (gal)', 'Fuel (gal)'), value: gal, tol: { rel: 0.02, abs: 0.3 }, unit: 'gal' }],
      setup: SETUP_CALC,
      demo: [setupDemo, { cursor: norm360(theta(min) + rot), say: both((l) => (l === 'es' ? `Sobre los ${min} min lees el combustible: ${num(gal, l)} gal.` : `Over ${min} min you read the fuel: ${num(gal, l)} gal.`)) }]
    };
  }
  const gal = pick(r, 15, 60, 5);
  const t = (gal / ff) * 60;
  return {
    prompt: both((l) => (l === 'es' ? `Tienes ${gal} gal utilizables y consumes ${num(ff, l)} GPH. ¿Cuál es tu autonomía (h:mm o minutos)?` : `You have ${gal} gal usable and burn ${num(ff, l)} GPH. What is your endurance (h:mm or minutes)?`)),
    fields: [{ key: 'endurance', label: lab('Autonomía (h:mm o min)', 'Endurance (h:mm or min)'), value: t, tol: { rel: 0.02, abs: 1 }, unit: 'min' }],
    setup: SETUP_CALC,
    demo: [setupDemo, { cursor: theta(gal), say: both((l) => (l === 'es' ? `Bajo los ${gal} gal lees el tiempo: ${Math.round(t)} min (${fmtHm(t)}).` : `Under ${gal} gal you read the time: ${Math.round(t)} min (${fmtHm(t)}).`)) }]
  };
}

const marker = (id) => MARKERS.find((m) => m.id === id);
// from → to conversions through two outer-scale arrows.
const CONVS = [
  { a: 'naut', b: 'stat', from: 'NM', to: 'SM', lo: 20, hi: 180, step: 5 },
  { a: 'naut', b: 'km', from: 'NM', to: 'km', lo: 20, hi: 180, step: 5, mult: 10 }, // KM arrow is 12.2 = 122 → ×10,
  { a: 'gal', b: 'lbs', from: 'gal', to: 'lb', lo: 10, hi: 60, step: 5 },
  { a: 'gal', b: 'liters', from: 'gal', to: 'L', lo: 10, hi: 60, step: 5 },
  { a: 'meters', b: 'feet', from: 'm', to: 'ft', lo: 500, hi: 3000, step: 100 }
];
const UNIT_ES = { NM: 'millas náuticas', SM: 'millas terrestres', km: 'kilómetros', gal: 'galones US', lb: 'libras', L: 'litros', m: 'metros', ft: 'pies' };
const UNIT_EN = { NM: 'nautical miles', SM: 'statute miles', km: 'kilometres', gal: 'US gallons', lb: 'pounds', L: 'litres', m: 'metres', ft: 'feet' };

function genConv(r) {
  const k = Math.floor(r() * (CONVS.length + 1));
  if (k === CONVS.length) {
    const c = pick(r, -20, 40, 5);
    const f = cToF(c);
    return {
      prompt: both((l) => (l === 'es' ? `Convierte ${c} °C a °F.` : `Convert ${c} °C to °F.`)),
      fields: [{ key: 'f', label: lab('Temperatura (°F)', 'Temperature (°F)'), value: f, tol: { abs: 1.5 }, unit: '°F' }],
      setup: SETUP_CALC,
      demo: [{ face: 'calc', say: both((l) => (l === 'es' ? `Usa la tira de temperatura del lado de cálculo: busca ${c} °C y lee los °F. (Cálculo: °F = °C × 9/5 + 32 = ${num(f, l, 0)} °F.)` : `Use the temperature strip on the computer side: find ${c} °C and read the °F. (Maths: °F = °C × 9/5 + 32 = ${num(f, l, 0)} °F.)`)) }]
    };
  }
  const c = CONVS[k];
  const A = marker(c.a);
  const B = marker(c.b);
  const v = pick(r, c.lo, c.hi, c.step);
  const value = (v * B.v * (c.mult ?? 1)) / A.v;
  const rot = rotFor(A.v, v);
  return {
    prompt: both((l) => (l === 'es' ? `Convierte ${v} ${c.from} a ${c.to} (${UNIT_ES[c.to]}).` : `Convert ${v} ${c.from} to ${c.to} (${UNIT_EN[c.to]}).`)),
    fields: [{ key: 'conv', label: lab(`Resultado (${c.to})`, `Result (${c.to})`), value, tol: { rel: 0.02, abs: 0.5 }, unit: c.to }],
    setup: SETUP_CALC,
    demo: [
      { face: 'calc', rot, say: both((l) => (l === 'es' ? `Pon ${v} (escala interior) bajo la flecha ${A.label}.` : `Put ${v} (inner scale) under the ${A.label} arrow.`)) },
      { cursor: theta(B.v), say: both((l) => (l === 'es' ? `Bajo la flecha ${B.label} lees el resultado: ${num(value, l, value < 100 ? 1 : 0)} ${c.to}.` : `Under the ${B.label} arrow you read the result: ${num(value, l, value < 100 ? 1 : 0)} ${c.to}.`)) }
    ]
  };
}

/** Realistic pressure altitude / OAT pair (OAT near ISA, within -15..+35 °C, step 5). */
function paOat(r) {
  const pa = pick(r, 0, 12000, 500);
  const oat = Math.max(-15, Math.min(35, 5 * Math.round((tStdC(pa) + pick(r, -10, 20, 5)) / 5)));
  return { pa, oat };
}

function genTas(r) {
  const { pa, oat } = paOat(r);
  const cas = pick(r, 90, 160, 5);
  const rot = tasRot(pa, oat);
  const tas = trueAirspeed(cas, pa, oat);
  return {
    prompt: both((l) => (l === 'es' ? `Altitud presión ${pa} ft, OAT ${oat} °C, CAS ${cas} kt. ¿Cuál es la TAS?` : `Pressure altitude ${pa} ft, OAT ${oat} °C, CAS ${cas} kt. What is the TAS?`)),
    fields: [{ key: 'tas', label: lab('TAS (kt)', 'TAS (kt)'), value: tas, tol: { rel: 0.015, abs: 2 }, unit: 'kt' }],
    setup: SETUP_CALC,
    demo: [
      { face: 'calc', rot, say: both((l) => (l === 'es' ? `En la ventana TAS pon la altitud presión (${pa} ft) frente a la temperatura (${oat} °C).` : `In the TAS window put the pressure altitude (${pa} ft) against the temperature (${oat} °C).`)) },
      { cursor: norm360(theta(cas) + rot), say: both((l) => (l === 'es' ? `Sobre la CAS (${cas}, escala interior) lees la TAS en la exterior: ${Math.round(tas)} kt.` : `Over the CAS (${cas}, inner scale) you read the TAS on the outer scale: ${Math.round(tas)} kt.`)) }
    ]
  };
}

function genDa(r) {
  const { pa, oat } = paOat(r);
  const rot = tasRot(pa, oat);
  const da = densityAltitude(pa, oat);
  return {
    prompt: both((l) => (l === 'es' ? `Altitud presión ${pa} ft, OAT ${oat} °C. ¿Cuál es la altitud densidad?` : `Pressure altitude ${pa} ft, OAT ${oat} °C. What is the density altitude?`)),
    fields: [{ key: 'da', label: lab('Altitud densidad (ft)', 'Density altitude (ft)'), value: da, tol: { abs: 250 }, unit: 'ft' }],
    setup: SETUP_CALC,
    demo: [
      { face: 'calc', rot, say: both((l) => (l === 'es' ? `Pon la altitud presión (${pa} ft) frente a la temperatura (${oat} °C) en la ventana TAS.` : `Put the pressure altitude (${pa} ft) against the temperature (${oat} °C) in the TAS window.`)) },
      { cursor: DA_INDEX, say: both((l) => (l === 'es' ? `En la ventana de altitud densidad, bajo el índice, lees unos ${Math.round(da / 100) * 100} ft.` : `In the density-altitude window, at the index, you read about ${Math.round(da / 100) * 100} ft.`)) }
    ]
  };
}

function genWind(r) {
  const c = windCase(r);
  const w = solveWind(c);
  return {
    prompt: both((l) => (l === 'es' ? `TC ${pad3(c.tc)}°, TAS ${c.tas} kt, viento ${pad3(c.wdir)}/${c.wspd}. Calcula TH, GS y WCA.` : `TC ${pad3(c.tc)}°, TAS ${c.tas} kt, wind ${pad3(c.wdir)}/${c.wspd}. Find TH, GS and WCA.`)),
    fields: [
      { key: 'th', label: lab('TH (°)', 'TH (°)'), value: w.th, tol: { abs: 2 }, unit: '°', angle: true },
      { key: 'gs', label: lab('GS (kt)', 'GS (kt)'), value: w.gs, tol: { abs: 3 }, unit: 'kt' },
      { key: 'wca', label: lab('WCA (° + derecha)', 'WCA (° + right)'), value: w.wca, tol: { abs: 1.5 }, unit: '°', angle: true }
    ],
    setup: SETUP_WIND,
    demo: windSteps(c, w)
  };
}

function genNavlog(r) {
  const c = windCase(r);
  const w = solveWind(c);
  const dist = pick(r, 20, 180);
  const ff = pick(r, 6, 14, 0.5);
  const ete = (dist / w.gs) * 60;
  const fuel = (ete / 60) * ff;
  const rotGs = rotFor(w.gs, SPEED_INDEX);
  const rotFf = rotFor(ff, SPEED_INDEX);
  return {
    prompt: both((l) => (l === 'es' ? `TC ${pad3(c.tc)}°, TAS ${c.tas} kt, viento ${pad3(c.wdir)}/${c.wspd}, distancia ${dist} NM, consumo ${num(ff, l)} GPH. Calcula TH, GS, ETE y combustible.` : `TC ${pad3(c.tc)}°, TAS ${c.tas} kt, wind ${pad3(c.wdir)}/${c.wspd}, distance ${dist} NM, fuel flow ${num(ff, l)} GPH. Find TH, GS, ETE and fuel.`)),
    fields: [
      { key: 'th', label: lab('TH (°)', 'TH (°)'), value: w.th, tol: { abs: 2 }, unit: '°', angle: true },
      { key: 'gs', label: lab('GS (kt)', 'GS (kt)'), value: w.gs, tol: { abs: 3 }, unit: 'kt' },
      { key: 'ete', label: lab('ETE (h:mm o min)', 'ETE (h:mm or min)'), value: ete, tol: { rel: 0.03, abs: 1 }, unit: 'min' },
      { key: 'fuel', label: lab('Combustible (gal)', 'Fuel (gal)'), value: fuel, tol: { rel: 0.03, abs: 0.3 }, unit: 'gal' }
    ],
    setup: SETUP_WIND,
    demo: [
      ...windSteps(c, w),
      { face: 'calc', rot: rotGs, cursor: 0, say: both((l) => (l === 'es' ? `Voltea al lado de cálculo y pon el índice 60 bajo la GS (${Math.round(w.gs)} kt).` : `Flip to the computer side and put the 60 index under the GS (${Math.round(w.gs)} kt).`)) },
      { cursor: theta(dist), say: both((l) => (l === 'es' ? `Bajo la distancia (${dist} NM) lees el ETE: ${Math.round(ete)} min (${fmtHm(ete)}).` : `Under the distance (${dist} NM) you read the ETE: ${Math.round(ete)} min (${fmtHm(ete)}).`)) },
      { rot: rotFf, say: both((l) => (l === 'es' ? `Ahora pon el índice 60 bajo el consumo (${num(ff, l)} GPH).` : `Now put the 60 index under the fuel flow (${num(ff, l)} GPH).`)) },
      { cursor: norm360(theta(ete) + rotFf), say: both((l) => (l === 'es' ? `Sobre el ETE (${Math.round(ete)} min) lees el combustible: ${num(fuel, l)} gal.` : `Over the ETE (${Math.round(ete)} min) you read the fuel: ${num(fuel, l)} gal.`)) }
    ]
  };
}

const GEN = { tsd: genTsd, fuel: genFuel, conv: genConv, tas: genTas, da: genDa, wind: genWind, navlog: genNavlog };

/**
 * One problem of `kind` for `seed` (same inputs → same problem).
 * @returns {{kind:string, seed:number, prompt:{es:string,en:string}, fields:{key:string,label:{es:string,en:string},value:number,tol:{abs?:number,rel?:number},unit:string,angle?:boolean}[], setup:object, demo:object[]}}
 */
export function generate(kind, seed) {
  const gen = GEN[kind];
  if (!gen) throw new Error(`unknown kind ${kind}`);
  const r = rng((seed >>> 0) + KINDS.indexOf(kind) * 7919);
  return { kind, seed, ...gen(r) };
}
