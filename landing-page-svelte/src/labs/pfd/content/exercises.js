// Exercises in three levels. Each: { id, level, scenario, part?, explain?, task, hint, why, check?, quiz?, hold? }.
//  - check(state, ctx): pure; true while the goal is met. With `hold` seconds it must stay true that long.
//  - quiz: { choices: [{es, en}], answer } instead of check (reading questions, answered in the panel).
//  - ctx = { lastPart, seen: Set<'col:value'>, start: snapshot of the state when the task began }.
//  - part: PFD part highlighted when the hint is shown; explain: switches Explain mode on for the task.
// Scenario ids come from lib/scenarios.js (cruise, climb, approach, takeoff, manual).

/** @typedef {{es: string, en: string}} L10n */
/** @typedef {{ lastPart: string|null, seen: Set<string>, start: any }} Ctx */
/**
 * @typedef {object} Exercise
 * @property {string} id
 * @property {0|1|2} level
 * @property {string} scenario
 * @property {string} [part]
 * @property {boolean} [explain]
 * @property {L10n} task
 * @property {L10n} hint
 * @property {L10n} why
 * @property {(s: any, ctx: Ctx) => boolean} [check]
 * @property {{choices: L10n[], answer: number}} [quiz]
 * @property {number} [hold]
 */

export const LEVELS = [
  { id: 0, name: { es: 'Leer', en: 'Read' },
    intro: { es: 'Aprende a leer el PFD sin tocar nada: cifras, colores y modos del FMA. Algunas preguntas se responden en el panel y otras tocando una parte del PFD con Modo explicar.',
             en: 'Learn to read the PFD without touching anything: figures, colours and FMA modes. Some questions are answered in the panel and others by tapping a PFD part in Explain mode.' } },
  { id: 1, name: { es: 'Volar', en: 'Fly' },
    intro: { es: 'Vuela a mano con el sidestick y las palancas y comprueba cómo reacciona el PFD: alabeo, velocidad vertical y tendencia de velocidad.',
             en: 'Hand-fly with the sidestick and thrust levers and see how the PFD reacts: bank, vertical speed and speed trend.' } },
  { id: 2, name: { es: 'Automatismos', en: 'Automation' },
    intro: { es: 'Maneja el FCU: velocidad, rumbo, altitud y V/S seleccionados, y mira cómo el FMA te confirma cada modo hasta capturar un ILS.',
             en: 'Use the FCU: selected speed, heading, altitude and V/S, and watch the FMA confirm each mode up to capturing an ILS.' } }
];

const near = (v, target, tol) => Math.abs(v - target) <= tol;
const angleDiff = (a, b) => ((((a - b) % 360) + 540) % 360) - 180;

/** @type {Exercise[]} */
export const EXERCISES = [
  // ---------- Level 1 · Read ----------
  {
    id: 'read-ias', level: 0, scenario: 'cruise', part: 'speedReadout',
    task: { es: '¿Qué velocidad indicada (IAS) marca ahora la ventana de la cinta de velocidad?', en: 'What indicated airspeed (IAS) does the speed tape window show right now?' },
    hint: { es: 'Es la cinta gris de la izquierda; el número está dentro de la caja junto a la línea amarilla.', en: 'It is the grey tape on the left; the number is in the box next to the yellow line.' },
    why: { es: 'La IAS es la velocidad que importa para sustentación y límites. Leerla bien es la base de todo lo demás.', en: 'IAS is the speed that matters for lift and limits. Reading it right is the base of everything else.' },
    quiz: { choices: [{ es: '220 kt', en: '220 kt' }, { es: '250 kt', en: '250 kt' }, { es: '280 kt', en: '280 kt' }, { es: '320 kt', en: '320 kt' }], answer: 1 }
  },
  {
    id: 'read-alt', level: 0, scenario: 'cruise', part: 'altReadout',
    task: { es: '¿A qué altitud vuela el avión? Mira la cinta de la derecha (los números pequeños son centenas).', en: 'What altitude is the aircraft at? Look at the right-hand tape (small numbers are hundreds).' },
    hint: { es: 'La cifra grande en la ventana del centro de la cinta, y la caja de abajo dice QNH 1013.', en: 'The big figure in the window at the centre of the tape; the box below says QNH 1013.' },
    why: { es: 'Las etiquetas de la cinta están en centenas: 100 = 10 000 ft. Confundirlo es un error clásico de principiante.', en: 'Tape labels are in hundreds: 100 = 10,000 ft. Mixing this up is a classic beginner mistake.' },
    quiz: { choices: [{ es: '1 000 ft', en: '1,000 ft' }, { es: '5 000 ft', en: '5,000 ft' }, { es: '10 000 ft', en: '10,000 ft' }, { es: '100 000 ft', en: '100,000 ft' }], answer: 2 }
  },
  {
    id: 'read-magenta', level: 0, scenario: 'cruise', part: 'speedTarget',
    task: { es: 'El triángulo de velocidad objetivo es magenta. ¿Qué significa?', en: 'The target speed triangle is magenta. What does it mean?' },
    hint: { es: 'En el FCU, la ventana de velocidad muestra guiones. Piensa en quién decide el valor.', en: 'On the FCU, the speed window shows dashes. Think about who decides the value.' },
    why: { es: 'Magenta = gestionado por el FMGC; cian = seleccionado por ti. El color te dice quién manda.', en: 'Magenta = managed by the FMGC; cyan = selected by you. The colour tells you who is in charge.' },
    quiz: { choices: [
      { es: 'Lo fijó el piloto en el FCU', en: 'The pilot set it on the FCU' },
      { es: 'Lo calcula el FMGC (velocidad gestionada)', en: 'The FMGC computes it (managed speed)' },
      { es: 'Es un límite estructural', en: 'It is a structural limit' },
      { es: 'El avión está cerca de la pérdida', en: 'The aircraft is close to the stall' }
    ], answer: 1 }
  },
  {
    id: 'read-hdg-mode', level: 0, scenario: 'cruise', part: 'fmaLateral',
    task: { es: 'En el FMA, la columna 3 (modo lateral) dice HDG. ¿Qué está haciendo el avión?', en: 'On the FMA, column 3 (lateral mode) reads HDG. What is the aircraft doing?' },
    hint: { es: 'Mira la cinta de rumbo: hay un triángulo cian. ¿De dónde viene ese valor?', en: 'Look at the heading tape: there is a cyan triangle. Where does that value come from?' },
    why: { es: 'HDG sigue el rumbo seleccionado (cian); NAV sigue el plan de vuelo. Distinguirlos evita volar a donde no quieres.', en: 'HDG follows the selected heading (cyan); NAV follows the flight plan. Telling them apart keeps you from flying where you do not want.' },
    quiz: { choices: [
      { es: 'Sigue el plan de vuelo', en: 'It follows the flight plan' },
      { es: 'Sigue el rumbo seleccionado en el FCU', en: 'It follows the heading selected on the FCU' },
      { es: 'Alinea con la pista', en: 'It aligns with the runway' },
      { es: 'El piloto automático está desconectado', en: 'The autopilot is disconnected' }
    ], answer: 1 }
  },
  {
    id: 'find-vls', level: 0, scenario: 'approach', part: 'vls', explain: true,
    task: { es: 'Encuentra la VLS: con Modo explicar activo, toca la franja ámbar de la cinta de velocidad.', en: 'Find VLS: with Explain mode on, tap the amber strip on the speed tape.' },
    hint: { es: 'Está en la parte baja de la cinta de la izquierda, por debajo de la velocidad actual. Toca la franja, no el número.', en: 'It is in the lower part of the left tape, below the current speed. Tap the strip, not the number.' },
    why: { es: 'VLS es la velocidad mínima con margen: el A/THR no te dejará bajar de ella. En aproximación es tu referencia más importante.', en: 'VLS is the minimum speed with margin: the A/THR will not let you go below it. On approach it is your most important reference.' },
    check: (_s, ctx) => ctx.lastPart === 'vls'
  },
  {
    id: 'find-fma-vertical', level: 0, scenario: 'cruise', part: 'fmaVertical', explain: true,
    task: { es: 'Con Modo explicar activo, toca la columna del FMA que indica el modo vertical (la segunda).', en: 'With Explain mode on, tap the FMA column that shows the vertical mode (the second one).' },
    hint: { es: 'Es la columna de ALT, V/S, CLB o G/S: segunda desde la izquierda, en la franja de arriba.', en: 'It is the column for ALT, V/S, CLB or G/S: second from the left, in the strip at the top.' },
    why: { es: 'Saber qué columna es cada cosa te permite leer el FMA de un vistazo y en voz alta.', en: 'Knowing which column is which lets you read the FMA at a glance and aloud.' },
    check: (_s, ctx) => ctx.lastPart === 'fmaVertical'
  },

  // ---------- Level 2 · Fly ----------
  {
    id: 'fly-bank25', level: 1, scenario: 'manual', part: 'bankScale', hold: 5,
    task: { es: 'Mantén 25° de alabeo a la derecha durante 5 segundos (entre 22° y 28°).', en: 'Hold 25° of bank to the right for 5 seconds (between 22° and 28°).' },
    hint: { es: 'Empuja el sidestick a la derecha hasta ver 25° en la escala de alabeo y suéltalo: en ley normal, con el mando neutro mantiene el alabeo.', en: 'Push the sidestick right until you see 25° on the bank scale, then release: in normal law, neutral stick holds the bank.' },
    why: { es: 'Con el sidestick pides régimen de alabeo, no ángulo: neutro mantiene lo que tienes. Un viraje normal usa 25–30°.', en: 'The sidestick commands roll rate, not angle: neutral holds what you have. A normal turn uses 25–30°.' },
    check: (s) => s.bank >= 22 && s.bank <= 28
  },
  {
    id: 'fly-climb', level: 1, scenario: 'manual', part: 'vsi', hold: 5,
    task: { es: 'Mantén una velocidad vertical entre +800 y +1500 ft/min durante 5 segundos.', en: 'Hold a vertical speed between +800 and +1,500 ft/min for 5 seconds.' },
    hint: { es: 'Tira un poco del sidestick, sube las palancas a CL o más y vigila la aguja verde de la derecha y la velocidad.', en: 'Pull the sidestick slightly, move the levers to CL or higher and watch the green needle on the right and the speed.' },
    why: { es: 'Subir sin potencia te cuesta velocidad. Por eso un ascenso estable combina cabeceo (V/S) y empuje (velocidad).', en: 'Climbing without power costs speed. A stable climb combines pitch (V/S) and thrust (speed).' },
    check: (s) => s.vs >= 800 && s.vs <= 1500
  },
  {
    id: 'fly-trend', level: 1, scenario: 'manual', part: 'speedTrend', hold: 2,
    task: { es: 'Pon las palancas en IDLE y haz que aparezca la flecha amarilla de tendencia apuntando hacia abajo.', en: 'Set the thrust levers to IDLE and make the yellow trend arrow appear pointing down.' },
    hint: { es: 'Reduce el empuje y mantén el vuelo nivelado. La flecha sale de la línea amarilla de la cinta de velocidad.', en: 'Reduce thrust and keep level flight. The arrow comes from the yellow line of the speed tape.' },
    why: { es: 'La tendencia te muestra el futuro cercano de la velocidad: corriges antes de pasarte de rango.', en: 'The trend shows the near future of the speed: you correct before leaving range.' },
    check: (s) => s.thrust === 'IDLE' && s.iasTrend <= -4
  },
  {
    id: 'fly-turn90', level: 1, scenario: 'manual', part: 'headingTape', hold: 3,
    task: { es: 'Gira 90° a la derecha y nivela las alas con el nuevo rumbo (alabeo menor de 4°) durante 3 segundos.', en: 'Turn 90° to the right and level the wings on the new heading (bank under 4°) for 3 seconds.' },
    hint: { es: 'Inicia con ≈ 25° de alabeo, mira la cinta de rumbo y empieza a nivelar unos 10° antes. Si el rumbo era 090, termina en 180.', en: 'Start with ≈ 25° of bank, watch the heading tape and start rolling out about 10° early. If the heading was 090, finish on 180.' },
    why: { es: 'Anticipar la salida del viraje es la esencia del vuelo manual: el avión sigue girando mientras sueltas.', en: 'Anticipating the rollout is the essence of hand-flying: the aircraft keeps turning while you release.' },
    check: (s, ctx) => {
      if (!ctx.start) return false;
      const d = angleDiff(s.hdg, ctx.start.hdg);
      return d >= 80 && d <= 100 && Math.abs(s.bank) < 4;
    }
  },

  // ---------- Level 3 · Automation ----------
  {
    id: 'auto-spd220', level: 2, scenario: 'cruise', part: 'speedTarget', hold: 5,
    task: { es: 'Selecciona 220 kt en el FCU (tira de la perilla de velocidad) y estabiliza: la velocidad objetivo debe ser cian.', en: 'Select 220 kt on the FCU (pull the speed knob) and stabilise: the target speed must be cyan.' },
    hint: { es: 'Gira la perilla SPD hasta 220 y tira de ella (pull). El triángulo pasa de magenta a cian. Espera a que la IAS se estabilice a ±3 kt.', en: 'Turn the SPD knob to 220 and pull it. The triangle goes from magenta to cyan. Wait for the IAS to settle within ±3 kt.' },
    why: { es: 'Seleccionada = tuya (cian). El A/THR en SPEED lleva la velocidad al objetivo por ti.', en: 'Selected = yours (cyan). The A/THR in SPEED takes the speed to the target for you.' },
    check: (s) => !s.fcu.spdManaged && near(s.fcu.spd, 220, 0.5) && near(s.ias, 220, 3)
  },
  {
    id: 'auto-hdg270', level: 2, scenario: 'cruise', part: 'hdgSelected', hold: 3,
    task: { es: 'Selecciona rumbo 270 y deja que el avión vire con el piloto automático hasta estabilizarse (±2°).', en: 'Select heading 270 and let the aircraft turn with the autopilot until it settles (±2°).' },
    hint: { es: 'Gira la perilla HDG hasta 270 y tira de ella. Confirma HDG en el FMA y observa el triángulo cian en la cinta de rumbo.', en: 'Turn the HDG knob to 270 and pull it. Confirm HDG on the FMA and watch the cyan triangle on the heading tape.' },
    why: { es: 'Cambiar el FCU no basta: hay que confirmar en el FMA que el modo cambió y el avión hace lo que pediste.', en: 'Changing the FCU is not enough: confirm on the FMA that the mode changed and the aircraft does what you asked.' },
    check: (s) => s.fma.lateral === 'HDG' && s.fcu.hdg === 270 && Math.abs(angleDiff(s.hdg, 270)) <= 2 && (s.fcu.ap1 || s.fcu.ap2)
  },
  {
    id: 'auto-vs', level: 2, scenario: 'cruise', part: 'vsi', hold: 5,
    task: { es: 'Activa V/S −1000 (selecciona −1000 ft/min en el FCU y tira de la perilla) y comprueba que el FMA muestra V/S.', en: 'Engage V/S −1000 (set −1,000 ft/min on the FCU and pull the knob) and check the FMA shows V/S.' },
    hint: { es: 'Gira la perilla V/S diez clicks hacia abajo (cada click son 100 ft/min) y tira de ella. El FMA, columna 2, debe decir V/S -1000.', en: 'Turn the V/S knob ten clicks down (each click is 100 ft/min) and pull it. FMA column 2 should read V/S -1000.' },
    why: { es: 'En V/S el piloto automático mantiene el régimen y la altitud pasa a un segundo plano: acuérdate de la altitud seleccionada.', en: 'In V/S the autopilot holds the rate and altitude takes a back seat: remember the selected altitude.' },
    check: (s) => /^V\/S/.test(s.fma.vertical) && s.fcu.vsActive && near(s.vs, -1000, 150)
  },
  {
    id: 'auto-opclb', level: 2, scenario: 'cruise', part: 'fmaVertical', hold: 2,
    task: { es: 'Sube a 12 000 ft con OP CLB y deja que el avión capture la altitud (ALT*, luego ALT).', en: 'Climb to 12,000 ft with OP CLB and let the aircraft capture the altitude (ALT*, then ALT).' },
    hint: { es: 'Gira la perilla ALT hasta 12000 y tira de ella: el FMA mostrará OP CLB y THR CLB. Al acercarte verás ALT* y luego ALT.', en: 'Turn the ALT knob to 12000 and pull it: the FMA shows OP CLB and THR CLB. As you near it you will see ALT* then ALT.' },
    why: { es: 'OP CLB lleva el empuje de ascenso y controla la velocidad con el cabeceo. La captura de ALT* es automática y suave.', en: 'OP CLB applies climb thrust and controls speed with pitch. The ALT* capture is automatic and smooth.' },
    check: (s, ctx) => ctx.seen.has('vertical:OP CLB') && s.fma.vertical === 'ALT' && s.fcu.alt === 12000 && near(s.alt, 12000, 50)
  },
  {
    id: 'auto-appr', level: 2, scenario: 'approach', part: 'locScale', hold: 3,
    task: { es: 'Arma APPR y deja que el avión capture el localizador y la senda de planeo: el FMA debe decir LOC y G/S.', en: 'Arm APPR and let the aircraft capture the localizer and glide slope: the FMA must read LOC and G/S.' },
    hint: { es: 'Pulsa APPR en el FCU. Verás LOC y G/S en cian (armados); al capturar pasan a LOC* y G/S* y luego a verde. Mira los rombos en las escalas.', en: 'Press APPR on the FCU. You will see LOC and G/S in cyan (armed); on capture they go to LOC* and G/S* and then green. Watch the diamonds on the scales.' },
    why: { es: 'APPR arma las dos capturas a la vez. Recuerda comprobar el ident del ILS y que el FMA confirme cada fase.', en: 'APPR arms both captures at once. Remember to check the ILS ident and that the FMA confirms each phase.' },
    check: (s) => s.fma.lateral === 'LOC' && s.fma.vertical === 'G/S'
  }
];

export const tasksOf = (level) => EXERCISES.filter((e) => e.level === level);

// ---------- Progress (localStorage, always in try/catch) ----------
const KEY = 'qubits.pfd.progress.v1';

/** @returns {Record<string, true>} ids of completed exercises */
export function loadProgress() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '{}');
    const ids = new Set(EXERCISES.map((e) => e.id));
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

// ---------- Runner: evaluates the active exercise on each simulation tick ----------

/** @returns {Ctx} */
export function newCtx() {
  return { lastPart: null, seen: new Set(), start: null };
}

export function createRunner() {
  let held = 0;
  return {
    reset() { held = 0; },
    /**
     * @param {Exercise} ex
     * @param {any} state
     * @param {number} dt seconds of simulation
     * @param {Ctx} ctx
     * @returns {{ done: boolean, held: number, need: number }}
     */
    tick(ex, state, dt, ctx) {
      if (!ctx.start) ctx.start = { hdg: state.hdg, alt: state.alt, ias: state.ias, bank: state.bank };
      const f = state.fma;
      if (f) for (const col of ['athr', 'vertical', 'lateral', 'approach']) if (f[col]) ctx.seen.add(`${col}:${f[col]}`);
      const need = ex.hold || 0;
      if (!ex.check) return { done: false, held: 0, need };
      let ok = false;
      try { ok = !!ex.check(state, ctx); } catch { ok = false; }
      held = ok ? held + dt : 0;
      return { done: ok && held >= need, held, need };
    }
  };
}
