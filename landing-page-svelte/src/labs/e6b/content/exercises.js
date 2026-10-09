// Exercises in five levels. Each: { id, level, setup?, part?, explain?, task, hint, why, check?, quiz?, answers?, demo? }.
//  - check(state, ctx): pure; true while the goal is met (evaluated when the user is not dragging).
//  - quiz: { choices: [{es, en}], answer } instead of check (reading questions, answered in the panel).
//  - answers: typed numeric answers [{ key, label, value, tol, unit, angle? }]. Values are computed with lib/
//    (the instrument maths itself), never hand-typed. `mag(x, approx)` puts the decimal point like a pilot does:
//    the instrument gives the digits, a rough mental estimate `approx` gives the order of magnitude.
//  - setup: StatePatch applied when the task starts; demo: DemoStep[] ("Show me"), one caption per step.
//  - ctx = { lastPart }. part: E6B part highlighted when the hint is shown; explain: switches Explain mode on.

import { angleDiff, theta, rotFor, outerAt, innerAt, tasRot, daAt, cToF } from '../lib/scales.js';
import { solveWind, findWind, readDot, dotFor } from '../lib/wind.js';

/** @typedef {{es: string, en: string}} L10n */
/** @typedef {{ lastPart: string|null }} Ctx */
/** @typedef {{ face?: 'calc'|'wind', rot?: number, cursor?: number, dir?: number, slide?: number, dots?: 'clear'|{b:number,d:number}[] }} StatePatch */
/** @typedef {StatePatch & { say: L10n }} DemoStep */
/**
 * @typedef {object} Exercise
 * @property {string} id
 * @property {0|1|2|3|4} level
 * @property {StatePatch} [setup]
 * @property {string} [part]
 * @property {boolean} [explain]
 * @property {L10n} task
 * @property {L10n} hint
 * @property {L10n} why
 * @property {(s: any, ctx: Ctx) => boolean} [check]
 * @property {{choices: L10n[], answer: number}} [quiz]
 * @property {{key: string, label: L10n, value: number, tol: {abs?: number, rel?: number}, unit: string, angle?: boolean}[]} [answers]
 * @property {DemoStep[]} [demo]
 */

export const LEVELS = [
  { id: 0, name: { es: 'Conocer', en: 'Know it' },
    intro: { es: 'Las dos caras, sus partes y cómo se lee una escala logarítmica: cifras, coma decimal, anillo de horas y ojal. Algunas preguntas se responden en el panel y otras tocando una parte con Modo explicar.',
             en: 'The two faces, their parts and how to read a log scale: digits, decimal point, hours ring and grommet. Some questions are answered in the panel and others by tapping a part in Explain mode.' } },
  { id: 1, name: { es: 'Tiempo, velocidad, distancia', en: 'Time, speed, distance' },
    intro: { es: 'El problema más frecuente: el índice 60 para distancia, tiempo y velocidad, el índice 36 para segundos, y multiplicar con el índice 10.',
             en: 'The most frequent problem: the 60 index for distance, time and speed, the 36 index for seconds, and multiplying with the 10 index.' } },
  { id: 2, name: { es: 'Combustible y conversiones', en: 'Fuel and conversions' },
    intro: { es: 'Consumo, autonomía y caudal con el índice 60, y las flechas de conversión: NM, SM, km, galones, libras, metros, pies y °C / °F.',
             en: 'Burn, endurance and rate with the 60 index, and the conversion arrows: NM, SM, km, gallons, pounds, metres, feet and °C / °F.' } },
  { id: 3, name: { es: 'Altitud y velocidad', en: 'Altitude and airspeed' },
    intro: { es: 'De CAS a TAS con la ventana de altitud de presión y temperatura, y la altitud de densidad: por qué el calor y la altura quitan rendimiento.',
             en: 'From CAS to TAS with the pressure altitude and temperature window, and density altitude: why heat and height take performance away.' } },
  { id: 4, name: { es: 'Viento', en: 'Wind' },
    intro: { es: 'El lado del viento con el método del punto: marcar el viento, girar a la derrota, deslizar hasta la TAS y leer rumbo y velocidad respecto al suelo. Al final, calcular un viento desconocido.',
             en: 'The wind side with the wind-dot method: mark the wind, rotate to the course, slide to the TAS and read heading and ground speed. At the end, find an unknown wind.' } }
];

// ---------- helpers ----------

/** @param {string} es @param {string} en @returns {L10n} */
const t = (es, en) => ({ es, en });
/** @param {StatePatch} patch @param {string} es @param {string} en @returns {DemoStep} */
const step = (patch, es, en) => ({ ...patch, say: { es, en } });

/** Order of magnitude by mental estimate: scales the instrument's digits to the power of ten closest to `approx`. */
const mag = (x, approx) => x * 10 ** Math.round(Math.log10(approx / x));

const ROT_TOL = 0.8, DIR_TOL = 1.5, SLIDE_TOL = 1.5, DOT_B_TOL = 3, DOT_D_TOL = 1.5;
const rotNear = (s, target) => Math.abs(angleDiff(s.rot, target)) <= ROT_TOL;
const dirNear = (s, target) => Math.abs(angleDiff(s.dir, target)) <= DIR_TOL;
/** Cursor (screen angle) on an outer value, or on an inner value for disc rotation `rot`. */
const curOuter = (v) => theta(v);
const curInner = (v, rot) => theta(v) + rot;

/** Tolerances. */
const SCALE = { rel: 0.02, abs: 1 };
const MINUTES = { rel: 0.03, abs: 1 };
const HEADING = { abs: 2 };
const GROUND = { abs: 3 };

/** Dot (bearing on the rose, distance from the grommet) of the point where the TAS arc meets the drift line `wca`
 *  when the card origin is `gs` kt below the grommet and the rose shows `dir` at the top. */
function dotFromReadings(tas, wca, gs, dir) {
  const dx = tas * Math.sin((wca * Math.PI) / 180);
  const dy = tas * Math.cos((wca * Math.PI) / 180) - gs; // up from the grommet
  return { b: (dir + (Math.atan2(dx, dy) * 180) / Math.PI + 360) % 360, d: Math.hypot(dx, dy) };
}

// Textbook cases used by several exercises (computed once, from lib/).
const WIND_A = { tc: 0, tas: 120, wdir: 270, wspd: 20 };
const SOL_A = /** @type {NonNullable<ReturnType<typeof solveWind>>} */ (solveWind(WIND_A));
const WIND_B = { tc: 90, tas: 120, wdir: 180, wspd: 25 };
const SOL_B = /** @type {NonNullable<ReturnType<typeof solveWind>>} */ (solveWind(WIND_B));
const WIND_C = { tc: 135, tas: 110, wdir: 210, wspd: 25 };
const SOL_C = /** @type {NonNullable<ReturnType<typeof solveWind>>} */ (solveWind(WIND_C));
const UNK = { tc: 90, th: 97, tas: 120, gs: 108 };
const UNK_WIND = findWind(UNK);

const CALC0 = { face: /** @type {'calc'} */ ('calc'), rot: 0, cursor: 0 };
const WIND0 = { face: /** @type {'wind'} */ ('wind'), dir: 0, slide: 100, dots: /** @type {'clear'} */ ('clear') };

/** @type {Exercise[]} */
export const EXERCISES = [
  // ---------- Level 1 · Know it ----------
  {
    id: 'know-faces', level: 0, setup: CALC0,
    task: t('¿Para qué sirve la cara del viento del E6B?', 'What is the wind face of the E6B for?'),
    hint: t('Tiene el TRUE INDEX, la rosa y la tarjeta con arcos y líneas de deriva. Pulsa “Voltear” para verla.', 'It has the TRUE INDEX, the rose and the card with arcs and drift lines. Press “Flip” to see it.'),
    why: t('Cada cara resuelve problemas distintos: la de cálculo hace tiempo, combustible y TAS; la del viento, rumbo y velocidad respecto al suelo.', 'Each face solves different problems: the computer side does time, fuel and TAS; the wind side, heading and ground speed.'),
    quiz: { choices: [
      t('Calcular combustible y conversiones', 'Calculating fuel and conversions'),
      t('Resolver el triángulo del viento: rumbo y GS', 'Solving the wind triangle: heading and GS'),
      t('Medir la presión atmosférica', 'Measuring atmospheric pressure'),
      t('Sustituir el altímetro', 'Replacing the altimeter')
    ], answer: 1 }
  },
  {
    id: 'know-speed-index', level: 0, part: 'speedIndex', explain: true, setup: CALC0,
    task: t('Con Modo explicar, toca el índice de velocidad (el triángulo grande sobre el 60 de la escala interior).', 'In Explain mode, tap the speed index (the big triangle on the inner 60).'),
    hint: t('Está en el disco interior, el que gira. Se ve en ámbar y pone “60”.', 'It is on the inner disc, the one that turns. It is amber and reads “60”.'),
    why: t('Es el punto de partida de casi todos los problemas: 60 minutos = 1 hora, y la velocidad se coloca sobre él.', 'It is the starting point of almost every problem: 60 minutes = 1 hour, and the speed is placed over it.'),
    check: (s, ctx) => ctx.lastPart === 'speedIndex'
  },
  {
    id: 'know-decimal', level: 0, setup: CALC0, part: 'outerScale',
    task: t('120 kt × 25 min: en la escala lees “5 0”. ¿Cuántas millas son?', '120 kt × 25 min: on the scale you read “5 0”. How many miles is that?'),
    hint: t('Estima de cabeza: 120 kt son 2 NM por minuto. En 25 minutos, ¿cuánto sale más o menos?', 'Estimate in your head: 120 kt is 2 NM per minute. In 25 minutes, roughly how much?'),
    why: t('El E6B da las cifras, no la coma. Estimar siempre el orden de magnitud es lo que separa 5 NM de 50 NM de 500 NM.', 'The E6B gives the digits, not the decimal point. Always estimating the order of magnitude is what separates 5 NM from 50 NM from 500 NM.'),
    quiz: { choices: [t('5 NM', '5 NM'), t('50 NM', '50 NM'), t('500 NM', '500 NM')], answer: 1 }
  },
  {
    id: 'know-align10', level: 0, part: 'index10', setup: { ...CALC0, rot: 37 },
    task: t('Gira el disco hasta alinear el 10 interior con el 10 exterior.', 'Turn the disc to line up the inner 10 with the outer 10.'),
    hint: t('Arrastra el disco, o usa los botones finos. Los dos 10 están arriba cuando lo logras.', 'Drag the disc, or use the fine buttons. Both 10s are at the top when you get it.'),
    why: t('Con los 10 alineados el disco queda en cero: cada número interior está bajo el mismo número exterior. Es la base de multiplicar.', 'With the 10s aligned the disc is at zero: each inner number sits under the same outer number. It is the base of multiplying.'),
    check: (s) => rotNear(s, 0),
    demo: [step({ rot: 0, cursor: 0 }, 'Gira el disco hasta que el 10 interior quede bajo el 10 exterior, arriba del todo.', 'Turn the disc until the inner 10 is under the outer 10, right at the top.')]
  },
  {
    id: 'know-hours', level: 0, setup: CALC0, part: 'hoursRing',
    task: t('En el anillo de horas, ¿a qué hora y minutos equivalen 90 minutos?', 'On the hours ring, what hours and minutes equal 90 minutes?'),
    hint: t('Bajo el 90 de minutos está el anillo de horas. Piensa: 60 + 30.', 'Under the 90 of minutes is the hours ring. Think: 60 + 30.'),
    why: t('Los tiempos se dan en h:mm en el cuaderno de navegación. Confundir 1,5 h con 1:50 es un error típico.', 'Times are written as h:mm on the navlog. Mixing up 1.5 h and 1:50 is a typical error.'),
    quiz: { choices: [t('1:15', '1:15'), t('1:30', '1:30'), t('1:50', '1:50'), t('9:00', '9:00')], answer: 1 }
  },
  {
    id: 'know-ticks', level: 0, setup: CALC0, part: 'outerScale',
    task: t('Entre 20 y 50 la escala tiene una raya cada 0,5. ¿Qué valor marca la tercera raya después del 30?', 'Between 20 and 50 the scale has a tick every 0.5. What value is the third tick after the 30?'),
    hint: t('Cuenta rayas: la primera es 30,5, la segunda 31...', 'Count ticks: the first is 30.5, the second 31...'),
    why: t('Leer bien la raya es la mitad de la precisión. Mira siempre cuánto vale cada raya en la zona donde estás.', 'Reading the right tick is half of the accuracy. Always check what each tick is worth in the zone you are in.'),
    quiz: { choices: [t('30,3', '30.3'), t('31,0', '31.0'), t('31,5', '31.5'), t('33', '33')], answer: 2 }
  },
  {
    id: 'know-grommet', level: 0, part: 'grommet', explain: true, setup: { face: 'wind', dir: 0, slide: 100, dots: 'clear' },
    task: t('Voltea al lado del viento y, con Modo explicar, toca el ojal central.', 'Flip to the wind side and, in Explain mode, tap the central grommet.'),
    hint: t('Es el pequeño círculo metálico en el centro del disco transparente.', 'It is the small metal circle at the centre of the transparent disc.'),
    why: t('El ojal es el avión: la velocidad que queda bajo él es la lectura de la tarjeta y, al final, la GS.', 'The grommet is the aircraft: the speed under it is the card reading and, at the end, the GS.'),
    check: (s, ctx) => ctx.lastPart === 'grommet'
  },

  // ---------- Level 2 · Time, speed, distance ----------
  {
    id: 'tsd-set60', level: 1, part: 'speedIndex', setup: CALC0,
    task: t('Pon el índice de velocidad (60) bajo 120 kt en la escala exterior.', 'Put the speed index (60) under 120 kt on the outer scale.'),
    hint: t('Gira el disco hasta que el triángulo sobre el 60 quede bajo el 12 de la escala exterior (120 kt).', 'Turn the disc until the triangle on the 60 is under the 12 of the outer scale (120 kt).'),
    why: t('Es el único ajuste del problema. Después lo demás se lee sin mover nada.', 'It is the only setting of the problem. After that everything else is read without moving anything.'),
    check: (s) => rotNear(s, rotFor(120, 60)),
    demo: [
      step({ cursor: curOuter(120) }, 'Lleva el cursor al 12 de la escala exterior (120 kt).', 'Move the cursor to the 12 on the outer scale (120 kt).'),
      step({ rot: rotFor(120, 60) }, 'Gira el disco hasta que el índice 60 quede bajo el cursor.', 'Turn the disc until the 60 index is under the cursor.')
    ]
  },
  {
    id: 'tsd-dist', level: 1, part: 'speedIndex', setup: CALC0,
    task: t('Vuelas a 120 kt durante 25 minutos. ¿Qué distancia recorres (NM)?', 'You fly at 120 kt for 25 minutes. How far do you go (NM)?'),
    hint: t('Pon el 60 bajo 120 y lee en la escala exterior, sobre los 25 minutos de la escala interior.', 'Put the 60 under 120 and read the outer scale over the 25 minutes of the inner scale.'),
    why: t('Distancia = velocidad × tiempo. Con el índice 60 el E6B la resuelve con un solo giro.', 'Distance = speed × time. With the 60 index the E6B solves it with a single turn.'),
    answers: [{ key: 'dist', label: t('Distancia (NM)', 'Distance (NM)'), value: mag(outerAt(rotFor(120, 60), 25), 50), tol: SCALE, unit: 'NM' }],
    demo: [
      step({ rot: rotFor(120, 60), cursor: curOuter(120) }, 'Pon el índice 60 bajo la velocidad: 120 kt.', 'Put the 60 index under the speed: 120 kt.'),
      step({ cursor: curInner(25, rotFor(120, 60)) }, 'Busca 25 minutos en la escala interior.', 'Find 25 minutes on the inner scale.'),
      step({}, 'Sobre ellos, en la escala exterior, lee 5 0. Estima: 2 NM por minuto durante 25 son 50 NM.', 'Over them, on the outer scale, read 5 0. Estimate: 2 NM per minute for 25 is 50 NM.')
    ]
  },
  {
    id: 'tsd-time', level: 1, part: 'speedIndex', setup: CALC0,
    task: t('Quedan 75 NM y tu velocidad respecto al suelo es 150 kt. ¿Cuántos minutos tardas?', '75 NM to go and your ground speed is 150 kt. How many minutes will it take?'),
    hint: t('Pon el 60 bajo 150 y lee la escala interior bajo 75 (7,5 en la exterior).', 'Put the 60 under 150 and read the inner scale under 75 (7.5 on the outer).'),
    why: t('ETE = distancia / GS. Es lo que apuntas en cada tramo del cuaderno de navegación.', 'ETE = distance / GS. It is what you write on each leg of the navlog.'),
    answers: [{ key: 'ete', label: t('Tiempo (min)', 'Time (min)'), value: mag(innerAt(rotFor(150, 60), 75), 30), tol: MINUTES, unit: 'min' }],
    demo: [
      step({ rot: rotFor(150, 60), cursor: curOuter(150) }, 'Pon el índice 60 bajo 150 kt.', 'Put the 60 index under 150 kt.'),
      step({ cursor: curOuter(75) }, 'Busca la distancia, 75 NM, en la escala exterior.', 'Find the distance, 75 NM, on the outer scale.'),
      step({}, 'Bajo ella, en la escala interior, lee 3 0 minutos (0:30 en el anillo).', 'Under it, on the inner scale, read 3 0 minutes (0:30 on the ring).')
    ]
  },
  {
    id: 'tsd-speed', level: 1, part: 'outerScale', setup: CALC0,
    task: t('Has recorrido 42 NM en 18 minutos. ¿Cuál es tu velocidad respecto al suelo (kt)?', 'You flew 42 NM in 18 minutes. What is your ground speed (kt)?'),
    hint: t('Pon 18 (interior) bajo 42 (exterior) y lee la velocidad sobre el índice 60.', 'Put 18 (inner) under 42 (outer) and read the speed over the 60 index.'),
    why: t('Comprobar la GS real entre dos puntos te dice si el viento es el previsto. Es la base de revisar el plan en vuelo.', 'Checking the real GS between two points tells you if the wind is as forecast. It is the base of reviewing the plan in flight.'),
    answers: [{ key: 'gs', label: t('Velocidad (kt)', 'Speed (kt)'), value: mag(outerAt(rotFor(42, 18), 60), 140), tol: SCALE, unit: 'kt' }],
    demo: [
      step({ cursor: curOuter(42) }, 'Busca la distancia, 42 NM, en la escala exterior.', 'Find the distance, 42 NM, on the outer scale.'),
      step({ rot: rotFor(42, 18) }, 'Gira el disco hasta poner los 18 minutos bajo ella.', 'Turn the disc to put the 18 minutes under it.'),
      step({ cursor: curInner(60, rotFor(42, 18)) }, 'Mira ahora el índice 60 (una hora).', 'Now look at the 60 index (one hour).'),
      step({}, 'Sobre él lees 1 4: unos 140 kt. Estima: 42 NM en 18 min son algo más de 2 NM por minuto.', 'Over it you read 1 4: about 140 kt. Estimate: 42 NM in 18 min is a bit over 2 NM per minute.')
    ]
  },
  {
    id: 'tsd-seconds', level: 1, part: 'secondsIndex', setup: CALC0,
    task: t('A 90 kt, ¿cuántos segundos tardas en recorrer 2,5 NM? Usa el índice de segundos (36).', 'At 90 kt, how many seconds do you need to fly 2.5 NM? Use the seconds index (36).'),
    hint: t('Pon el 36 bajo 90 (kt) y lee la escala interior bajo 25 (exterior). Pon tú la coma.', 'Put the 36 under 90 (kt) and read the inner scale under 25 (outer). Place the point yourself.'),
    why: t('Para tiempos cortos, como el tramo entre el FAF y el MAP, el índice de segundos evita convertir minutos a segundos.', 'For short times, like the leg between the FAF and the MAP, the seconds index avoids converting minutes to seconds.'),
    answers: [{ key: 'sec', label: t('Tiempo (s)', 'Time (s)'), value: mag(innerAt(rotFor(90, 36), 25), 100), tol: { rel: 0.03, abs: 2 }, unit: 's' }],
    demo: [
      step({ rot: rotFor(90, 36), cursor: curOuter(90) }, 'Pon el índice de segundos (36) bajo 90 kt.', 'Put the seconds index (36) under 90 kt.'),
      step({ cursor: curOuter(25) }, 'Busca la distancia, 2,5 NM, en la escala exterior (el 25).', 'Find the distance, 2.5 NM, on the outer scale (the 25).'),
      step({}, 'Bajo ella lees 1 0: son 100 segundos (1:40). Estima: 90 kt son 1,5 NM por minuto.', 'Under it you read 1 0: that is 100 seconds (1:40). Estimate: 90 kt is 1.5 NM per minute.')
    ]
  },
  {
    id: 'tsd-multiply', level: 1, part: 'index10', setup: CALC0,
    task: t('Con el índice 10, multiplica 12 × 15.', 'With the 10 index, multiply 12 × 15.'),
    hint: t('Pon el 10 interior bajo 12 (exterior) y lee la escala exterior sobre el 15 interior.', 'Put the inner 10 under 12 (outer) and read the outer scale over the inner 15.'),
    why: t('El E6B es una regla de cálculo: multiplicar y dividir sirve para cualquier cosa, no solo para navegación.', 'The E6B is a slide rule: multiplying and dividing serves for anything, not just navigation.'),
    answers: [{ key: 'prod', label: t('Producto', 'Product'), value: mag(outerAt(rotFor(12, 10), 15), 180), tol: SCALE, unit: '' }],
    demo: [
      step({ cursor: curOuter(12) }, 'Busca el primer número, 12, en la escala exterior.', 'Find the first number, 12, on the outer scale.'),
      step({ rot: rotFor(12, 10) }, 'Gira el disco para poner el 10 interior bajo el 12.', 'Turn the disc to put the inner 10 under the 12.'),
      step({ cursor: curInner(15, rotFor(12, 10)) }, 'Busca el segundo número, 15, en la escala interior.', 'Find the second number, 15, on the inner scale.'),
      step({}, 'Sobre él lees 1 8: 12 × 15 = 180.', 'Over it you read 1 8: 12 × 15 = 180.')
    ]
  },
  {
    id: 'tsd-hours', level: 1, part: 'hoursRing', setup: CALC0,
    task: t('Vuelas a 80 kt durante 1:30. ¿Qué distancia recorres (NM)?', 'You fly at 80 kt for 1:30. How far do you go (NM)?'),
    hint: t('Pon el 60 bajo 80 y busca 90 minutos (1:30 en el anillo de horas).', 'Put the 60 under 80 and find 90 minutes (1:30 on the hours ring).'),
    why: t('Más de una hora: el anillo de horas evita convertir 1:30 en 90 minutos de cabeza.', 'More than an hour: the hours ring avoids converting 1:30 into 90 minutes in your head.'),
    answers: [{ key: 'dist', label: t('Distancia (NM)', 'Distance (NM)'), value: mag(outerAt(rotFor(80, 60), 90), 120), tol: SCALE, unit: 'NM' }],
    demo: [
      step({ rot: rotFor(80, 60), cursor: curOuter(80) }, 'Pon el índice 60 bajo 80 kt.', 'Put the 60 index under 80 kt.'),
      step({ cursor: curInner(90, rotFor(80, 60)) }, 'Busca 90 minutos: el anillo de horas dice 1:30.', 'Find 90 minutes: the hours ring says 1:30.'),
      step({}, 'Sobre ellos lees 1 2: 120 NM. Estima: 80 kt en 1,5 h son 120 NM.', 'Over them you read 1 2: 120 NM. Estimate: 80 kt in 1.5 h is 120 NM.')
    ]
  },

  // ---------- Level 3 · Fuel and conversions ----------
  {
    id: 'fuel-burn', level: 2, part: 'speedIndex', setup: CALC0,
    task: t('Consumes 9,5 GPH. ¿Cuántos galones quemas en 2:30?', 'You burn 9.5 GPH. How many gallons do you use in 2:30?'),
    hint: t('Pon el 60 bajo 95 (9,5 GPH) y lee la escala exterior sobre 150 minutos (2:30).', 'Put the 60 under 95 (9.5 GPH) and read the outer scale over 150 minutes (2:30).'),
    why: t('Es el mismo problema que distancia, pero la escala exterior son galones. Necesitas el consumo del tramo para planificar combustible.', 'It is the same problem as distance, but the outer scale is gallons. You need the leg burn to plan fuel.'),
    answers: [{ key: 'gal', label: t('Combustible (gal)', 'Fuel (gal)'), value: mag(outerAt(rotFor(95, 60), 150), 24), tol: { rel: 0.02, abs: 0.5 }, unit: 'gal' }],
    demo: [
      step({ rot: rotFor(95, 60), cursor: curOuter(95) }, 'Pon el índice 60 bajo el caudal: 9,5 GPH (el 95).', 'Put the 60 index under the flow: 9.5 GPH (the 95).'),
      step({ cursor: curInner(150, rotFor(95, 60)) }, 'Busca 150 minutos (2:30 en el anillo de horas).', 'Find 150 minutes (2:30 on the hours ring).'),
      step({}, 'Sobre ellos lees 2 3 7: unos 23,7 galones. Estima: 9,5 × 2,5 ≈ 24.', 'Over them you read 2 3 7: about 23.7 gallons. Estimate: 9.5 × 2.5 ≈ 24.')
    ]
  },
  {
    id: 'fuel-endurance', level: 2, part: 'speedIndex', setup: CALC0,
    task: t('Tienes 38 galones y consumes 8 GPH. ¿Cuánto tiempo puedes volar? (minutos o h:mm)', 'You have 38 gallons and burn 8 GPH. How long can you fly? (minutes or h:mm)'),
    hint: t('Pon el 60 bajo 80 (8 GPH) y lee la escala interior bajo 38 galones (exterior).', 'Put the 60 under 80 (8 GPH) and read the inner scale under 38 gallons (outer).'),
    why: t('La autonomía es hasta el depósito vacío. Resta siempre la reserva legal antes de decidir si llegas.', 'Endurance is until the tanks are dry. Always subtract the legal reserve before deciding whether you make it.'),
    answers: [{ key: 'endurance', label: t('Autonomía', 'Endurance'), value: mag(innerAt(rotFor(80, 60), 38), 285), tol: MINUTES, unit: 'min' }],
    demo: [
      step({ rot: rotFor(80, 60), cursor: curOuter(80) }, 'Pon el índice 60 bajo el caudal: 8 GPH (el 80).', 'Put the 60 index under the flow: 8 GPH (the 80).'),
      step({ cursor: curOuter(38) }, 'Busca los galones disponibles, 38, en la escala exterior.', 'Find the gallons available, 38, on the outer scale.'),
      step({}, 'Bajo ellos lees 2 8 5 minutos, que el anillo de horas muestra como 4:45.', 'Under them you read 2 8 5 minutes, which the hours ring shows as 4:45.')
    ]
  },
  {
    id: 'fuel-rate', level: 2, part: 'outerScale', setup: CALC0,
    task: t('Has gastado 13 galones en 1:20. ¿Cuál es el caudal (GPH)?', 'You used 13 gallons in 1:20. What is the flow (GPH)?'),
    hint: t('Pon 80 minutos (interior) bajo 13 (exterior) y lee el caudal sobre el índice 60.', 'Put 80 minutes (inner) under 13 (outer) and read the flow over the 60 index.'),
    why: t('Medir el caudal real te dice si la mezcla y la potencia dan lo que dice el manual.', 'Measuring the real flow tells you whether mixture and power give what the manual says.'),
    answers: [{ key: 'gph', label: t('Caudal (GPH)', 'Flow (GPH)'), value: mag(outerAt(rotFor(13, 80), 60), 9.75), tol: { rel: 0.02, abs: 0.2 }, unit: 'GPH' }],
    demo: [
      step({ cursor: curOuter(13) }, 'Busca los galones, 13, en la escala exterior.', 'Find the gallons, 13, on the outer scale.'),
      step({ rot: rotFor(13, 80) }, 'Gira el disco para poner 80 minutos (1:20) bajo ellos.', 'Turn the disc to put 80 minutes (1:20) under them.'),
      step({ cursor: curInner(60, rotFor(13, 80)) }, 'Mira el índice 60 (una hora).', 'Look at the 60 index (one hour).'),
      step({}, 'Sobre él lees 9 7 5: unos 9,75 GPH.', 'Over it you read 9 7 5: about 9.75 GPH.')
    ]
  },
  {
    id: 'conv-sm', level: 2, part: 'convNaut', setup: CALC0,
    task: t('Convierte 85 NM a millas terrestres (SM).', 'Convert 85 NM to statute miles (SM).'),
    hint: t('Pon 85 (interior) bajo la flecha NAUT y lee la escala interior bajo STAT.', 'Put 85 (inner) under the NAUT arrow and read the inner scale under STAT.'),
    why: t('La visibilidad en EE. UU. va en SM y las distancias de la carta, en NM. 1 NM = 1,15 SM.', 'Visibility in the US is in SM and chart distances in NM. 1 NM = 1.15 SM.'),
    answers: [{ key: 'sm', label: t('Distancia (SM)', 'Distance (SM)'), value: mag(innerAt(rotFor(66, 85), 76), 98), tol: SCALE, unit: 'SM' }],
    demo: [
      step({ cursor: curOuter(66) }, 'Lleva el cursor a la flecha NAUT.', 'Move the cursor to the NAUT arrow.'),
      step({ rot: rotFor(66, 85) }, 'Gira el disco para poner el 85 interior bajo NAUT.', 'Turn the disc to put the inner 85 under NAUT.'),
      step({ cursor: curOuter(76) }, 'Mira la flecha STAT.', 'Look at the STAT arrow.'),
      step({}, 'Bajo ella, en la escala interior, lees 9 8: unas 98 SM.', 'Under it, on the inner scale, you read 9 8: about 98 SM.')
    ]
  },
  {
    id: 'conv-km', level: 2, part: 'convNaut', setup: CALC0,
    task: t('Convierte 120 NM a kilómetros.', 'Convert 120 NM to kilometres.'),
    hint: t('Pon 120 (interior) bajo NAUT y lee bajo la flecha KM; pon la coma tú.', 'Put 120 (inner) under NAUT and read under the KM arrow; place the point yourself.'),
    why: t('Fuera de EE. UU., muchas distancias se dan en km. Una NM son 1,852 km: 120 NM son algo más del doble.', 'Outside the US, many distances are given in km. One NM is 1.852 km: 120 NM is a bit over double.'),
    answers: [{ key: 'km', label: t('Distancia (km)', 'Distance (km)'), value: mag(innerAt(rotFor(66, 120), 12.2), 220), tol: SCALE, unit: 'km' }],
    demo: [
      step({ cursor: curOuter(66) }, 'Lleva el cursor a la flecha NAUT.', 'Move the cursor to the NAUT arrow.'),
      step({ rot: rotFor(66, 120) }, 'Gira el disco para poner el 120 interior bajo NAUT.', 'Turn the disc to put the inner 120 under NAUT.'),
      step({ cursor: curOuter(12.2) }, 'Mira la flecha KM.', 'Look at the KM arrow.'),
      step({}, 'Bajo ella lees 2 2 2: unos 222 km. Estima: 120 × 1,85 ≈ 222.', 'Under it you read 2 2 2: about 222 km. Estimate: 120 × 1.85 ≈ 222.')
    ]
  },
  {
    id: 'conv-lb', level: 2, part: 'convFuel', setup: CALC0,
    task: t('Convierte 40 galones US de gasolina de aviación a libras.', 'Convert 40 US gallons of avgas to pounds.'),
    hint: t('Pon 40 (interior) bajo U.S. GAL y lee bajo FUEL LBS. Un galón pesa unas 6 lb.', 'Put 40 (inner) under U.S. GAL and read under FUEL LBS. A gallon weighs about 6 lb.'),
    why: t('El peso y centrado se calculan en libras, pero repostas y consultas el manual en galones.', 'Weight and balance is calculated in pounds, but you refuel and read the manual in gallons.'),
    answers: [{ key: 'lb', label: t('Peso (lb)', 'Weight (lb)'), value: mag(innerAt(rotFor(11.67, 40), 70), 240), tol: SCALE, unit: 'lb' }],
    demo: [
      step({ cursor: curOuter(11.67) }, 'Lleva el cursor a la flecha U.S. GAL.', 'Move the cursor to the U.S. GAL arrow.'),
      step({ rot: rotFor(11.67, 40) }, 'Gira el disco para poner el 40 interior bajo U.S. GAL.', 'Turn the disc to put the inner 40 under U.S. GAL.'),
      step({ cursor: curOuter(70) }, 'Mira la flecha FUEL LBS.', 'Look at the FUEL LBS arrow.'),
      step({}, 'Bajo ella lees 2 4: unas 240 lb. Estima: 40 × 6.', 'Under it you read 2 4: about 240 lb. Estimate: 40 × 6.')
    ]
  },
  {
    id: 'conv-ft', level: 2, part: 'convLength', setup: CALC0,
    task: t('Convierte 1 500 metros a pies.', 'Convert 1,500 metres to feet.'),
    hint: t('Pon 150 (interior) bajo METERS y lee bajo FEET; pon la coma tú.', 'Put 150 (inner) under METERS and read under FEET; place the point yourself.'),
    why: t('Un techo de nubes o una pista en metros hay que pasarlos a pies para compararlos con tus mínimos.', 'A cloud ceiling or a runway in metres must be turned into feet to compare with your minima.'),
    answers: [{ key: 'ft', label: t('Altura (ft)', 'Height (ft)'), value: mag(innerAt(rotFor(15.24, 150), 50), 4900), tol: SCALE, unit: 'ft' }],
    demo: [
      step({ cursor: curOuter(15.24) }, 'Lleva el cursor a la flecha METERS.', 'Move the cursor to the METERS arrow.'),
      step({ rot: rotFor(15.24, 150) }, 'Gira el disco para poner el 150 interior bajo METERS.', 'Turn the disc to put the inner 150 under METERS.'),
      step({ cursor: curOuter(50) }, 'Mira la flecha FEET.', 'Look at the FEET arrow.'),
      step({}, 'Bajo ella lees 4 9: unos 4 900 ft. Estima: 1 500 × 3,3 ≈ 4 950.', 'Under it you read 4 9: about 4,900 ft. Estimate: 1,500 × 3.3 ≈ 4,950.')
    ]
  },
  {
    id: 'conv-temp', level: 2, part: 'tempStrip', setup: CALC0,
    task: t('Convierte 15 °C a grados Fahrenheit.', 'Convert 15 °C to degrees Fahrenheit.'),
    hint: t('Busca 15 en la escala Celsius de la tira de temperatura y lee el valor enfrente.', 'Find 15 on the Celsius scale of the temperature strip and read the value opposite.'),
    why: t('Los METAR dan °C pero algunos manuales y termómetros usan °F. Las 15 °C son la temperatura ISA a nivel del mar.', 'METARs give °C but some manuals and thermometers use °F. 15 °C is the ISA sea-level temperature.'),
    answers: [{ key: 'f', label: t('Temperatura (°F)', 'Temperature (°F)'), value: cToF(15), tol: { abs: 1 }, unit: '°F' }]
  },

  // ---------- Level 4 · Altitude and airspeed ----------
  {
    id: 'tas-set', level: 3, part: 'tasWindow', setup: CALC0,
    task: t('En la ventana de TAS, pon la altitud de presión 6 000 ft sobre −5 °C.', 'In the TAS window, put pressure altitude 6,000 ft over −5 °C.'),
    hint: t('Gira el disco hasta que la marca de PA 6 (6 000 ft) quede frente a −5 en la escala de temperatura.', 'Turn the disc until the PA 6 (6,000 ft) mark faces −5 on the temperature scale.'),
    why: t('Es el único ajuste de la ventana. Después, cada CAS tiene su TAS justo encima.', 'It is the only setting of the window. After that every CAS has its TAS right over it.'),
    check: (s) => rotNear(s, tasRot(6000, -5)),
    demo: [step({ rot: tasRot(6000, -5) }, 'Gira el disco hasta que PA 6 000 quede bajo −5 °C en la ventana de TAS.', 'Turn the disc until PA 6,000 is under −5 °C in the TAS window.')]
  },
  {
    id: 'tas-read', level: 3, part: 'tasWindow', setup: { ...CALC0, rot: tasRot(6000, -5) },
    task: t('Con PA 6 000 ft y −5 °C ya puestos, ¿qué TAS corresponde a una CAS de 120 kt?', 'With PA 6,000 ft and −5 °C already set, what TAS goes with a CAS of 120 kt?'),
    hint: t('Busca 120 en la escala interior (CAS) y lee la escala exterior sobre él (TAS).', 'Find 120 on the inner scale (CAS) and read the outer scale over it (TAS).'),
    why: t('A esa altura y temperatura el aire es menos denso: vas más rápido sobre el aire de lo que dice el anemómetro.', 'At that height and temperature the air is thinner: you move through it faster than the airspeed indicator says.'),
    answers: [{ key: 'tas', label: t('TAS (kt)', 'TAS (kt)'), value: mag(outerAt(tasRot(6000, -5), 120), 130), tol: SCALE, unit: 'kt' }],
    demo: [
      step({ cursor: curInner(120, tasRot(6000, -5)) }, 'Busca la CAS, 120, en la escala interior.', 'Find the CAS, 120, on the inner scale.'),
      step({}, 'Sobre ella, en la escala exterior, lees 1 2 9: la TAS es unos 129 kt.', 'Over it, on the outer scale, you read 1 2 9: the TAS is about 129 kt.')
    ]
  },
  {
    id: 'tas-full', level: 3, part: 'tasWindow', setup: CALC0,
    task: t('Calcula la TAS: PA 8 000 ft, OAT +10 °C, CAS 110 kt.', 'Work out the TAS: PA 8,000 ft, OAT +10 °C, CAS 110 kt.'),
    hint: t('Primero pon PA 8 000 sobre +10 °C. Después lee la escala exterior sobre 110 interior.', 'First put PA 8,000 over +10 °C. Then read the outer scale over inner 110.'),
    why: t('La TAS es la entrada del lado del viento. Usar la CAS ahí da un rumbo y un tiempo equivocados.', 'TAS is the input of the wind side. Using CAS there gives a wrong heading and time.'),
    answers: [{ key: 'tas', label: t('TAS (kt)', 'TAS (kt)'), value: mag(outerAt(tasRot(8000, 10), 110), 127), tol: SCALE, unit: 'kt' }],
    demo: [
      step({ rot: tasRot(8000, 10) }, 'Gira el disco hasta que PA 8 000 quede bajo +10 °C.', 'Turn the disc until PA 8,000 is under +10 °C.'),
      step({ cursor: curInner(110, tasRot(8000, 10)) }, 'Busca la CAS, 110, en la escala interior.', 'Find the CAS, 110, on the inner scale.'),
      step({}, 'Sobre ella lees 1 2 7: la TAS es unos 127 kt.', 'Over it you read 1 2 7: the TAS is about 127 kt.')
    ]
  },
  {
    id: 'da-calc', level: 3, part: 'daWindow', setup: CALC0,
    task: t('Calcula la altitud de densidad: PA 5 000 ft y OAT +25 °C.', 'Work out the density altitude: PA 5,000 ft and OAT +25 °C.'),
    hint: t('Pon PA 5 000 sobre +25 °C en la ventana de TAS y lee la ventana de DA frente a su índice.', 'Put PA 5,000 over +25 °C in the TAS window and read the DA window against its index.'),
    why: t('Un día caluroso a 5 000 ft el avión se comporta como si estuviera mucho más alto: despegue más largo y ascenso más lento.', 'On a hot day at 5,000 ft the aircraft behaves as if it were much higher: longer take-off and slower climb.'),
    answers: [{ key: 'da', label: t('Altitud de densidad (ft)', 'Density altitude (ft)'), value: daAt(tasRot(5000, 25)), tol: { rel: 0.03, abs: 150 }, unit: 'ft' }],
    demo: [
      step({ rot: tasRot(5000, 25) }, 'Gira el disco hasta que PA 5 000 quede bajo +25 °C.', 'Turn the disc until PA 5,000 is under +25 °C.'),
      step({}, 'Sin moverlo, lee la ventana de altitud de densidad frente a su índice: unos 7 300 ft.', 'Without moving it, read the density altitude window against its index: about 7,300 ft.')
    ]
  },
  {
    id: 'da-why', level: 3, part: 'daWindow', setup: CALC0,
    task: t('¿Por qué una altitud de densidad alta empeora el rendimiento del avión?', 'Why does a high density altitude hurt aircraft performance?'),
    hint: t('Piensa en cuánto aire hay para la hélice, el motor y las alas.', 'Think about how much air there is for the propeller, engine and wings.'),
    why: t('Menos densidad significa menos sustentación, menos tracción y menos potencia: despegues más largos y ascensos más lentos.', 'Less density means less lift, less thrust and less power: longer take-offs and slower climbs.'),
    quiz: { choices: [
      t('El aire es menos denso: menos sustentación, tracción y potencia', 'The air is less dense: less lift, thrust and power'),
      t('Pesa más el avión', 'The aircraft weighs more'),
      t('El altímetro marca de menos', 'The altimeter under-reads'),
      t('Aumenta la presión de aire', 'Air pressure increases')
    ], answer: 0 }
  },
  {
    id: 'tas-sea', level: 3, part: 'tasWindow', setup: CALC0,
    task: t('Calcula la TAS: PA 10 000 ft, OAT 0 °C, CAS 100 kt.', 'Work out the TAS: PA 10,000 ft, OAT 0 °C, CAS 100 kt.'),
    hint: t('Pon PA 10 000 sobre 0 °C y lee la escala exterior sobre la CAS 100.', 'Put PA 10,000 over 0 °C and read the outer scale over CAS 100.'),
    why: t('Como regla de bolsillo la TAS sube un 2 % por cada 1 000 ft; el E6B lo afina con la temperatura.', 'As a rule of thumb TAS rises 2 % per 1,000 ft; the E6B refines it with temperature.'),
    answers: [{ key: 'tas', label: t('TAS (kt)', 'TAS (kt)'), value: mag(outerAt(tasRot(10000, 0), 100), 120), tol: SCALE, unit: 'kt' }],
    demo: [
      step({ rot: tasRot(10000, 0) }, 'Gira el disco hasta que PA 10 000 quede bajo 0 °C.', 'Turn the disc until PA 10,000 is under 0 °C.'),
      step({ cursor: curInner(100, tasRot(10000, 0)) }, 'Busca la CAS, 100, en la escala interior.', 'Find the CAS, 100, on the inner scale.'),
      step({}, 'Sobre ella lees la TAS en la escala exterior: unos 117 kt.', 'Over it you read the TAS on the outer scale: about 117 kt.')
    ]
  },

  // ---------- Level 5 · Wind ----------
  {
    id: 'wind-dir', level: 4, part: 'trueIndex', setup: WIND0,
    task: t('Pon la dirección del viento, 270°, bajo el TRUE INDEX.', 'Put the wind direction, 270°, under the TRUE INDEX.'),
    hint: t('Gira el disco azimutal hasta que el 270 de la rosa quede arriba, bajo el triángulo ámbar.', 'Turn the azimuth disc until the 270 of the rose is at the top, under the amber triangle.'),
    why: t('Es el primer paso del método del punto: el viento queda “hacia arriba”, de donde viene.', 'It is the first step of the dot method: the wind is “up”, where it comes from.'),
    check: (s) => s.face === 'wind' && dirNear(s, 270),
    demo: [step({ face: 'wind', dir: 270 }, 'Gira el disco hasta que 270° quede bajo el TRUE INDEX.', 'Turn the disc until 270° is under the TRUE INDEX.')]
  },
  {
    id: 'wind-mark', level: 4, part: 'windDot', setup: { face: 'wind', dir: 270, slide: 100, dots: 'clear' },
    task: t('Marca el punto de viento para 270/20: toca encima del ojal, 20 kt por encima.', 'Mark the wind dot for 270/20: tap above the grommet, 20 kt up.'),
    hint: t('Activa el lápiz y toca en la línea central, por encima del ojal, a 20 kt (arcos cada 2 kt, cifras cada 10).', 'Turn on the pencil and tap on the centre line, above the grommet, 20 kt out (arcs every 2 kt, figures every 10).'),
    why: t('El punto es el viento dibujado en el disco: dirección por su posición en la rosa, velocidad por su distancia al ojal.', 'The dot is the wind drawn on the disc: direction by its place on the rose, speed by its distance to the grommet.'),
    check: (s) => s.face === 'wind' && Array.isArray(s.dots) && s.dots.some((d) => Math.abs(angleDiff(d.b, 270)) <= DOT_B_TOL && Math.abs(d.d - 20) <= DOT_D_TOL),
    demo: [step({ dots: [dotFor(270, 20)] }, 'Marca el punto 20 kt por encima del ojal, sobre la dirección 270.', 'Mark the dot 20 kt above the grommet, over direction 270.')]
  },
  {
    id: 'wind-slide', level: 4, part: 'slideCard', setup: { face: 'wind', dir: 270, slide: 100, dots: [dotFor(WIND_A.wdir, WIND_A.wspd)] },
    task: t('Viento 270/20 ya marcado. Derrota 000, TAS 120: gira a la derrota y desliza el punto sobre el arco de 120 kt.', 'Wind 270/20 already marked. Course 000, TAS 120: rotate to the course and slide the dot onto the 120 kt arc.'),
    hint: t('Primero pon 000 bajo el TRUE INDEX. Después desliza la tarjeta hasta que el punto toque el arco de 120.', 'First put 000 under the TRUE INDEX. Then slide the card until the dot touches the 120 arc.'),
    why: t('Es el paso que resuelve el triángulo: el punto sobre el arco de la TAS fija a la vez la GS y la deriva.', 'It is the step that solves the triangle: the dot on the TAS arc sets GS and drift at once.'),
    check: (s) => s.face === 'wind' && dirNear(s, WIND_A.tc) && Array.isArray(s.dots) && s.dots.some((d) => Math.abs(readDot(d, s).speed - WIND_A.tas) <= SLIDE_TOL),
    demo: [
      step({ dir: WIND_A.tc }, 'Gira el disco hasta poner la derrota, 000, bajo el TRUE INDEX. El punto gira con él.', 'Turn the disc to put the course, 000, under the TRUE INDEX. The dot turns with it.'),
      step({ slide: SOL_A.gs }, 'Desliza la tarjeta hasta que el punto caiga sobre el arco de la TAS, 120 kt.', 'Slide the card until the dot falls on the TAS arc, 120 kt.')
    ]
  },
  {
    id: 'wind-gs', level: 4, part: 'grommet', setup: { face: 'wind', dir: WIND_A.tc, slide: SOL_A.gs, dots: [dotFor(WIND_A.wdir, WIND_A.wspd)] },
    task: t('Con el punto ya sobre el arco de 120 kt (derrota 000, viento 270/20), lee la velocidad respecto al suelo bajo el ojal.', 'With the dot already on the 120 kt arc (course 000, wind 270/20), read the ground speed under the grommet.'),
    hint: t('La velocidad bajo el ojal es la de la tarjeta: busca qué arco pasa justo bajo el centro del disco.', 'The speed under the grommet is the card reading: find which arc passes right under the centre of the disc.'),
    why: t('Es el viento de través de 20 kt: la GS es algo menor que la TAS. La usas para el ETE y el combustible.', 'It is a 20 kt crosswind: GS is somewhat below TAS. You use it for ETE and fuel.'),
    answers: [{ key: 'gs', label: t('GS (kt)', 'GS (kt)'), value: SOL_A.gs, tol: GROUND, unit: 'kt' }],
    demo: [step({}, 'Mira bajo el ojal: el arco que pasa por el centro del disco da la GS, unos 118 kt (menos que la TAS por el viento de través).', 'Look under the grommet: the arc through the centre of the disc gives the GS, about 118 kt (below TAS because of the crosswind).')]
  },
  {
    id: 'wind-th', level: 4, part: 'driftScale', setup: { face: 'wind', dir: WIND_B.tc, slide: SOL_B.gs, dots: [dotFor(WIND_B.wdir, WIND_B.wspd)] },
    task: t('Derrota 090, TAS 120, viento 180/25, ya resuelto en el disco. Lee la deriva y calcula el rumbo verdadero.', 'Course 090, TAS 120, wind 180/25, already solved on the disc. Read the drift and work out the true heading.'),
    hint: t('El punto queda a la derecha de la línea central: corrige a la derecha. TH = TC + WCA.', 'The dot is right of the centre line: correct right. TH = TC + WCA.'),
    why: t('El viento del sur te empuja hacia el norte (a la izquierda de la derrota 090), así que apuntas a la derecha: TH mayor que TC.', 'The south wind pushes you north (left of course 090), so you point right: TH greater than TC.'),
    answers: [{ key: 'th', label: t('Rumbo verdadero (°)', 'True heading (°)'), value: SOL_B.th, tol: HEADING, unit: '°', angle: true }],
    demo: [step({}, 'El punto está unos 12° a la derecha de la línea central: TH = 090 + 12 = 102°.', 'The dot is about 12° right of the centre line: TH = 090 + 12 = 102°.')]
  },
  {
    id: 'wind-full', level: 4, part: 'windDot', setup: WIND0,
    task: t('Resuelve el tramo: TC 135, TAS 110 kt, viento 210/25. Da el rumbo verdadero y la GS.', 'Solve the leg: TC 135, TAS 110 kt, wind 210/25. Give the true heading and GS.'),
    hint: t('Viento 210 bajo el índice, marca el punto 25 kt arriba, gira a 135 y desliza el punto al arco de 110.', 'Wind 210 under the index, mark the dot 25 kt up, rotate to 135 and slide the dot to the 110 arc.'),
    why: t('Es el problema completo del examen: del viento y la derrota salen el rumbo a volar y la velocidad real.', 'It is the complete exam problem: wind and course give you the heading to fly and the real speed.'),
    answers: [
      { key: 'th', label: t('Rumbo verdadero (°)', 'True heading (°)'), value: SOL_C.th, tol: HEADING, unit: '°', angle: true },
      { key: 'gs', label: t('GS (kt)', 'GS (kt)'), value: SOL_C.gs, tol: GROUND, unit: 'kt' }
    ],
    demo: [
      step({ face: 'wind', dir: WIND_C.wdir }, 'Pon la dirección del viento, 210°, bajo el TRUE INDEX.', 'Put the wind direction, 210°, under the TRUE INDEX.'),
      step({ dots: [dotFor(WIND_C.wdir, WIND_C.wspd)] }, 'Marca el punto de viento 25 kt por encima del ojal.', 'Mark the wind dot 25 kt above the grommet.'),
      step({ dir: WIND_C.tc }, 'Gira el disco hasta poner la derrota, 135°, bajo el TRUE INDEX.', 'Turn the disc to put the course, 135°, under the TRUE INDEX.'),
      step({ slide: SOL_C.gs }, 'Desliza la tarjeta hasta que el punto caiga sobre el arco de la TAS, 110 kt.', 'Slide the card until the dot falls on the TAS arc, 110 kt.'),
      step({}, 'Bajo el ojal lees la GS, unos 101 kt. El punto queda a la derecha: unos 13° de corrección, TH 148°.', 'Under the grommet you read the GS, about 101 kt. The dot is right of centre: about 13° of correction, TH 148°.')
    ]
  },
  {
    id: 'wind-sign', level: 4, part: 'driftLines', setup: WIND0,
    task: t('Tras deslizar la tarjeta, el punto de viento queda a la izquierda de la línea central. ¿Qué haces con el rumbo?', 'After sliding the card, the wind dot sits left of the centre line. What do you do with the heading?'),
    hint: t('Si queda a la derecha sumas la corrección a la derrota. ¿Y si queda a la izquierda?', 'If it is on the right you add the correction to the course. And on the left?'),
    why: t('El signo de la deriva decide si el rumbo es mayor o menor que la derrota. Equivocarlo duplica el error.', 'The sign of the drift decides whether the heading is more or less than the course. Getting it wrong doubles the error.'),
    quiz: { choices: [
      t('Resto la corrección a la derrota', 'Subtract the correction from the course'),
      t('Sumo la corrección a la derrota', 'Add the correction to the course'),
      t('Mantengo el rumbo igual que la derrota', 'Keep the heading equal to the course'),
      t('Resto 180°', 'Subtract 180°')
    ], answer: 0 }
  },
  {
    id: 'wind-find', level: 4, part: 'windDot', setup: WIND0,
    task: t('Calcula el viento: TC 090, TH 097, TAS 120 kt, GS 108 kt. Da dirección y velocidad.', 'Find the wind: TC 090, TH 097, TAS 120 kt, GS 108 kt. Give direction and speed.'),
    hint: t('TC bajo el índice y el ojal sobre 108. La deriva es TH − TC = 7° a la derecha: marca donde esa línea cruza el arco de 120 y gira el punto hasta el centro.', 'TC under the index and the grommet on 108. The drift is TH − TC = 7° right: mark where that line crosses the 120 arc and turn the dot to the centre.'),
    why: t('Es el problema inverso: sirve para conocer el viento real en ruta y actualizar el plan de vuelo.', 'It is the inverse problem: it gives you the real wind en route so you can update the flight plan.'),
    answers: [
      { key: 'wdir', label: t('Dirección del viento (°)', 'Wind direction (°)'), value: UNK_WIND.wdir, tol: { abs: 4 }, unit: '°', angle: true },
      { key: 'wspd', label: t('Velocidad del viento (kt)', 'Wind speed (kt)'), value: UNK_WIND.wspd, tol: { abs: 2 }, unit: 'kt' }
    ],
    demo: [
      step({ face: 'wind', dir: UNK.tc, slide: UNK.gs }, 'Pon la derrota, 090°, bajo el TRUE INDEX y el ojal sobre la GS, 108 kt.', 'Put the course, 090°, under the TRUE INDEX and the grommet on the GS, 108 kt.'),
      step({ dots: [dotFromReadings(UNK.tas, UNK.th - UNK.tc, UNK.gs, UNK.tc)] }, 'Marca el punto donde la línea de deriva de 7° a la derecha corta el arco de la TAS, 120 kt.', 'Mark the dot where the 7° right drift line crosses the TAS arc, 120 kt.'),
      step({ dir: UNK_WIND.wdir }, 'Gira el disco hasta que el punto quede en la línea central, encima del ojal. Bajo el TRUE INDEX está la dirección del viento.', 'Turn the disc until the dot is on the centre line, above the grommet. Under the TRUE INDEX is the wind direction.'),
      step({}, 'La distancia del punto al ojal es la velocidad del viento: unos 18 kt, de unos 143°.', 'The distance from the dot to the grommet is the wind speed: about 18 kt, from about 143°.')
    ]
  }
];

/** @param {number} level */
export const tasksOf = (level) => EXERCISES.filter((e) => e.level === level);

// ---------- Progress (localStorage, always in try/catch) ----------
const KEY = 'qubits.e6b.progress.v1';

/** @returns {Record<string, true>} ids of completed exercises */
export function loadProgress() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '{}');
    const ids = new Set(EXERCISES.map((e) => e.id));
    /** @type {Record<string, true>} */
    const done = {};
    for (const id of Object.keys(raw?.done || {})) if (ids.has(id) && raw.done[id]) done[id] = true;
    return done;
  } catch {
    return {};
  }
}

/** @param {Record<string, true>} done */
export function saveProgress(done) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ done }));
  } catch {
    /* private mode / blocked storage: progress just lives in memory */
  }
}

/** @returns {Ctx} */
export function newCtx() {
  return { lastPart: null };
}
