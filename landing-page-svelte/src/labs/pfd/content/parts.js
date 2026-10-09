// Explain-mode content: one entry per data-part id drawn on the PFD (see the part-id table in the plan).
// Each entry has es + en with { title, what, read, why }. Glossary terms are turned into tooltips at render time.

/** @typedef {{ title: string, what: string, read: string, why: string }} PartText */
/** @type {Record<string, {es: PartText, en: PartText}>} */
export const PARTS = {
  // ---------- Attitude ----------
  attitude: {
    es: { title: 'Esfera de actitud', what: 'El horizonte artificial: la mitad azul es el cielo, la marrón la tierra. Es el centro del PFD y lo primero que miras al volar a mano.',
          read: 'La línea entre azul y marrón es el horizonte real. Si el avión alabea, la esfera gira al revés; si el morro sube, el horizonte baja respecto al símbolo amarillo.',
          why: 'Es la única referencia directa de la posición del avión. En nubes o de noche, todo lo demás se interpreta a partir de ella.' },
    en: { title: 'Attitude sphere', what: 'The artificial horizon: the blue half is sky, the brown half ground. It is the centre of the PFD and the first thing you scan when hand-flying.',
          read: 'The line between blue and brown is the true horizon. When the aircraft banks the sphere rotates the opposite way; when the nose rises the horizon drops relative to the yellow symbol.',
          why: 'It is the only direct reference of the aircraft position. In cloud or at night everything else is interpreted from it.' }
  },
  pitchLadder: {
    es: { title: 'Escala de cabeceo', what: 'Las rayas horizontales sobre el horizonte, cada 2,5° con cifras cada 10°.',
          read: 'Cuenta rayas desde el símbolo amarillo hasta el horizonte: cada 10° tiene una raya larga con número. Rayas por encima del horizonte = morro arriba.',
          why: 'Te dice cuánto cabeceo llevas. Con la velocidad baja, el pitch para mantener nivel sube porque aumenta el ángulo de ataque.' },
    en: { title: 'Pitch ladder', what: 'The horizontal bars above and below the horizon, every 2.5° with numbers every 10°.',
          read: 'Count bars from the yellow symbol to the horizon: every 10° has a long bar with a number. Bars above the horizon = nose up.',
          why: 'It tells you how much pitch you carry. At low speed the pitch needed for level flight rises because the angle of attack increases.' }
  },
  bankScale: {
    es: { title: 'Escala de alabeo', what: 'El arco en la parte superior de la esfera con marcas en 10, 20, 30 y 45° y un triángulo que indica el alabeo actual.',
          read: 'El triángulo (índice de alabeo) se mueve sobre el arco. Una marca más grande en 30° ayuda a reconocer un viraje cerrado; en el avión real se vuelve ámbar con alabeos extremos.',
          why: 'Un viraje estándar usa 25–30°. Pasar de 33° con el sidestick neutro lo devuelve a 33° en ley normal; saber leerlo evita virajes bruscos.' },
    en: { title: 'Bank scale', what: 'The arc at the top of the sphere with marks at 10, 20, 30 and 45° and a triangle showing the current bank.',
          read: 'The triangle (roll index) moves along the arc. The larger mark at 30° helps you recognise a steep turn; on the real aircraft it turns amber at extreme bank angles.',
          why: 'A standard turn uses 25–30°. Past 33° with neutral stick, normal law rolls back to 33°; reading it prevents abrupt turns.' }
  },
  aircraftSymbol: {
    es: { title: 'Símbolo del avión', what: 'Las alas y el cuadrado amarillos fijos en el centro de la pantalla: representan tu avión.',
          read: 'No se mueve. Lo que se mueve es el horizonte. La distancia entre el símbolo y el horizonte es tu cabeceo; el ángulo entre ellos es tu alabeo.',
          why: 'Es el punto de comparación de todo: las barras del director de vuelo se siguen “poniendo el símbolo sobre ellas”.' },
    en: { title: 'Aircraft symbol', what: 'The fixed yellow wings and square at the screen centre: they represent your aircraft.',
          read: 'It never moves; the horizon does. The distance between symbol and horizon is your pitch; the angle between them is your bank.',
          why: 'It is the comparison point for everything: the flight director bars are followed by “placing the symbol on them”.' }
  },
  fdBars: {
    es: { title: 'Barras del director de vuelo', what: 'Dos barras verdes (una horizontal, una vertical) que muestran la orden del FD para seguir los modos activos del FMA.',
          read: 'Si la barra está arriba del símbolo, sube el morro; si está a la derecha, alabea a la derecha. Cuando el símbolo amarillo queda centrado en las barras, sigues la orden.',
          why: 'Con AP desconectado es tu guía principal. Si no hay barras, el FD está apagado (botón FD del FCU) o no hay modo activo.' },
    en: { title: 'Flight director bars', what: 'Two green bars (one horizontal, one vertical) showing the FD command to follow the FMA active modes.',
          read: 'If the bar is above the symbol, pitch up; if it is to the right, roll right. When the yellow symbol sits centred on the bars you are following the command.',
          why: 'With the AP off it is your main guidance. No bars means the FD is off (FD button on the FCU) or no mode is active.' }
  },
  sideslip: {
    es: { title: 'Índice de derrape', what: 'El trapecio amarillo bajo el triángulo de alabeo.',
          read: 'Está pegado al triángulo cuando el vuelo es coordinado. Si se desplaza a un lado, hay derrape; pisa el pedal del lado hacia el que se movió para centrarlo.',
          why: 'Un vuelo coordinado es más eficiente y cómodo. En el A320 el derrape casi se corrige solo, pero con falla de motor importa mucho.' },
    en: { title: 'Sideslip index', what: 'The yellow trapezoid under the roll triangle.',
          read: 'It sits against the triangle in coordinated flight. If it slides to one side you are slipping; push the rudder on the side it moved toward to centre it.',
          why: 'Coordinated flight is more efficient and comfortable. The A320 largely does it for you, but it matters a lot with an engine failure.' }
  },
  protections: {
    es: { title: 'Marcas de protección', what: 'Símbolos verdes “=” a 67° de alabeo y a +30° / −15° de cabeceo en la escala de la esfera.',
          read: 'Son los límites que el sistema de mandos no te deja superar en ley normal. Si el avión llegara a ellos con el sidestick a fondo, se detendría ahí.',
          why: 'Te recuerdan que el avión se protege solo, pero no sustituyen el criterio: las protecciones se pierden si la ley cambia de normal a alterna.' },
    en: { title: 'Protection marks', what: 'Green “=” symbols at 67° of bank and +30° / −15° of pitch on the sphere scale.',
          read: 'They are the limits the flight controls will not let you exceed in normal law. Even with full stick the aircraft would stop there.',
          why: 'They remind you the aircraft protects itself, but they do not replace judgement: protections are lost if the law degrades from normal.' }
  },

  // ---------- Speed ----------
  speedTape: {
    es: { title: 'Cinta de velocidad', what: 'La escala vertical gris de la izquierda que se mueve: muestra la velocidad indicada (IAS) con unos ±40 kt alrededor de la actual.',
          read: 'Los números suben hacia arriba. La referencia amarilla del centro marca la velocidad actual; todo lo que está arriba es más rápido, lo de abajo más lento.',
          why: 'Es la ventana de seguridad en velocidad: te muestra de un vistazo cuánto margen tienes hacia la pérdida (abajo) y hacia el límite estructural (arriba).' },
    en: { title: 'Speed tape', what: 'The grey vertical moving scale on the left: it shows indicated airspeed (IAS) about ±40 kt around the current one.',
          read: 'Numbers rise upward. The yellow reference at the centre marks the current speed; anything above is faster, anything below is slower.',
          why: 'It is the speed safety window: at a glance you see how much margin you have toward the stall (below) and the structural limit (above).' }
  },
  speedReadout: {
    es: { title: 'Lectura de velocidad', what: 'La ventana en el centro de la cinta con la velocidad actual en nudos.',
          read: 'Es el número que va cambiando junto a la línea amarilla. Si se vuelve ámbar, estás por debajo de la velocidad mínima (VLS) o muy cerca de ella.',
          why: 'Es el dato que más veces leerás. Aprende a asociarlo con el objetivo cian o magenta: la diferencia dice si aceleras o frenas.' },
    en: { title: 'Speed readout', what: 'The window in the middle of the tape with the current speed in knots.',
          read: 'It is the number that changes next to the yellow line. If it turns amber, you are below or near the minimum speed (VLS).',
          why: 'It is the figure you will read most. Learn to compare it with the cyan or magenta target: the difference tells you whether you are accelerating or slowing.' }
  },
  speedTrend: {
    es: { title: 'Flecha de tendencia de velocidad', what: 'Una flecha amarilla que sale de la referencia de velocidad hacia arriba o hacia abajo.',
          read: 'La punta es la velocidad que tendrás en unos 10 s si mantienes la aceleración actual. Cuanto más larga, más aceleras o frenas.',
          why: 'Te permite anticipar: corriges el empuje antes de pasarte, en vez de perseguir la velocidad.' },
    en: { title: 'Speed trend arrow', what: 'A yellow arrow from the speed reference pointing up or down.',
          read: 'Its tip is the speed you will have in about 10 s if you keep the current acceleration. The longer it is, the faster you accelerate or decelerate.',
          why: 'It lets you anticipate: you fix thrust before overshooting instead of chasing the speed.' }
  },
  speedTarget: {
    es: { title: 'Velocidad objetivo', what: 'El triángulo (o la cifra, si está fuera de escala) del objetivo de velocidad que sigue el A/THR o que debes mantener.',
          read: 'Magenta = viene del FMGC (velocidad gestionada). Cian = la fijaste tú en el FCU (seleccionada). Si cae fuera de la cinta, el número aparece arriba o abajo.',
          why: 'El color te dice quién manda: un objetivo cian es tuyo; uno magenta lo calcula el avión. Reconocer el color evita sorpresas al cambiar de modo.' },
    en: { title: 'Target speed', what: 'The triangle (or number, when off-scale) of the speed target the A/THR follows or you should hold.',
          read: 'Magenta = from the FMGC (managed speed). Cyan = you set it on the FCU (selected speed). When it falls off the tape, the number appears at the top or bottom.',
          why: 'The colour tells you who is in charge: a cyan target is yours, a magenta one is computed by the aircraft. Recognising it avoids surprises when changing mode.' }
  },
  vls: {
    es: { title: 'VLS — velocidad mínima seleccionable', what: 'La franja ámbar que parte de la parte baja de la cinta hacia arriba hasta la velocidad mínima con margen.',
          read: 'Tu velocidad debe estar por encima del borde superior de la franja. Si la lectura entra en el ámbar, estás por debajo de la velocidad que el avión considera segura para la configuración.',
          why: 'El A/THR y el piloto automático no te llevarán por debajo de VLS. En aproximaciones es la referencia más importante: se calcula con peso y configuración.' },
    en: { title: 'VLS — lowest selectable speed', what: 'The amber strip rising from the bottom of the tape up to the minimum speed with margin.',
          read: 'Your speed must stay above the top edge of the strip. If the readout enters the amber, you are below the speed the aircraft considers safe for the configuration.',
          why: 'A/THR and the autopilot will not take you below VLS. On approach it is the most important reference: it depends on weight and configuration.' }
  },
  vaProt: {
    es: { title: 'Vα prot — protección de alfa', what: 'La banda ámbar y negra en la parte baja de la cinta, bajo la franja VLS.',
          read: 'El inicio (borde superior) de la banda es el punto donde empieza la protección de ángulo de ataque. Más abajo todavía queda un margen hasta Vα max.',
          why: 'Al entrar en la banda, el sidestick pasa a pedir ángulo de ataque, el AP se desconecta y el avión rechaza meterse en pérdida. Es la protección “anti-pérdida”.' },
    en: { title: 'Vα prot — alpha protection', what: 'The amber-and-black band at the bottom of the tape, under the VLS strip.',
          read: 'Its top edge is the point where angle-of-attack protection starts. There is still a margin below it up to Vα max.',
          why: 'On entering the band the sidestick starts commanding angle of attack, the AP disconnects and the aircraft refuses to stall. It is the “anti-stall” protection.' }
  },
  vaMax: {
    es: { title: 'Vα max — alfa máximo', what: 'La franja roja más baja de la cinta.',
          read: 'Es la velocidad a la que el avión alcanza su máximo ángulo de ataque utilizable. Con el sidestick atrás a tope llegas a este borde, sin pasarlo.',
          why: 'Muestra el límite real: no es la pérdida pura, sino el mejor rendimiento posible dentro de las protecciones.' },
    en: { title: 'Vα max — maximum alpha', what: 'The lowest red strip of the tape.',
          read: 'It is the speed at which the aircraft reaches its maximum usable angle of attack. Full back stick takes you to this edge and no further.',
          why: 'It shows the real limit: not the pure stall, but the best performance available within the protections.' }
  },
  vmax: {
    es: { title: 'VMAX — velocidad máxima', what: 'La banda roja y negra en la parte alta de la cinta.',
          read: 'Es el menor de VMO/MMO, VFE (flaps) y VLE (tren) para la configuración actual. Al extender flaps o tren, la banda baja.',
          why: 'Más allá de ese borde corres riesgo estructural. Si la superas, la protección de velocidad alta tira del morro hacia arriba.' },
    en: { title: 'VMAX — maximum speed', what: 'The red-and-black band at the top of the tape.',
          read: 'It is the lowest of VMO/MMO, VFE (flaps) and VLE (gear) for the current configuration. It drops when you extend flaps or gear.',
          why: 'Beyond that edge you risk structural damage. If you exceed it, the high-speed protection pitches the nose up.' }
  },
  greenDot: {
    es: { title: 'Green dot — punto verde', what: 'El círculo verde sobre la cinta, solo en configuración limpia.',
          read: 'Marca la velocidad de mejor relación sustentación/resistencia. Cambia con el peso y la altitud.',
          why: 'Es la referencia de espera y la velocidad objetivo si te falla un motor y no has abierto flaps: planeas lo más lejos posible.' },
    en: { title: 'Green dot', what: 'The green circle on the tape, only in clean configuration.',
          read: 'It marks the best lift-to-drag speed. It changes with weight and altitude.',
          why: 'It is the holding reference and the target speed after an engine failure with flaps up: you glide the farthest.' }
  },
  sfSpeeds: {
    es: { title: 'Velocidades S y F', what: 'Las letras S y F pegadas a la cinta de velocidad cuando hay flaps.',
          read: 'S = velocidad mínima para recoger los slats. F = mínima para recoger los flaps al paso anterior. Se retraen cuando la velocidad es mayor a la letra.',
          why: 'Si los retraes demasiado pronto pierdes sustentación; si los dejas puestos de más, superas VFE. Son tu guía para limpiar el avión.' },
    en: { title: 'S and F speeds', what: 'The letters S and F beside the speed tape when flaps are extended.',
          read: 'S = minimum speed to retract the slats. F = minimum speed to retract flaps to the previous step. Retract when your speed is above the letter.',
          why: 'Retract too early and you lose lift; leave them out too long and you exceed VFE. They guide you when cleaning up the aircraft.' }
  },
  v1: {
    es: { title: 'V1 en la cinta', what: 'Un “1” cian a la altura de la velocidad de decisión, solo en el despegue.',
          read: 'Antes de V1 puedes abortar; después, continúas el despegue. VR y V2 se leen del MCDU.',
          why: 'Muestra el punto de no retorno de forma visual mientras aceleras.' },
    en: { title: 'V1 on the tape', what: 'A cyan “1” at the decision speed, shown on takeoff only.',
          read: 'Before V1 you can abort; after it, you continue the takeoff. VR and V2 come from the MCDU.',
          why: 'It shows the point of no return visually while you accelerate.' }
  },
  mach: {
    es: { title: 'Lectura de Mach', what: 'El número bajo la cinta de velocidad (por ejemplo .78) cuando el Mach supera .50.',
          read: 'Es la velocidad respecto al sonido. En altura, el piloto vuela por Mach en lugar de nudos.',
          why: 'A cierta altitud el límite no es VMO sino MMO, y la pérdida y los efectos de compresibilidad dependen del Mach.' },
    en: { title: 'Mach readout', what: 'The number under the speed tape (for example .78) once Mach exceeds .50.',
          read: 'It is speed relative to the sound. At altitude the pilot flies by Mach instead of knots.',
          why: 'Above a certain altitude the limit is MMO rather than VMO, and stall and compressibility effects depend on Mach.' }
  },

  // ---------- Altitude ----------
  altTape: {
    es: { title: 'Cinta de altitud', what: 'La escala vertical de la derecha que se mueve: altitud barométrica en pies, con marcas cada 100 ft.',
          read: 'Los números son centenas (100 = 10 000 ft). Las cifras suben hacia arriba. La ventana del centro tiene la altitud exacta.',
          why: 'Es la referencia contra el terreno y los otros aviones: el número, la altitud seleccionada y la velocidad vertical se leen juntos.' },
    en: { title: 'Altitude tape', what: 'The moving vertical scale on the right: barometric altitude in feet, with marks every 100 ft.',
          read: 'Numbers are hundreds (100 = 10,000 ft). Figures rise upward. The window at the centre holds the exact altitude.',
          why: 'It is the reference against terrain and other traffic: the number, the selected altitude and the vertical speed are read together.' }
  },
  altReadout: {
    es: { title: 'Lectura de altitud', what: 'El tambor numérico en el centro de la cinta con la altitud actual.',
          read: 'Los dígitos de miles y centenas son fijos y las decenas ruedan. A 10 000 ft muestra 10 000; en FL, aparece como FL100.',
          why: 'Compárala siempre con la altitud seleccionada cian y con la velocidad vertical: juntas dicen si vas a capturar.' },
    en: { title: 'Altitude readout', what: 'The numeric drum at the centre of the tape with the current altitude.',
          read: 'The thousands and hundreds digits are fixed and the tens roll. At 10,000 ft it shows 10 000; at FL it appears as FL100.',
          why: 'Always compare it with the cyan selected altitude and the vertical speed: together they tell whether you will capture.' }
  },
  altSelected: {
    es: { title: 'Altitud seleccionada', what: 'El símbolo o número cian de la altitud que fijaste en el FCU.',
          read: 'Dentro de la cinta aparece como un marcador; fuera, como número arriba o abajo. Magenta si es una restricción del plan.',
          why: 'Es el objetivo vertical: modos como OP CLB o V/S terminan al capturarla (ALT* y ALT).' },
    en: { title: 'Selected altitude', what: 'The cyan symbol or number of the altitude you set on the FCU.',
          read: 'Within the tape it shows as a marker; off-scale, as a number above or below. Magenta if it is a flight-plan constraint.',
          why: 'It is the vertical target: modes like OP CLB or V/S end when they capture it (ALT* then ALT).' }
  },
  baro: {
    es: { title: 'Referencia barométrica', what: 'La caja bajo la cinta de altitud con QNH 1013 o STD.',
          read: 'QNH + valor = altitud sobre el mar; STD = 1013 hPa y la cinta muestra niveles de vuelo (FL).',
          why: 'Un ajuste equivocado desplaza todas las altitudes. Se cambia al cruzar la altitud de transición.' },
    en: { title: 'Barometric reference', what: 'The box under the altitude tape showing QNH 1013 or STD.',
          read: 'QNH + value = altitude above sea level; STD = 1013 hPa and the tape shows flight levels (FL).',
          why: 'A wrong setting shifts every altitude. It is changed when crossing the transition altitude.' }
  },
  landingElev: {
    es: { title: 'Elevación del terreno', what: 'Una barra azul en la cinta que aparece cerca del suelo, a la elevación del aeropuerto.',
          read: 'El borde superior de la barra azul es la altura del terreno; cuando la cinta alcanza la barra, estás en el suelo.',
          why: 'Visualiza cuánto te queda hasta el terreno. Complementa al radioaltímetro, que aparece bajo 2500 ft.' },
    en: { title: 'Terrain elevation', what: 'A blue bar on the tape that appears near the ground, at the airport elevation.',
          read: 'The top of the blue bar is the terrain height; when the tape reaches the bar you are on the ground.',
          why: 'It shows how far you are from the terrain. It complements the radio altimeter, which appears below 2,500 ft.' }
  },

  // ---------- VSI ----------
  vsi: {
    es: { title: 'Velocidad vertical (VSI)', what: 'La escala vertical a la derecha de la cinta de altitud con una aguja verde.',
          read: 'La escala no es lineal: 1, 2 y 6 (×1000 fpm). Cuando la velocidad vertical supera 200 fpm aparece la cifra en centenas.',
          why: 'Es la referencia para ascensos y descensos estables, y para anticipar la captura de altitud. La aguja se vuelve ámbar con valores excesivos.' },
    en: { title: 'Vertical speed (VSI)', what: 'The vertical scale to the right of the altitude tape with a green needle.',
          read: 'The scale is non-linear: 1, 2 and 6 (×1000 fpm). When vertical speed exceeds 200 fpm the digital value appears in hundreds.',
          why: 'It is the reference for stable climbs and descents and for anticipating altitude capture. The needle turns amber at excessive values.' }
  },

  // ---------- Heading ----------
  headingTape: {
    es: { title: 'Cinta de rumbo', what: 'La escala horizontal bajo la esfera que se mueve con el rumbo magnético.',
          read: 'La línea amarilla del centro es el rumbo actual. Las cifras (09 = 090°) crecen hacia la derecha.',
          why: 'Te da la orientación respecto al norte y es la base de los virajes: un viraje a 270 es girar hasta que 27 quede bajo la línea.' },
    en: { title: 'Heading tape', what: 'The horizontal scale under the sphere that moves with magnetic heading.',
          read: 'The yellow line at the centre is the current heading. Figures (09 = 090°) increase to the right.',
          why: 'It gives orientation relative to north and is the base of turns: turning to 270 means turning until 27 sits under the line.' }
  },
  trackDiamond: {
    es: { title: 'Rombo de derrota', what: 'El rombo verde sobre la cinta de rumbo.',
          read: 'Marca la dirección real sobre el suelo. Con viento, queda a un lado del rumbo; sin viento coincide con él.',
          why: 'La diferencia entre rumbo y derrota es la deriva por viento. En este entrenador no hay viento: ambos coinciden.' },
    en: { title: 'Track diamond', what: 'The green diamond on the heading tape.',
          read: 'It marks the actual direction over the ground. With wind it sits to one side of the heading; with no wind it coincides.',
          why: 'The difference between heading and track is wind drift. This trainer has no wind: both coincide.' }
  },
  hdgSelected: {
    es: { title: 'Rumbo seleccionado', what: 'El triángulo (o número) cian del rumbo fijado en el FCU.',
          read: 'Aparece cuando el FCU está en rumbo seleccionado (HDG). Si queda fuera de la escala, se muestra el número a un costado.',
          why: 'Es el objetivo lateral: el modo HDG gira por el lado más corto hasta que la línea amarilla coincide con el triángulo.' },
    en: { title: 'Selected heading', what: 'The cyan triangle (or number) of the heading set on the FCU.',
          read: 'It shows when the FCU is in selected heading (HDG). If it is off-scale, the number appears at the side.',
          why: 'It is the lateral target: the HDG mode turns the shortest way until the yellow line matches the triangle.' }
  },

  // ---------- FMA ----------
  fma: {
    es: { title: 'FMA — anunciador de modos', what: 'La franja superior con 5 columnas y 3 filas que dice qué está haciendo la automatización.',
          read: 'Fila 1 (verde): modo activo. Fila 2 (cian): modo armado. Fila 3: mensajes. Un recuadro blanco rodea durante 10 s un modo recién activado.',
          why: 'Si algo cambia, lo primero que debes hacer es leer el FMA en voz alta: la mayor parte de las sorpresas de automatización vienen de no haberlo hecho.' },
    en: { title: 'FMA — mode annunciator', what: 'The top strip with 5 columns and 3 rows telling what the automation is doing.',
          read: 'Row 1 (green): active mode. Row 2 (cyan): armed mode. Row 3: messages. A white box surrounds a newly active mode for 10 s.',
          why: 'When something changes, the first thing to do is read the FMA aloud: most automation surprises come from not doing so.' }
  },
  fmaAthr: {
    es: { title: 'FMA col. 1 — modo de empuje', what: 'La primera columna: cómo se gestiona el empuje.',
          read: 'SPEED/MACH: mantiene la velocidad. THR CLB/THR IDLE: empuje fijo (ascenso o ralentí) con la velocidad en cabeceo. MAN TOGA/FLX: palancas manuales.',
          why: 'Te dice quién controla la velocidad: el empuje o el cabeceo. Es clave para entender por qué el avión se comporta como lo hace.' },
    en: { title: 'FMA col. 1 — thrust mode', what: 'The first column: how thrust is managed.',
          read: 'SPEED/MACH: holds speed. THR CLB/THR IDLE: fixed thrust (climb or idle) with speed on pitch. MAN TOGA/FLX: manual levers.',
          why: 'It tells you who controls speed: thrust or pitch. It is key to understanding why the aircraft behaves as it does.' }
  },
  fmaVertical: {
    es: { title: 'FMA col. 2 — modo vertical', what: 'La segunda columna: el modo vertical activo (fila 1) y el armado (fila 2).',
          read: 'SRS, CLB, OP CLB, DES, OP DES, V/S, ALT*, ALT, G/S*, G/S. Un ALT cian debajo indica captura armada.',
          why: 'Define qué trayectoria vertical sigues: velocidad vertical, ascenso con empuje, captura de altitud o senda de planeo.' },
    en: { title: 'FMA col. 2 — vertical mode', what: 'The second column: the active vertical mode (row 1) and the armed one (row 2).',
          read: 'SRS, CLB, OP CLB, DES, OP DES, V/S, ALT*, ALT, G/S*, G/S. A cyan ALT below means altitude capture is armed.',
          why: 'It defines the vertical path you follow: vertical speed, thrust-based climb, altitude capture or glide slope.' }
  },
  fmaLateral: {
    es: { title: 'FMA col. 3 — modo lateral', what: 'La tercera columna: el modo lateral activo y el armado.',
          read: 'RWY, NAV, HDG, LOC* y LOC. Un LOC o NAV cian debajo significa que se capturará cuando se cumplan las condiciones.',
          why: 'Te dice si el avión sigue el plan, un rumbo seleccionado o el localizador del ILS.' },
    en: { title: 'FMA col. 3 — lateral mode', what: 'The third column: the active and armed lateral modes.',
          read: 'RWY, NAV, HDG, LOC* and LOC. A cyan LOC or NAV below means it will capture when conditions are met.',
          why: 'It tells you whether the aircraft follows the plan, a selected heading or the ILS localizer.' }
  },
  fmaApproach: {
    es: { title: 'FMA col. 4 — capacidad de aproximación', what: 'La cuarta columna: CAT 1 o CAT 3 DUAL, en blanco.',
          read: 'Solo aparece con APPR armado o activo. Indica hasta qué mínimos permite el sistema aproximar de forma automática.',
          why: 'Si la capacidad baja durante la aproximación, el sistema avisa de que ya no podrías aterrizar con los mismos mínimos.' },
    en: { title: 'FMA col. 4 — approach capability', what: 'The fourth column: CAT 1 or CAT 3 DUAL, in white.',
          read: 'It appears only with APPR armed or active. It indicates the minima the system can fly automatically.',
          why: 'If the capability drops during the approach, the system warns you that you could no longer land with the same minima.' }
  },
  fmaEngagement: {
    es: { title: 'FMA col. 5 — acoplamiento', what: 'La quinta columna: estado de AP, FD y A/THR.',
          read: 'AP1/AP2/AP1+2 si está conectado; “1 FD 2” si los directores están activos; A/THR en blanco si está activo y cian si solo armado.',
          why: 'Te dice cuánta automatización tienes: AP, solo FD o vuelo manual. Es lo primero que debes confirmar al tomar los mandos.' },
    en: { title: 'FMA col. 5 — engagement', what: 'The fifth column: status of AP, FD and A/THR.',
          read: 'AP1/AP2/AP1+2 when engaged; “1 FD 2” when the directors are on; A/THR white when active and cyan when only armed.',
          why: 'It tells you how much automation you have: AP, FD only or manual flight. It is the first thing to confirm when taking over.' }
  },

  // ---------- ILS / RA ----------
  locScale: {
    es: { title: 'Escala del localizador (LOC)', what: 'La escala horizontal con rombo magenta bajo la esfera.',
          read: 'El rombo muestra dónde está el eje de pista respecto a ti. Si está a la derecha, el eje está a tu derecha: debes virar a la derecha.',
          why: 'La escala llega a 2 puntos a cada lado; cada punto es una fracción de grado del haz. Rombo centrado = estás en el eje de la pista; la regla es “vuela hacia el rombo”.' },
    en: { title: 'Localizer scale (LOC)', what: 'The horizontal scale with a magenta diamond under the sphere.',
          read: 'The diamond shows where the runway centreline is relative to you. If it is to the right, the centreline is on your right: turn right.',
          why: 'The scale spans 2 dots each side; each dot is a fraction of a degree of beam. Diamond centred = on the runway centreline; the rule is “fly toward the diamond”.' }
  },
  gsScale: {
    es: { title: 'Escala de la senda de planeo (G/S)', what: 'La escala vertical con rombo magenta a la derecha de la esfera.',
          read: 'Si el rombo está arriba, la senda está sobre ti (vas bajo la senda); si está abajo, vas por encima. Se corrige subiendo o bajando V/S.',
          why: 'Mantiene un descenso de ≈ 3° hacia la pista. Un rombo centrado es una aproximación estable.' },
    en: { title: 'Glide slope scale (G/S)', what: 'The vertical scale with a magenta diamond to the right of the sphere.',
          read: 'If the diamond is high, the path is above you (you are low); if low, you are above the path. Correct by changing vertical speed.',
          why: 'It keeps a ≈ 3° descent to the runway. A centred diamond means a stable approach.' }
  },
  ilsInfo: {
    es: { title: 'Información ILS', what: 'El identificador y la frecuencia del ILS en la parte baja izquierda.',
          read: 'IMRC 109.30 identifica la estación y la frecuencia. Aparece cuando hay LS o APPR en uso.',
          why: 'Verifica que sintonizas el ILS correcto antes de confiar en las barras: el ident evita aproximarte al ILS equivocado.' },
    en: { title: 'ILS information', what: 'The ILS identifier and frequency at the bottom left.',
          read: 'IMRC 109.30 identifies the station and its frequency. It appears when LS or APPR is in use.',
          why: 'Verify the right ILS is tuned before trusting the deviation: the ident prevents flying the wrong approach.' }
  },
  radioAlt: {
    es: { title: 'Radioaltímetro', what: 'La cifra verde bajo el símbolo del avión con la altura real sobre el terreno.',
          read: 'Solo aparece bajo 2500 ft. Se vuelve ámbar bajo la altura de decisión. Se lee directamente en pies.',
          why: 'En la aproximación manda sobre la altitud barométrica: mide la altura real al suelo, sin depender del QNH.' },
    en: { title: 'Radio altimeter', what: 'The green figure under the aircraft symbol with the actual height above the ground.',
          read: 'It appears only below 2,500 ft. It turns amber below the decision height. It reads directly in feet.',
          why: 'On approach it overrides barometric altitude: it measures true height to the ground, regardless of the QNH.' }
  }
};

/** Every part id in the plan table. */
export const PART_IDS = Object.keys(PARTS);
