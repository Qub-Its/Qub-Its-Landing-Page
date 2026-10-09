// Guía tab content: colour legend + reading concepts as collapsible sections (like the MCDU trainer).
// Text is plain; `code` spans become <code> and glossary terms become tooltips (see glossHtml).

/** Colour legend. `c` is the CSS variable of the display colour, `sample` a short example. */
export const LEGEND = [
  { c: '--s-g', sample: 'ALT', es: 'Verde: modo activo, director de vuelo, aguja de V/S, derrota. Lo que el avión hace ahora.', en: 'Green: active mode, flight director, V/S needle, track. What the aircraft is doing now.' },
  { c: '--s-c', sample: '220', es: 'Cian: valor seleccionado por el piloto en el FCU y modos armados.', en: 'Cyan: value selected by the pilot on the FCU, and armed modes.' },
  { c: '--s-m', sample: '250', es: 'Magenta: objetivo gestionado por el FMGC (plan de vuelo) y desviaciones del ILS.', en: 'Magenta: target managed by the FMGC (flight plan) and ILS deviations.' },
  { c: '--s-a', sample: 'VLS', es: 'Ámbar: precaución. VLS, Vα prot, mensajes y desviaciones que requieren atención.', en: 'Amber: caution. VLS, Vα prot, messages and deviations that need attention.' },
  { c: '--s-r', sample: 'MAX', es: 'Rojo: límite o amenaza. Vα max, VMAX y fallos graves. Hay que actuar ya.', en: 'Red: limit or threat. Vα max, VMAX and serious failures. Act now.' },
  { c: '--s-y', sample: '▲', es: 'Amarillo: referencias del avión (símbolo, línea de velocidad) y flecha de tendencia.', en: 'Yellow: aircraft references (symbol, speed line) and the trend arrow.' },
  { c: '--s-w', sample: 'SPD', es: 'Blanco: escalas, lecturas actuales, A/THR activo y el recuadro de modo nuevo.', en: 'White: scales, current readouts, active A/THR and the new-mode box.' }
];

/** @typedef {{ p?: string, ul?: string[] }} Block */
/** @typedef {{ id: string, open?: boolean, title: string, blocks: Block[] }} Section */

/** @type {{ es: Section[], en: Section[] }} */
export const GUIDE = {
  es: [
    { id: 'layout', open: true, title: 'Qué hay en la pantalla',
      blocks: [
        { p: 'El PFD reúne seis instrumentos clásicos en una sola pantalla. En el A320 están en una “T básica”: la esfera de actitud en el centro, la velocidad a la izquierda, la altitud a la derecha y el rumbo debajo.' },
        { ul: [
          'Arriba: el FMA, con los modos del piloto automático y el empuje.',
          'Izquierda: cinta de velocidad (IAS) con velocidades límite y objetivo.',
          'Centro: esfera de actitud con escala de cabeceo y alabeo, y las barras del FD.',
          'Derecha: cinta de altitud, caja barométrica y escala de velocidad vertical.',
          'Abajo: cinta de rumbo y, con ILS, las escalas de LOC y G/S.'
        ] },
        { p: 'Activa “? Modo explicar” y toca cualquier parte: verás qué es, cómo se lee y por qué importa.' }
      ] },
    { id: 'scan', title: 'Cómo se lee un PFD: el escaneo',
      blocks: [
        { p: 'Mirar un PFD no es mirar un punto sino recorrerlo siempre en el mismo orden. Un escaneo típico es: FMA → actitud → velocidad → altitud → velocidad vertical → rumbo, y vuelta al centro.' },
        { ul: [
          'FMA: ¿qué cree el avión que debe hacer? Lee en voz alta cada cambio.',
          'Actitud: ¿el avión está donde espero (cabeceo y alabeo)?',
          'Velocidad: ¿estoy sobre VLS y cerca del objetivo? ¿cómo va la tendencia?',
          'Altitud y V/S: ¿hacia dónde voy y a qué ritmo? ¿llegaré a la altitud seleccionada?',
          'Rumbo: ¿sigo el rumbo o la derrota que quiero?'
        ] },
        { p: 'La actitud es el centro del escaneo: tras mirar cada dato, vuelves a ella. Cualquier cosa que te sorprenda se contrasta con otros instrumentos.' }
      ] },
    { id: 'fma', title: 'Leer el FMA',
      blocks: [
        { p: 'Son 5 columnas y 3 filas. Cada columna responde una pregunta distinta:' },
        { ul: [
          'Columna 1: ¿cómo se gestiona el empuje? (`SPEED`, `MACH`, `THR CLB`, `THR IDLE`, `MAN TOGA`).',
          'Columna 2: modo vertical (`SRS`, `CLB`, `OP CLB`, `ALT*`, `ALT`, `V/S`, `G/S`).',
          'Columna 3: modo lateral (`NAV`, `HDG`, `LOC`).',
          'Columna 4: capacidad de aproximación (`CAT 1`, `CAT 3 DUAL`).',
          'Columna 5: AP, FD y A/THR acoplados.'
        ] },
        { p: 'Fila 1 (verde) es el modo activo, fila 2 (cian) el armado y fila 3 mensajes. Cuando un modo cambia, un recuadro blanco lo rodea 10 s: es la señal para leerlo en voz alta.' },
        { p: 'Regla de oro: el FMA te dice lo que el avión está haciendo; el FCU, lo que le has pedido. Si no coinciden, algo cambió.' }
      ] },
    { id: 'managed', title: 'Gestionado vs seleccionado',
      blocks: [
        { p: 'Cada perilla del FCU tiene dos modos. Empujar (push) entrega el control al FMGC: gestionado, ventana con guiones y objetivos en magenta. Tirar (pull) lo toma el piloto: seleccionado, valor visible y objetivos en cian.' },
        { ul: [
          'Velocidad: SPD/MACH. Push = sigue la velocidad del plan; pull = mantiene la del FCU.',
          'Rumbo: HDG. Push = NAV (sigue el plan); pull = HDG (sigue el rumbo cian).',
          'Altitud: ALT. Push = ALT con restricciones; pull = OP CLB / OP DES según el sentido.',
          'V/S: push = nivela (V/S 0); pull = mantiene la V/S del FCU.'
        ] },
        { p: 'El color es la pista: cian lo decidiste tú, magenta lo decide el avión.' }
      ] },
    { id: 'speed', title: 'La cinta de velocidad en 30 segundos',
      blocks: [
        { ul: [
          'Franja ámbar (VLS): no bajes de aquí.',
          'Banda ámbar y negra (Vα prot): aquí empieza la protección contra la pérdida.',
          'Franja roja (Vα max): el límite aerodinámico.',
          'Banda roja y negra (VMAX): límite estructural; baja al extender flaps.',
          'Punto verde: mejor planeo en configuración limpia. S y F: retracción de slats y flaps.',
          'Flecha amarilla: la velocidad que tendrás en 10 s.'
        ] },
        { p: 'En aproximación vuelas cerca de VLS (más 5 kt o lo que defina el procedimiento). En crucero alto, miras Mach y el límite es MMO.' }
      ] },
    { id: 'protections', title: 'Protecciones de ley normal',
      blocks: [
        { p: 'En ley normal los ordenadores filtran lo que pides con el sidestick. Las marcas verdes “=” indican los límites:' },
        { ul: [
          'Alabeo: máximo 67°; por encima de 33° y con el sidestick neutro, el avión vuelve a 33°.',
          'Cabeceo: +30° y −15°.',
          'Ángulo de ataque: bajo Vα prot el sidestick manda alfa; Vα max es el tope.',
          'Velocidad alta: sobre VMAX, la protección tira del morro hacia arriba.'
        ] },
        { p: 'Si el avión pierde la ley normal, las protecciones desaparecen y se vuelve a volar “a la antigua”. Este entrenador solo simula la ley normal.' }
      ] },
    { id: 'approach', title: 'Aproximación: LOC y G/S',
      blocks: [
        { p: 'Con el ILS, aparecen la escala de LOC bajo la esfera y la de G/S a su derecha. El rombo se vuela “hacia” el rombo: si está a la derecha, ve a la derecha; si está abajo, baja.' },
        { ul: [
          'Pulsa APPR: se arma LOC y G/S (cian). En el FMA aparece `LOC` y `G/S` en la fila de armados.',
          'Cuando el haz se activa, pasan a `LOC*` y `G/S*` (captura) y luego a `LOC` y `G/S`.',
          'La columna 4 muestra la capacidad (`CAT 1` o `CAT 3 DUAL`).'
        ] },
        { p: 'Antes de confiar en el ILS comprueba el ident y la frecuencia, abajo a la izquierda.' }
      ] },
    { id: 'mistakes', title: 'Errores típicos',
      blocks: [
        { ul: [
          'No leer el FMA tras mover una perilla: el modo que querías puede no haberse activado.',
          'Confundir cian con magenta: cian es tuyo, magenta del avión.',
          'Perseguir la velocidad en vez de mirar la flecha de tendencia.',
          'Mirar solo la altitud y no la V/S: no ves que vas a pasarte hasta que ya pasó.',
          'Olvidar la referencia barométrica (`QNH` / `STD`) al cruzar la altitud de transición.'
        ] }
      ] },
    { id: 'sim', title: 'Qué simplifica este entrenador',
      blocks: [
        { p: 'Un solo avión de 64 t, sin viento ni fallos, ley normal siempre, NAV sigue un rumbo ficticio y el ILS tiene un solo escenario. Los datos son ficticios y no sirven para instrucción real.' }
      ] }
  ],
  en: [
    { id: 'layout', open: true, title: 'What is on the screen',
      blocks: [
        { p: 'The PFD packs six classic instruments in one display. On the A320 they form a “basic T”: attitude sphere in the centre, speed on the left, altitude on the right and heading below.' },
        { ul: [
          'Top: the FMA, with the autopilot and thrust modes.',
          'Left: speed tape (IAS) with limit and target speeds.',
          'Centre: attitude sphere with pitch and bank scales, and the FD bars.',
          'Right: altitude tape, baro box and vertical speed scale.',
          'Bottom: heading tape and, with an ILS, the LOC and G/S scales.'
        ] },
        { p: 'Turn on “? Explain mode” and tap any part: you will see what it is, how to read it and why it matters.' }
      ] },
    { id: 'scan', title: 'How to read a PFD: the scan',
      blocks: [
        { p: 'Reading a PFD is not staring at one spot but sweeping it in the same order every time. A typical scan is: FMA → attitude → speed → altitude → vertical speed → heading, and back to the centre.' },
        { ul: [
          'FMA: what does the aircraft think it should do? Call out every change.',
          'Attitude: is the aircraft where I expect (pitch and bank)?',
          'Speed: am I above VLS and close to target? What does the trend say?',
          'Altitude and V/S: where am I heading and how fast? Will I make the selected altitude?',
          'Heading: am I on the heading or track I want?'
        ] },
        { p: 'Attitude is the hub of the scan: after each item you return to it. Anything that surprises you is cross-checked with the other instruments.' }
      ] },
    { id: 'fma', title: 'Reading the FMA',
      blocks: [
        { p: 'There are 5 columns and 3 rows. Each column answers a different question:' },
        { ul: [
          'Column 1: how is thrust managed? (`SPEED`, `MACH`, `THR CLB`, `THR IDLE`, `MAN TOGA`).',
          'Column 2: vertical mode (`SRS`, `CLB`, `OP CLB`, `ALT*`, `ALT`, `V/S`, `G/S`).',
          'Column 3: lateral mode (`NAV`, `HDG`, `LOC`).',
          'Column 4: approach capability (`CAT 1`, `CAT 3 DUAL`).',
          'Column 5: AP, FD and A/THR engagement.'
        ] },
        { p: 'Row 1 (green) is the active mode, row 2 (cyan) the armed mode and row 3 messages. When a mode changes, a white box surrounds it for 10 s: your cue to call it out.' },
        { p: 'Golden rule: the FMA says what the aircraft is doing; the FCU says what you asked. If they differ, something changed.' }
      ] },
    { id: 'managed', title: 'Managed vs selected',
      blocks: [
        { p: 'Each FCU knob has two modes. Pushing hands control to the FMGC: managed, dashed window and magenta targets. Pulling takes it as the pilot: selected, value visible and cyan targets.' },
        { ul: [
          'Speed: SPD/MACH. Push = follows the plan speed; pull = holds the FCU one.',
          'Heading: HDG. Push = NAV (follows the plan); pull = HDG (follows the cyan heading).',
          'Altitude: ALT. Push = ALT with constraints; pull = OP CLB / OP DES depending on direction.',
          'V/S: push = level off (V/S 0); pull = holds the FCU V/S.'
        ] },
        { p: 'Colour is the clue: cyan you decided, magenta the aircraft decided.' }
      ] },
    { id: 'speed', title: 'The speed tape in 30 seconds',
      blocks: [
        { ul: [
          'Amber strip (VLS): do not go below.',
          'Amber and black band (Vα prot): alpha protection starts here.',
          'Red strip (Vα max): the aerodynamic limit.',
          'Red and black band (VMAX): structural limit; it drops as flaps extend.',
          'Green dot: best glide in clean configuration. S and F: slat and flap retraction.',
          'Yellow arrow: the speed you will have in 10 s.'
        ] },
        { p: 'On approach you fly near VLS (plus 5 kt or whatever the procedure says). At high cruise you watch Mach and the limit is MMO.' }
      ] },
    { id: 'protections', title: 'Normal law protections',
      blocks: [
        { p: 'In normal law the computers filter what you command with the sidestick. The green “=” marks show the limits:' },
        { ul: [
          'Bank: maximum 67°; above 33° with neutral stick the aircraft rolls back to 33°.',
          'Pitch: +30° and −15°.',
          'Angle of attack: below Vα prot the sidestick commands alpha; Vα max is the cap.',
          'High speed: above VMAX the protection pitches the nose up.'
        ] },
        { p: 'If the aircraft loses normal law the protections go away and you fly “the old way”. This trainer simulates normal law only.' }
      ] },
    { id: 'approach', title: 'Approach: LOC and G/S',
      blocks: [
        { p: 'With an ILS the LOC scale appears under the sphere and the G/S scale to its right. You fly toward the diamond: if it is on the right, go right; if it is low, go down.' },
        { ul: [
          'Press APPR: LOC and G/S are armed (cyan). The FMA shows `LOC` and `G/S` on the armed row.',
          'When the beam becomes active they change to `LOC*` and `G/S*` (capture) and then `LOC` and `G/S`.',
          'Column 4 shows the capability (`CAT 1` or `CAT 3 DUAL`).'
        ] },
        { p: 'Before trusting the ILS check the ident and frequency, bottom left.' }
      ] },
    { id: 'mistakes', title: 'Typical mistakes',
      blocks: [
        { ul: [
          'Not reading the FMA after turning a knob: the mode you wanted may not have engaged.',
          'Mixing up cyan and magenta: cyan is yours, magenta is the aircraft’s.',
          'Chasing the speed instead of watching the trend arrow.',
          'Watching only altitude and not V/S: you only notice an overshoot after it happened.',
          'Forgetting the baro reference (`QNH` / `STD`) when crossing the transition altitude.'
        ] }
      ] },
    { id: 'sim', title: 'What this trainer simplifies',
      blocks: [
        { p: 'A single 64 t aircraft, no wind or failures, normal law always, NAV follows a fictional heading and the ILS has a single scenario. Data is fictional and not for real training.' }
      ] }
  ]
};
