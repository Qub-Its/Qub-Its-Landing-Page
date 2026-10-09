// UI strings of the G1000 course shell. Lesson content lives in content/*.js. Language comes from the path:
// /en/... is English, anything else Spanish.

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
    title: 'Curso G1000',
    subtitle: 'Garmin G1000 de un C172 · curso guiado con simulador · datos ficticios',
    course: 'Curso', sim: 'Simulador', view3d: '3D',
    explain: '? Modo explicar', explainTitle: 'Cuando está activo, tocar una parte del G1000 la explica',
    glossary: 'Glosario', feedback: 'Feedback',
    back: '← Qub-its', backHref: '/#labs',
    langLabel: 'Switch to English', langText: 'EN', langHref: '/en/labs/g1000-trainer/',
    stageLabel: 'G1000 y escenas 3D', panelLabel: 'Lección, lecciones y explicación',
    tabLesson: 'Lección', tabLessons: 'Lecciones', tabExplain: 'Explicar',
    closePanel: 'Cerrar panel', collapsePanel: 'Contraer panel', railLabel: 'Abrir el panel del curso', close: 'Cerrar',
    lessonN: (n) => `Lección ${n}`, stepOf: (i, n) => `Paso ${i} de ${n}`,
    objectives: 'Objetivos', prev: '← Anterior', next: 'Siguiente →', finish: 'Terminar lección',
    lessonDone: (n) => `Lección ${n} completada`, nextLesson: 'Siguiente lección →',
    coming: 'Próximamente', progressNote: 'Tu progreso se guarda solo en este navegador (localStorage).',
    resetProgress: 'Borrar progreso', start: 'Empezar', resume: 'Continuar', review: 'Repasar',
    task: 'Tarea', quiz: 'Pregunta', scene: 'Escena 3D', explainStep: 'Explicación',
    hint: 'Pista', why: '¿Por qué?', showMe: 'Muéstrame', taskDone: '¡Hecho!', correct: '¡Correcto!', wrong: 'No es esa. Prueba otra.',
    cueNext: 'Siguiente plano', cueReplay: 'Repetir',
    demoTitle: 'Muéstrame', demoStep: (i, n) => `paso ${i} de ${n}`, demoNext: 'Siguiente', demoReplay: 'Repetir', demoClose: 'Cerrar',
    instructor: 'Instructor a los mandos', pilotAuto: 'Sigue la navegación', pilotHdg: 'Sigue el bug HDG',
    scenario: 'Escenario', scenarios: { cold: 'En tierra, apagado', ground: 'En tierra, encendido', enroute: 'En ruta' },
    viewLabel: 'Vista del G1000', tabAll: 'Todo', tabPfd: 'PFD', tabMfd: 'MFD', tabAudio: 'Audio',
    zoomIn: 'Ampliar', zoomOut: 'Reducir',
    switches: 'Interruptores', swMaster: 'MASTER', swAvionics: 'AVIONICS', swEngine: 'ARRANQUE',
    knobPad: 'Knob', outer: 'Anillo grande', inner: 'Anillo pequeño', push: 'Empujar',
    kbdNote: 'Knobs: arrastra arriba/abajo o usa la rueda (anillo grande por fuera, pequeño por dentro); toca el centro para empujar. Con un knob enfocado: ↑/↓ anillo pequeño, Shift+↑/↓ grande, Enter empuja. Para escribir identificadores usa el teclado; Enter = ENT, Esc = CLR (Backspace en modo Ampliar, donde Esc sale). Doble clic en el marco de una unidad para verla sola.',
    explainEmptyTitle: 'Modo explicar',
    explainEmpty: 'Activa “? Modo explicar” y toca cualquier parte del G1000: cintas, HSI, knobs, softkeys, panel de audio…',
    explainOn: 'Modo explicar activado: toca una parte del G1000', explainOff: 'Modo explicar desactivado',
    what: 'Qué es', read: 'Cómo se lee', why2: 'Por qué importa', clearPart: 'Quitar',
    loading3d: 'Cargando escena 3D…', nowebgl: 'Tu navegador no muestra 3D: verás un esquema en su lugar.', error3d: 'No se pudo cargar la escena 3D.', reload: 'Recargar',
    pick3d: 'Toca una unidad para ver qué hace',
    msgs: {
      na: 'No disponible en este curso', notFound: 'Identificador no encontrado', notAirport: 'Esta página solo acepta aeródromos',
      useMfd: 'En este curso el plan de vuelo se edita en el MFD', obsNeedsGps: 'OBS necesita GPS con un punto activo',
      pickLeg: 'Primero pon el cursor sobre un punto del plan', freqLoaded: 'Frecuencia cargada en standby', noPower: 'Sin MASTER no hay arranque',
    },
    menuItems: { cancelDto: 'Cancelar Direct-To', activateLeg: 'Activar tramo', deleteFpl: 'Borrar plan de vuelo', orient: 'Orientación del mapa' },
    glSearch: 'Buscar términos', glEmpty: 'Sin resultados.', terms: (n, t) => (n === t ? `${t} términos` : `${n} de ${t} términos`),
    disclaimer: 'Material educativo con datos ficticios. No apto para entrenamiento de vuelo real. “G1000” y “C172” se usan solo como referencia; sin relación con Garmin ni Cessna.',
  },
  en: {
    plate: 'LABS',
    title: 'G1000 Course',
    subtitle: 'Garmin G1000 in a C172 · guided course with simulator · fictional data',
    course: 'Course', sim: 'Simulator', view3d: '3D',
    explain: '? Explain mode', explainTitle: 'When on, tapping a G1000 part explains it',
    glossary: 'Glossary', feedback: 'Feedback',
    back: '← Qub-its', backHref: '/en/#labs',
    langLabel: 'Cambiar a español', langText: 'ES', langHref: '/labs/g1000-trainer/',
    stageLabel: 'G1000 and 3D scenes', panelLabel: 'Lesson, lessons and explanation',
    tabLesson: 'Lesson', tabLessons: 'Lessons', tabExplain: 'Explain',
    closePanel: 'Close panel', collapsePanel: 'Collapse panel', railLabel: 'Open the course panel', close: 'Close',
    lessonN: (n) => `Lesson ${n}`, stepOf: (i, n) => `Step ${i} of ${n}`,
    objectives: 'Objectives', prev: '← Back', next: 'Next →', finish: 'Finish lesson',
    lessonDone: (n) => `Lesson ${n} complete`, nextLesson: 'Next lesson →',
    coming: 'Coming soon', progressNote: 'Your progress is stored only in this browser (localStorage).',
    resetProgress: 'Reset progress', start: 'Start', resume: 'Resume', review: 'Review',
    task: 'Task', quiz: 'Question', scene: '3D scene', explainStep: 'Explanation',
    hint: 'Hint', why: 'Why?', showMe: 'Show me', taskDone: 'Done!', correct: 'Correct!', wrong: 'Not that one. Try another.',
    cueNext: 'Next shot', cueReplay: 'Replay',
    demoTitle: 'Show me', demoStep: (i, n) => `step ${i} of ${n}`, demoNext: 'Next', demoReplay: 'Replay', demoClose: 'Close',
    instructor: 'Instructor flying', pilotAuto: 'Follows navigation', pilotHdg: 'Follows HDG bug',
    scenario: 'Scenario', scenarios: { cold: 'On ground, cold', ground: 'On ground, powered', enroute: 'Enroute' },
    viewLabel: 'G1000 view', tabAll: 'All', tabPfd: 'PFD', tabMfd: 'MFD', tabAudio: 'Audio',
    zoomIn: 'Enlarge', zoomOut: 'Shrink',
    switches: 'Switches', swMaster: 'MASTER', swAvionics: 'AVIONICS', swEngine: 'STARTER',
    knobPad: 'Knob', outer: 'Large ring', inner: 'Small ring', push: 'Push',
    kbdNote: 'Knobs: drag up/down or use the wheel (large ring outside, small inside); tap the centre to push. With a knob focused: ↑/↓ small ring, Shift+↑/↓ large, Enter pushes. Type identifiers on the keyboard; Enter = ENT, Esc = CLR (Backspace while enlarged, where Esc exits). Double-click a unit’s frame to view it alone.',
    explainEmptyTitle: 'Explain mode',
    explainEmpty: 'Turn on “? Explain mode” and tap any part of the G1000: tapes, HSI, knobs, softkeys, audio panel…',
    explainOn: 'Explain mode on: tap a G1000 part', explainOff: 'Explain mode off',
    what: 'What it is', read: 'How to read it', why2: 'Why it matters', clearPart: 'Clear',
    loading3d: 'Loading 3D scene…', nowebgl: 'Your browser cannot show 3D: you will see a diagram instead.', error3d: 'The 3D scene could not be loaded.', reload: 'Reload',
    pick3d: 'Tap a unit to see what it does',
    msgs: {
      na: 'Not available in this course', notFound: 'Identifier not found', notAirport: 'This page only takes airports',
      useMfd: 'In this course the flight plan is edited on the MFD', obsNeedsGps: 'OBS needs GPS with an active waypoint',
      pickLeg: 'Put the cursor on a flight plan waypoint first', freqLoaded: 'Frequency loaded in standby', noPower: 'No MASTER, no start',
    },
    menuItems: { cancelDto: 'Cancel Direct-To', activateLeg: 'Activate leg', deleteFpl: 'Delete flight plan', orient: 'Map orientation' },
    glSearch: 'Search terms', glEmpty: 'No results.', terms: (n, t) => (n === t ? `${t} terms` : `${n} of ${t} terms`),
    disclaimer: 'Educational material with fictional data. Not for real flight training. “G1000” and “C172” are used only as references; not affiliated with Garmin or Cessna.',
  },
};

/** Picks the language branch of a {es, en} object. */
export const tr = (obj, lang) => (obj && (obj[lang] ?? obj.es)) ?? '';

/** Accent- and case-insensitive text for searching. */
export const fold = (t) => String(t).normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
