// Explain-mode content: one entry per data-part id drawn on the E6B (see the part-id table in the plan).
// Each entry has es + en with { title, what, read, why }. Glossary terms are turned into tooltips at render time.

/** @typedef {{ title: string, what: string, read: string, why: string }} PartText */
/** @type {Record<string, {es: PartText, en: PartText}>} */
export const PARTS = {
  // ---------- Computer side ----------
  outerScale: {
    es: { title: 'Escala exterior', what: 'La escala logarítmica fija del borde, de 10 a 100. Una vuelta completa es una década: el mismo dibujo vale para 1,5, 15, 150 o 1 500.',
          read: 'Lee el número bajo la marca y coloca tú la coma decimal con una estimación mental. Entre 10 y 20 cada raya vale 0,1; entre 20 y 50, 0,5; de 50 a 100, 1.',
          why: 'Aquí aparecen las distancias, el combustible, la TAS y la respuesta de las multiplicaciones. Leerla bien (y poner bien la coma) es el 90 % del E6B.' },
    en: { title: 'Outer scale', what: 'The fixed logarithmic scale on the rim, from 10 to 100. One full turn is one decade: the same print serves for 1.5, 15, 150 or 1,500.',
          read: 'Read the number under the mark and place the decimal point yourself from a mental estimate. Between 10 and 20 each tick is 0.1; between 20 and 50, 0.5; from 50 to 100, 1.',
          why: 'Distances, fuel, true airspeed and the answer of multiplications live here. Reading it well (and placing the decimal point) is 90 % of the E6B.' }
  },
  innerScale: {
    es: { title: 'Escala interior (minutos)', what: 'La misma escala logarítmica, impresa en el disco giratorio. Se lee como minutos de tiempo (o como cualquier número que multipliques).',
          read: 'Gira el disco y mira qué número interior queda bajo un número exterior. La razón entre ambos se mantiene en toda la vuelta: eso es una proporción resuelta.',
          why: 'Al girar el disco conviertes cualquier regla de tres en un solo movimiento: ajustas un par conocido y lees el resto.' },
    en: { title: 'Inner scale (minutes)', what: 'The same logarithmic scale, printed on the rotating disc. It is read as minutes of time (or as any number you are multiplying).',
          read: 'Turn the disc and see which inner number sits under an outer number. The ratio between them is the same all around the disc: that is a solved proportion.',
          why: 'Turning the disc makes any rule of three a single move: set one known pair and read all the others.' }
  },
  hoursRing: {
    es: { title: 'Anillo de horas', what: 'Una escala pequeña bajo la escala interior que muestra el tiempo en horas y minutos: 60 = 1:00, 90 = 1:30, 120 = 2:00.',
          read: 'Para tiempos de más de una hora lee el anillo en vez de dividir en la cabeza: el número del anillo está justo bajo el de minutos.',
          why: 'Las respuestas de tiempo (ETE, autonomía) se dan en h:mm en el cuaderno de navegación. El anillo evita errores de conversión.' },
    en: { title: 'Hours ring', what: 'A small scale under the inner scale showing time as hours and minutes: 60 = 1:00, 90 = 1:30, 120 = 2:00.',
          read: 'For times longer than an hour read the ring instead of dividing in your head: the ring figure sits right under the minutes figure.',
          why: 'Time answers (ETE, endurance) are written as h:mm on the navlog. The ring avoids conversion slips.' }
  },
  index10: {
    es: { title: 'Índice 10', what: 'La marca de 10 en ambas escalas (arriba del todo con el disco a cero). Es la referencia de multiplicar y dividir.',
          read: 'Para multiplicar A × B pon el índice 10 interior bajo A y lee la respuesta sobre B interior. Para dividir, al revés.',
          why: 'Con él el E6B es una regla de cálculo completa: sirve para cualquier operación, no solo para navegación.' },
    en: { title: '10 index', what: 'The 10 mark on both scales (right at the top with the disc at zero). It is the reference for multiplying and dividing.',
          read: 'To multiply A × B put the inner 10 index under A and read the answer over inner B. To divide, do it the other way round.',
          why: 'With it the E6B is a complete slide rule: it handles any operation, not just navigation.' }
  },
  speedIndex: {
    es: { title: 'Índice de velocidad (60)', what: 'El triángulo grande sobre el 60 de la escala interior: 60 minutos, una hora.',
          read: 'Pon el 60 bajo la velocidad (en kt) y todo lo demás sale solo: sobre los minutos lees la distancia recorrida en ese tiempo.',
          why: 'Con él, cualquier problema de tiempo–velocidad–distancia es: ajusto una vez y leo. También da el consumo por hora.' },
    en: { title: 'Speed index (60)', what: 'The big triangle on the inner 60: 60 minutes, one hour.',
          read: 'Put the 60 under the speed (in kt) and everything else follows: over any minutes figure you read the distance flown in that time.',
          why: 'With it any time–speed–distance problem is: set once and read. It also gives the hourly fuel rate.' }
  },
  secondsIndex: {
    es: { title: 'Índice de segundos (36)', what: 'Una marca sobre el 36 de la escala interior: 36 equivale a 3 600 segundos, una hora.',
          read: 'Pon el 36 bajo la velocidad y lee sobre la distancia los segundos que tardas en recorrerla (multiplica por 10 mentalmente si hace falta).',
          why: 'Sirve para tiempos cortos: p. ej. los segundos que tardas en cubrir 2,5 NM, o cronometrar tramos de aproximación.' },
    en: { title: 'Seconds index (36)', what: 'A mark on the inner 36: 36 stands for 3,600 seconds, one hour.',
          read: 'Put the 36 under the speed and read the seconds you need to fly a distance over that distance (multiply by 10 in your head if needed).',
          why: 'It is for short times: e.g. the seconds to cover 2.5 NM, or timing approach legs.' }
  },
  convNaut: {
    es: { title: 'Flechas NAUT / STAT / KM', what: 'Tres flechas de la escala exterior para convertir distancias: millas náuticas (66), millas terrestres (76) y kilómetros (12,2).',
          read: 'Pon el valor en el disco interior bajo una flecha y lee la escala interior bajo la otra. Es una proporción: NAUT → STAT convierte NM en SM.',
          why: 'Las cartas usan NM, los límites de visibilidad y algunas pistas, SM, y los mapas europeos, km. Las flechas evitan memorizar 1,15 y 1,852.' },
    en: { title: 'NAUT / STAT / KM arrows', what: 'Three outer-scale arrows to convert distances: nautical miles (66), statute miles (76) and kilometres (12.2).',
          read: 'Put the value on the inner disc under one arrow and read the inner scale under the other. It is a proportion: NAUT → STAT turns NM into SM.',
          why: 'Charts use NM, visibility limits and some runways use SM, and European maps use km. The arrows save you memorising 1.15 and 1.852.' }
  },
  convFuel: {
    es: { title: 'Flechas U.S. GAL / LITERS / FUEL LBS', what: 'Tres flechas para el combustible: galones US (11,67), litros (44,17) y libras de gasolina de aviación (70, a 6 lb/gal).',
          read: 'Igual que las de distancia: el valor bajo una flecha, el resultado en la escala interior bajo la otra. La flecha de libras supone 6 lb por galón.',
          why: 'Cargas en litros, el manual da galones y el peso y centrado se calculan en libras. Equivocarte aquí es un error de seguridad.' },
    en: { title: 'U.S. GAL / LITERS / FUEL LBS arrows', what: 'Three arrows for fuel: US gallons (11.67), litres (44.17) and pounds of aviation gasoline (70, at 6 lb/gal).',
          read: 'Like the distance ones: the value under one arrow, the result on the inner scale under the other. The pounds arrow assumes 6 lb per gallon.',
          why: 'You are refuelled in litres, the manual gives gallons and weight and balance uses pounds. A slip here is a safety error.' }
  },
  convLength: {
    es: { title: 'Flechas METERS / FEET', what: 'Dos flechas para convertir longitudes cortas: metros (15,24) y pies (50).',
          read: 'Pon los pies bajo FEET y lee los metros bajo METERS, o al revés. Solo cambia el orden de magnitud: pon tú la coma.',
          why: 'Elevaciones y alturas están en pies en la carta de EE. UU., pero los techos de nubes y las pistas en muchos países van en metros.' },
    en: { title: 'METERS / FEET arrows', what: 'Two arrows to convert short lengths: metres (15.24) and feet (50).',
          read: 'Put feet under FEET and read metres under METERS, or the other way round. Only the order of magnitude changes: place the point yourself.',
          why: 'Elevations and heights are in feet on US charts, but cloud ceilings and runways are in metres in many countries.' }
  },
  tasWindow: {
    es: { title: 'Ventana de TAS', what: 'Una ventana con la altitud de presión (PA) impresa en el disco y la escala de temperatura (OAT, °C) de la base.',
          read: 'Gira el disco hasta que la PA quede sobre la temperatura exterior. Después, la TAS (escala exterior) está sobre la CAS (escala interior).',
          why: 'Al subir o hacer calor el aire es menos denso y la TAS es mayor que la CAS. Sin este paso, el tiempo y el viento salen mal.' },
    en: { title: 'TAS window', what: 'A window with pressure altitude (PA) printed on the disc and the base temperature scale (OAT, °C).',
          read: 'Turn the disc until PA sits over the outside air temperature. After that, TAS (outer scale) is over CAS (inner scale).',
          why: 'Higher or hotter, the air is thinner and TAS is greater than CAS. Skip this step and your time and wind come out wrong.' }
  },
  daWindow: {
    es: { title: 'Ventana de altitud de densidad', what: 'Una escala de altitud de densidad (DA) en el disco que se lee frente a un índice fijo de la base.',
          read: 'Con la PA y la temperatura ya puestas en la ventana de TAS, lee la DA bajo el índice. No hay que mover nada más.',
          why: 'La DA dice cómo se comporta el avión: con DA alta la hélice y el motor rinden menos, el despegue es más largo y el ascenso, más lento.' },
    en: { title: 'Density altitude window', what: 'A density altitude (DA) scale on the disc, read against a fixed index on the base.',
          read: 'With PA and temperature already set in the TAS window, read DA under the index. Nothing else needs moving.',
          why: 'DA tells how the aircraft will behave: with high DA the propeller and engine give less, the take-off is longer and the climb slower.' }
  },
  tempStrip: {
    es: { title: 'Tira de temperatura', what: 'Una escala lineal fija con grados Celsius y Fahrenheit, una frente a la otra.',
          read: 'Busca el valor en una escala y lee el equivalente en la otra, justo enfrente. No necesita girar nada.',
          why: 'Los METAR usan °C pero muchos manuales y termómetros, °F. La tira ahorra la fórmula °F = °C × 9/5 + 32.' },
    en: { title: 'Temperature strip', what: 'A fixed linear scale with Celsius and Fahrenheit degrees facing each other.',
          read: 'Find the value on one scale and read the equivalent on the other, right opposite. Nothing needs turning.',
          why: 'METARs use °C but many manuals and thermometers use °F. The strip saves the formula °F = °C × 9/5 + 32.' }
  },
  cursor: {
    es: { title: 'Cursor (línea de lectura)', what: 'Una línea fina que puedes mover para alinear lecturas entre escalas. Es una ayuda de este simulador: el E6B real de aluminio no la tiene.',
          read: 'Arrástrala hasta un número de la escala exterior y mira qué número del disco interior queda bajo la línea. Junto con la lupa, ayuda a leer valores finos.',
          why: 'Las escalas logarítmicas son finas y cuesta ver cuál es la raya exacta, sobre todo en un móvil. El cursor es solo un apoyo de aprendizaje.' },
    en: { title: 'Cursor (hairline)', what: 'A thin line you can move to align readings across scales. It is an aid of this simulator: a real aluminium E6B has none.',
          read: 'Drag it to a number on the outer scale and see which inner-disc number sits under the line. Together with the magnifier it helps with fine readings.',
          why: 'Log scales are fine and it is hard to see the exact tick, especially on a phone. The cursor is only a learning aid.' }
  },

  // ---------- Wind side ----------
  trueIndex: {
    es: { title: 'TRUE INDEX (índice de rumbo)', what: 'El triángulo ámbar de la parte superior del marco. Es donde pones la dirección que quieres en la parte alta de la rosa.',
          read: 'Gira el disco azimutal hasta que el valor que quieres (derrota o dirección del viento) quede bajo el índice, en la parte superior.',
          why: 'Es la referencia de todo el lado del viento: lo que está bajo el índice es “hacia donde vas” en el dibujo.' },
    en: { title: 'TRUE INDEX', what: 'The amber triangle at the top of the frame. It is where you put the direction you want at the top of the rose.',
          read: 'Turn the azimuth disc until the value you want (course or wind direction) sits under the index at the top.',
          why: 'It is the reference of the whole wind side: what is under the index is “where you are heading” in the picture.' }
  },
  driftScale: {
    es: { title: 'Escala de deriva', what: 'La escala junto al índice, a ambos lados del centro (L / R), que marca el ángulo de deriva (o corrección de viento) hasta 45°.',
          read: 'Lee donde cruza la línea de deriva que pasa por el punto de viento: a la derecha del centro (R) significa que el viento te empuja a la izquierda y debes corregir a la derecha.',
          why: 'La corrección de deriva (WCA) es lo que sumas a la derrota para obtener el rumbo verdadero. Es la respuesta de “¿a dónde apunto?”.' },
    en: { title: 'Drift scale', what: 'The scale next to the index, on both sides of the centre (L / R), showing the drift angle (or wind correction) up to 45°.',
          read: 'Read where the drift line through the wind dot meets it: right of centre (R) means the wind pushes you left and you must correct right.',
          why: 'The wind correction angle (WCA) is what you add to the course to get the true heading. It is the answer to “where do I point?”.' }
  },
  azimuth: {
    es: { title: 'Disco azimutal', what: 'El disco transparente giratorio con la rosa de 0 a 359°, centrado en el ojal. Se lee frente al TRUE INDEX.',
          read: 'Girarlo cambia la dirección “hacia arriba”. Los puntos que marques con el lápiz giran con él, porque están dibujados en el disco.',
          why: 'Es lo que convierte direcciones en geometría: al girar a la derrota, el viento queda con su ángulo real respecto al avión.' },
    en: { title: 'Azimuth disc', what: 'The transparent rotating disc with the 0–359° rose, centred on the grommet. It is read against the TRUE INDEX.',
          read: 'Turning it changes which direction is “up”. Pencil dots you mark turn with it, because they are drawn on the disc.',
          why: 'It turns directions into geometry: rotated to the course, the wind has its true angle relative to the aircraft.' }
  },
  grommet: {
    es: { title: 'Ojal central', what: 'El pequeño círculo metálico en el centro del disco azimutal. Representa el avión sobre el terreno.',
          read: 'La velocidad bajo el ojal es la lectura de la tarjeta deslizante. Al final del problema es la velocidad respecto al suelo (GS).',
          why: 'Todas las distancias del viento (el punto) se miden desde el ojal. Si no lo controlas, el punto de viento sale mal.' },
    en: { title: 'Grommet', what: 'The small metal circle at the centre of the azimuth disc. It stands for the aircraft over the ground.',
          read: 'The speed under the grommet is the slide-card reading. At the end of the problem it is the ground speed (GS).',
          why: 'All wind distances (the dot) are measured from the grommet. Lose track of it and the wind dot comes out wrong.' }
  },
  slideCard: {
    es: { title: 'Tarjeta deslizante', what: 'La rejilla que se mueve arriba y abajo detrás del disco. Lleva los arcos de velocidad y las líneas de deriva.',
          read: 'La velocidad que queda bajo el ojal es la lectura. Desliza la tarjeta para llevar el punto sobre el arco de la TAS.',
          why: 'Deslizar la tarjeta es el paso que resuelve el triángulo: al mover el origen cambias a la vez GS y deriva.' },
    en: { title: 'Slide card', what: 'The grid that moves up and down behind the disc. It carries the speed arcs and the drift lines.',
          read: 'The speed that ends up under the grommet is the reading. Slide the card to bring the dot onto the TAS arc.',
          why: 'Sliding the card is the step that solves the triangle: moving the origin changes GS and drift at once.' }
  },
  speedArcs: {
    es: { title: 'Arcos de velocidad', what: 'Las curvas concéntricas de la tarjeta, de 30 a 270 kt (una raya cada 2 kt, cifras cada 10). Su centro está en el origen de la tarjeta, debajo.',
          read: 'El arco sobre el que cae el punto de viento da la velocidad aerodinámica (TAS) de ese arco. La velocidad bajo el ojal es la de suelo.',
          why: 'Cada arco es una circunferencia de radio TAS: en ella el avión puede apuntar en cualquier dirección. El punto debe caer en la del TAS.' },
    en: { title: 'Speed arcs', what: 'The concentric curves of the card, from 30 to 270 kt (one tick every 2 kt, figures every 10). Their centre is the card origin, below.',
          read: 'The arc the wind dot lands on gives the airspeed (TAS) of that arc. The speed under the grommet is the ground speed.',
          why: 'Each arc is a circle of radius TAS: along it the aircraft can point in any direction. The dot must land on the TAS one.' }
  },
  driftLines: {
    es: { title: 'Líneas de deriva', what: 'Las rectas que parten del origen de la tarjeta como abanico, una cada grado hasta ±45° (cifras cada 5°).',
          read: 'La línea de deriva que pasa por el punto indica el ángulo de corrección, que se confirma en la escala de deriva del marco.',
          why: 'Convierten la posición del punto en ángulo: izquierda o derecha de la línea central, y cuántos grados.' },
    en: { title: 'Drift lines', what: 'The straight lines fanning out from the card origin, one per degree up to ±45° (figures every 5°).',
          read: 'The drift line through the dot gives the correction angle, confirmed on the frame drift scale.',
          why: 'They turn the dot position into an angle: left or right of the centre line, and how many degrees.' }
  },
  windDot: {
    es: { title: 'Punto de viento', what: 'La marca de lápiz que representa el viento: se pone sobre la dirección del viento, a una distancia del ojal igual a su velocidad.',
          read: 'Con el disco puesto en la dirección del viento, pon el ojal sobre un arco y marca el punto por encima del ojal tantos nudos como viento. Luego gira.',
          why: 'Es el método “viento arriba”: una vez marcado, el viento queda dibujado en el disco y gira junto a la derrota, sin más cuentas.' },
    en: { title: 'Wind dot', what: 'The pencil mark that stands for the wind: it is put on the wind direction, at a distance from the grommet equal to its speed.',
          read: 'With the disc set to the wind direction, put the grommet on an arc and mark the dot above the grommet by as many knots as the wind. Then rotate.',
          why: 'This is the “wind up” method: once marked, the wind is drawn on the disc and turns with the course, with no further arithmetic.' }
  }
};
