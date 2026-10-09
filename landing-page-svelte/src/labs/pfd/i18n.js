// UI strings of the PFD trainer shell (header, panel, exercises, glossary). Content (parts, guide, glossary,
// exercises) lives in content/*.js. Language comes from the path: /en/... is English, anything else Spanish.

/** @typedef {'es'|'en'} Lang */

/** @returns {Lang} */
export function detectLang() {
  try {
    const p = window.location.pathname;
    return p === '/en' || p.startsWith('/en/') ? 'en' : 'es';
  } catch {
    return 'es';
  }
}

export const UI = {
  es: {
    plate: 'LABS',
    title: 'Entrenador PFD A320',
    subtitle: 'Simulador interactivo del Primary Flight Display · datos ficticios',
    explain: '? Modo explicar',
    explainTitle: 'Cuando está activo, tocar una parte del PFD la explica',
    glossary: 'Glosario',
    guide: 'Guía',
    exercises: 'Ejercicios',
    feedback: 'Feedback',
    back: '← Qub-its',
    backHref: '/#labs',
    mcduLink: 'MCDU →',
    mcduFooter: 'Programa la ruta en el MCDU →',
    mcduHref: '/labs/mcdu-trainer/',
    langLabel: 'Switch to English',
    langText: 'EN',
    langHref: '/en/labs/pfd-trainer/',
    pfdLabel: 'Primary Flight Display del A320',
    simLabel: 'Simulador',
    panelLabel: 'Guía y ejercicios',
    closePanel: 'Cerrar panel',
    close: 'Cerrar',
    kbdNote: 'Teclado: flechas = sidestick (↑ morro abajo, ↓ morro arriba, ← → alabeo). Con Modo explicar activo, toca cualquier parte del PFD.',
    // inspector / explain card
    explainEmptyTitle: 'Modo explicar',
    explainEmpty: 'Activa “? Modo explicar” y toca cualquier parte del PFD: la franja de velocidad, el FMA, la cinta de altitud…',
    explainOn: 'Modo explicar activado: toca una parte del PFD',
    explainOff: 'Modo explicar desactivado',
    what: 'Qué es',
    read: 'Cómo se lee',
    why: 'Por qué importa',
    clearPart: 'Quitar',
    // guide
    colorsTitle: 'Colores del PFD',
    howTitle: 'Cómo se lee',
    // exercises
    levels: 'Niveles',
    levelsNote: 'Todos los niveles están abiertos. Al iniciar un ejercicio, el simulador carga el escenario que necesita.',
    progressNote: 'Tu progreso se guarda solo en este navegador (localStorage).',
    level: (n) => `Nivel ${n}`,
    taskOf: (i, n) => `Ejercicio ${i} de ${n}`,
    free: 'Vuelo libre',
    pickEx: 'Elegir ejercicio',
    freeTask: 'Explora el PFD, vuela con el FCU o elige un ejercicio por niveles.',
    start: 'Empezar',
    cont: 'Continuar',
    restart: 'Repetir nivel',
    hint: 'Pista',
    hideHint: 'Ocultar pista',
    whyBtn: 'Por qué',
    hideWhy: 'Ocultar',
    skip: 'Saltar',
    next: 'Siguiente →',
    viewLevels: 'Ver niveles',
    completed: 'completado',
    levelDone: '¡Nivel completado!',
    levelDoneText: 'Has completado todos los ejercicios de este nivel.',
    taskDone: '¡Ejercicio completado!',
    holdFor: (a, b) => `Mantén ${a.toFixed(0)}/${b} s`,
    resetProgress: 'Borrar progreso',
    wrong: 'No es esa. Mira bien el PFD y prueba otra.',
    right: 'Correcto',
    pickAnswer: 'Elige una respuesta',
    clickPart: 'Toca la parte correcta del PFD con Modo explicar activo.',
    // glossary
    glSearch: 'Buscar término',
    glEmpty: 'Sin resultados.',
    terms: (n, t) => (n === t ? `${t} términos` : `${n} de ${t} términos`),
    // footer
    disclaimer: 'Datos ficticios. Este entrenador no sirve para instrucción de vuelo real y no está afiliado a Airbus ni a ningún fabricante. “A320” se usa solo como referencia nominativa.'
  },
  en: {
    plate: 'LABS',
    title: 'A320 PFD Trainer',
    subtitle: 'Interactive Primary Flight Display simulator · fictional data',
    explain: '? Explain mode',
    explainTitle: 'When on, tapping a part of the PFD explains it',
    glossary: 'Glossary',
    guide: 'Guide',
    exercises: 'Exercises',
    feedback: 'Feedback',
    back: '← Qub-its',
    backHref: '/en/#labs',
    mcduLink: 'MCDU →',
    mcduFooter: 'Program the route in the MCDU →',
    mcduHref: '/en/labs/mcdu-trainer/',
    langLabel: 'Cambiar a español',
    langText: 'ES',
    langHref: '/labs/pfd-trainer/',
    pfdLabel: 'A320 Primary Flight Display',
    simLabel: 'Simulator',
    panelLabel: 'Guide and exercises',
    closePanel: 'Close panel',
    close: 'Close',
    kbdNote: 'Keyboard: arrow keys = sidestick (↑ nose down, ↓ nose up, ← → roll). With Explain mode on, tap any part of the PFD.',
    explainEmptyTitle: 'Explain mode',
    explainEmpty: 'Turn on “? Explain mode” and tap any part of the PFD: the speed tape, the FMA, the altitude tape…',
    explainOn: 'Explain mode on: tap a part of the PFD',
    explainOff: 'Explain mode off',
    what: 'What it is',
    read: 'How to read it',
    why: 'Why it matters',
    clearPart: 'Clear',
    colorsTitle: 'PFD colours',
    howTitle: 'How to read it',
    levels: 'Levels',
    levelsNote: 'Every level is open. Starting an exercise loads the scenario it needs into the simulator.',
    progressNote: 'Your progress is stored only in this browser (localStorage).',
    level: (n) => `Level ${n}`,
    taskOf: (i, n) => `Exercise ${i} of ${n}`,
    free: 'Free flight',
    pickEx: 'Pick an exercise',
    freeTask: 'Explore the PFD, fly with the FCU, or pick a level-based exercise.',
    start: 'Start',
    cont: 'Continue',
    restart: 'Repeat level',
    hint: 'Hint',
    hideHint: 'Hide hint',
    whyBtn: 'Why',
    hideWhy: 'Hide',
    skip: 'Skip',
    next: 'Next →',
    viewLevels: 'View levels',
    completed: 'completed',
    levelDone: 'Level completed!',
    levelDoneText: 'You finished every exercise in this level.',
    taskDone: 'Exercise completed!',
    holdFor: (a, b) => `Hold ${a.toFixed(0)}/${b} s`,
    resetProgress: 'Clear progress',
    wrong: 'Not that one. Look at the PFD again and try another.',
    right: 'Correct',
    pickAnswer: 'Pick an answer',
    clickPart: 'Tap the right part of the PFD with Explain mode on.',
    glSearch: 'Search terms',
    glEmpty: 'No results.',
    terms: (n, t) => (n === t ? `${t} terms` : `${n} of ${t} terms`),
    disclaimer: 'Fictional data. This trainer is not for real flight training and is not affiliated with Airbus or any manufacturer. “A320” is used only as a nominative reference.'
  }
};

/** Picks the language branch of a {es, en} object. */
export const tr = (obj, lang) => (obj && (obj[lang] ?? obj.es)) ?? '';

/** Accent- and case-insensitive text for searching. */
export const fold = (t) => String(t).normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
