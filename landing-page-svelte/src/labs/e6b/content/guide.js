// Guía tab content: colour legend + procedures as collapsible sections (like the PFD trainer).
// Text is plain; `code` spans become <code> and glossary terms become tooltips (see glossHtml).

/** Colour legend. `c` is the CSS variable of the drawing colour, `sample` a short example. */
export const LEGEND = [
  { c: '--amber', sample: '60', es: 'Ámbar: los índices (índice de velocidad 60, índice de segundos 36, TRUE INDEX). Son el punto de partida de cada procedimiento.', en: 'Amber: the indices (speed index 60, seconds index 36, TRUE INDEX). They are the starting point of every procedure.' },
  { c: '--cyan', sample: 'NAUT', es: 'Cian: las flechas de conversión (NAUT, STAT, KM, U.S. GAL, LITERS, FUEL LBS, METERS, FEET).', en: 'Cyan: the conversion arrows (NAUT, STAT, KM, U.S. GAL, LITERS, FUEL LBS, METERS, FEET).' },
  { c: '--amber', sample: '●', es: 'Puntos ámbar: las marcas de lápiz del lado del viento (el punto de viento). Giran con el disco.', en: 'Amber dots: the pencil marks on the wind side (the wind dot). They turn with the disc.' },
  { c: '--fg', sample: '25', es: 'Blanco: lo impreso, es decir, las escalas, las cifras y las rosas.', en: 'White: the print, i.e. the scales, figures and rose.' },
  { c: '--green', sample: '|', es: 'Verde: el cursor (línea de lectura) y las lecturas que estás comprobando. Es una ayuda del simulador.', en: 'Green: the cursor (hairline) and the readings you are checking. It is a simulator aid.' }
];

/** @typedef {{ p?: string, ul?: string[] }} Block */
/** @typedef {{ id: string, open?: boolean, title: string, blocks: Block[] }} Section */

/** @type {{ es: Section[], en: Section[] }} */
export const GUIDE = {
  es: [
    { id: 'faces', open: true, title: 'Las dos caras del E6B',
      blocks: [
        { p: 'El E6B tiene dos caras que se usan para cosas distintas. Con el botón “Voltear” cambias de una a otra. Activa “? Modo explicar” y toca cualquier parte para ver qué es, cómo se lee y por qué importa.' },
        { ul: [
          'Cara de cálculo: una regla de cálculo circular. Escala exterior fija, escala interior en el disco giratorio, índices, flechas de conversión y las ventanas de TAS y de altitud de densidad.',
          'Cara del viento: un marco con el TRUE INDEX, un disco azimutal transparente con la rosa, el ojal central y una tarjeta deslizante con arcos de velocidad y líneas de deriva.',
          'Cálculo: tiempo, velocidad, distancia, combustible, conversiones, TAS y altitud de densidad.',
          'Viento: rumbo verdadero a volar y velocidad respecto al suelo (o el viento que estás sufriendo).'
        ] },
        { p: 'El simulador añade un cursor y una lupa para leer mejor. El E6B real no los tiene: úsalos para aprender y luego prueba sin ellos.' }
      ] },
    { id: 'logscale', title: 'Leer una escala logarítmica y poner la coma',
      blocks: [
        { p: 'La escala va de 10 a 100 y da una sola vuelta. Una vuelta completa es una década, así que el mismo punto sirve para 1,5 / 15 / 150. El E6B no coloca la coma decimal: la pones tú.' },
        { ul: [
          'Lee primero las cifras: la marca que ves bajo el índice. Entre 10 y 20 cada raya vale 0,1; entre 20 y 50, 0,5; entre 50 y 100, 1.',
          'Estima la respuesta antes de mover nada: 120 kt × 25 min es “un poco menos de 2 NM por minuto, durante 25 min”, o sea 50 NM, no 5 ni 500.',
          'Compara el resultado con la estimación. Si coincide en cifras (50) y ordenes de magnitud, está bien.',
          'Las rayas se juntan al subir: a la derecha de la escala cuesta más leer. Usa el cursor y la lupa.'
        ] },
        { p: 'Regla de oro: el E6B da las cifras; tu cabeza da el orden de magnitud.' }
      ] },
    { id: 'tsd', title: 'Tiempo, velocidad y distancia (índice 60)',
      blocks: [
        { p: 'Es el problema más frecuente. Todo se resuelve con el índice de velocidad, el triángulo sobre el 60 de la escala interior: 60 minutos = 1 hora.' },
        { ul: [
          'Pon el 60 interior bajo la velocidad (kt) en la escala exterior.',
          'Distancia en un tiempo: busca los minutos en la escala interior y lee la distancia sobre ellos. 120 kt, 25 min: 50 NM.',
          'Tiempo para una distancia: busca la distancia en la escala exterior y lee los minutos bajo ella. 75 NM a 150 kt: 30 min.',
          'Velocidad: pon la distancia sobre sus minutos y lee la velocidad sobre el 60. 42 NM en 18 min: 140 kt.',
          'Para más de una hora, lee el anillo de horas: 90 min = 1:30.'
        ] }
      ] },
    { id: 'seconds', title: 'Tiempos cortos: índice de segundos (36)',
      blocks: [
        { p: 'El 36 de la escala interior representa 3 600 segundos, una hora. Funciona igual que el índice de velocidad, pero lees segundos en vez de minutos.' },
        { ul: [
          'Pon el 36 bajo la velocidad (kt).',
          'Busca la distancia en la escala exterior y lee los segundos bajo ella. Mueve la coma como en cualquier lectura.',
          'Ejemplo: 2,5 NM a 90 kt son 100 segundos; sale “10” y lo multiplicas por 10.'
        ] },
        { p: 'Útil para cronometrar tramos de aproximación, como el tiempo entre el FAF y el MAP.' }
      ] },
    { id: 'fuel', title: 'Combustible: consumo, autonomía y caudal',
      blocks: [
        { p: 'Es otra proporción con el índice 60: ahora la escala exterior no son millas, sino galones, y la interior sigue siendo el tiempo.' },
        { ul: [
          'Consumo en un tiempo: pon el 60 bajo el caudal (GPH) y lee los galones sobre los minutos. 9,5 GPH durante 2:30 son 23,75 gal.',
          'Autonomía: pon el 60 bajo el caudal y lee los minutos bajo los galones disponibles. 38 gal a 8 GPH son 285 min (4:45).',
          'Caudal: pon los galones sobre su tiempo y lee el caudal por hora sobre el 60. 13 gal en 1:20 son 9,75 GPH.',
          'Siempre añade la reserva legal: la autonomía del E6B es hasta el depósito vacío.'
        ] }
      ] },
    { id: 'conv', title: 'Conversiones con las flechas',
      blocks: [
        { p: 'Las flechas cian de la escala exterior (NAUT, STAT, KM, U.S. GAL, LITERS, FUEL LBS, METERS, FEET) están puestas para que una conversión sea una proporción de una sola posición.' },
        { ul: [
          'Pon el valor que tienes en la escala interior bajo la flecha de “su” unidad.',
          'Lee la escala interior bajo la flecha de la unidad a la que quieres llegar.',
          'Ejemplo: 85 NM bajo NAUT; bajo STAT, 98 SM. Pon tú la coma.',
          'Para °C / °F usa la tira de temperatura: no hay que girar el disco.'
        ] },
        { p: 'Estas flechas están colocadas por razón en este simulador: en un E6B real su posición exacta varía según el fabricante.' }
      ] },
    { id: 'tas', title: 'TAS y altitud de densidad',
      blocks: [
        { p: 'La velocidad que indica el anemómetro (CAS) es menor que la real en el aire (TAS) cuando subes o hace calor, porque el aire es menos denso. La ventana de TAS hace esa corrección.' },
        { ul: [
          'En la ventana de TAS, gira el disco hasta que la altitud de presión (PA) quede sobre la temperatura exterior (OAT, °C).',
          'La TAS está en la escala exterior sobre la CAS de la escala interior. Con PA 6 000 y −5 °C, la CAS 120 da una TAS de unos 129 kt.',
          'Sin mover el disco, lee la altitud de densidad en la ventana DA, junto al índice fijo.',
          'La DA alta empeora el rendimiento: despegue más largo, ascenso más lento, hélice y motor con menos aire.'
        ] },
        { p: 'La altitud de presión se obtiene calando 1013 hPa (o 29,92 inHg) en el altímetro, o corrigiendo la elevación por la diferencia de QNH.' }
      ] },
    { id: 'wind', title: 'El triángulo del viento: el método del punto',
      blocks: [
        { p: 'Cuando hay viento, el avión no va hacia donde apunta. El lado del viento resuelve el triángulo: dados la derrota (TC), la TAS y el viento, da el rumbo (TH) y la velocidad respecto al suelo (GS).' },
        { ul: [
          '1. Pon la dirección del viento bajo el TRUE INDEX.',
          '2. Lleva el ojal a cualquier arco cómodo (p. ej. 100 kt).',
          '3. Marca el punto de viento: encima del ojal, tantos nudos como la velocidad del viento.',
          '4. Gira el disco hasta poner la derrota (TC) bajo el TRUE INDEX.',
          '5. Desliza la tarjeta hasta que el punto caiga sobre el arco de la TAS.',
          '6. Lee la GS bajo el ojal, y la deriva con las líneas de deriva (o la escala de deriva).',
          '7. Si el punto queda a la derecha del centro, corrige a la derecha: TH = TC + WCA. Si queda a la izquierda, resta.'
        ] },
        { p: 'Ejemplo: TC 135, TAS 110, viento 210/25: WCA 13° a la derecha, TH 148°, GS 101 kt.' }
      ] },
    { id: 'findwind', title: 'Calcular un viento desconocido',
      blocks: [
        { p: 'Es el problema inverso: sabes por dónde ibas (TC), a dónde apuntabas (TH), la TAS y la GS medida. Te falta el viento.' },
        { ul: [
          'Pon la derrota (TC) bajo el TRUE INDEX y el ojal sobre la GS.',
          'Calcula la deriva: WCA = TH − TC. Con TC 090 y TH 097, es 7° a la derecha.',
          'Marca un punto donde la línea de deriva de 7° corta el arco de la TAS.',
          'Gira el disco hasta que el punto quede en la línea central, encima del ojal; la dirección de viento está bajo el TRUE INDEX.',
          'La velocidad del viento es la distancia del punto al ojal, medida en la escala del arco.'
        ] },
        { p: 'Ejemplo: TC 090, TH 097, TAS 120, GS 108: viento de unos 143° y 18 kt.' }
      ] },
    { id: 'mistakes', title: 'Errores frecuentes',
      blocks: [
        { ul: [
          'Colocar mal la coma decimal: 5 NM, 50 NM y 500 NM usan la misma lectura. Estima antes.',
          'Leer minutos como decimales de hora: 1,5 h son 1:30, no 1:50.',
          'Usar CAS o IAS en vez de TAS en el lado del viento.',
          'Confundir de dónde viene el viento con hacia dónde va. En el E6B pones de dónde viene.',
          'Corregir la deriva al lado equivocado: el viento por la derecha te empuja a la izquierda, así que apuntas a la derecha.',
          'Olvidar la reserva en problemas de combustible, o el número de motores.',
          'Mezclar unidades: NM con SM, litros con galones, kt con km/h.',
          'Deslizar la tarjeta sin comprobar que el punto cae justo sobre el arco de la TAS.'
        ] }
      ] }
  ],
  en: [
    { id: 'faces', open: true, title: 'The two faces of the E6B',
      blocks: [
        { p: 'The E6B has two faces used for different things. The “Flip” button switches between them. Turn on “? Explain mode” and tap any part to see what it is, how to read it and why it matters.' },
        { ul: [
          'Computer face: a circular slide rule. Fixed outer scale, inner scale on the rotating disc, indices, conversion arrows and the TAS and density altitude windows.',
          'Wind face: a frame with the TRUE INDEX, a transparent azimuth disc with the rose, the central grommet and a sliding card with speed arcs and drift lines.',
          'Computer: time, speed, distance, fuel, conversions, TAS and density altitude.',
          'Wind: the true heading to fly and the ground speed (or the wind you are suffering).'
        ] },
        { p: 'The simulator adds a cursor and a magnifier for easier reading. A real E6B has neither: use them to learn, then try without.' }
      ] },
    { id: 'logscale', title: 'Reading a log scale and placing the decimal point',
      blocks: [
        { p: 'The scale runs from 10 to 100 and makes a single turn. One full turn is one decade, so the same spot serves for 1.5 / 15 / 150. The E6B does not place the decimal point: you do.' },
        { ul: [
          'Read the digits first: the mark you see under the index. Between 10 and 20 each tick is 0.1; between 20 and 50, 0.5; between 50 and 100, 1.',
          'Estimate the answer before moving anything: 120 kt × 25 min is “a bit under 2 NM per minute, for 25 min”, i.e. 50 NM, not 5 or 500.',
          'Compare the result to your estimate. If the digits (50) and the order of magnitude agree, it is right.',
          'Ticks bunch together towards the right end: it is harder to read there. Use the cursor and the magnifier.'
        ] },
        { p: 'Golden rule: the E6B gives the digits; your head gives the order of magnitude.' }
      ] },
    { id: 'tsd', title: 'Time, speed and distance (the 60 index)',
      blocks: [
        { p: 'The most frequent problem. Everything is solved with the speed index, the triangle on the inner 60: 60 minutes = 1 hour.' },
        { ul: [
          'Put the inner 60 under the speed (kt) on the outer scale.',
          'Distance in a time: find the minutes on the inner scale and read the distance over them. 120 kt, 25 min: 50 NM.',
          'Time for a distance: find the distance on the outer scale and read the minutes under it. 75 NM at 150 kt: 30 min.',
          'Speed: put the distance over its minutes and read the speed over the 60. 42 NM in 18 min: 140 kt.',
          'For more than an hour read the hours ring: 90 min = 1:30.'
        ] }
      ] },
    { id: 'seconds', title: 'Short times: the seconds index (36)',
      blocks: [
        { p: 'The inner 36 stands for 3,600 seconds, one hour. It works like the speed index, but you read seconds instead of minutes.' },
        { ul: [
          'Put the 36 under the speed (kt).',
          'Find the distance on the outer scale and read the seconds under it. Move the decimal point as with any reading.',
          'Example: 2.5 NM at 90 kt is 100 seconds; you read “10” and multiply by 10.'
        ] },
        { p: 'Handy for timing approach legs, such as the time from the FAF to the MAP.' }
      ] },
    { id: 'fuel', title: 'Fuel: burn, endurance and rate',
      blocks: [
        { p: 'It is another proportion with the 60 index: now the outer scale is gallons rather than miles, and the inner scale is still time.' },
        { ul: [
          'Burn in a time: put the 60 under the flow (GPH) and read gallons over the minutes. 9.5 GPH for 2:30 is 23.75 gal.',
          'Endurance: put the 60 under the flow and read the minutes under the gallons available. 38 gal at 8 GPH is 285 min (4:45).',
          'Rate: put the gallons over their time and read the hourly flow over the 60. 13 gal in 1:20 is 9.75 GPH.',
          'Always add the legal reserve: the E6B endurance is until the tanks are empty.'
        ] }
      ] },
    { id: 'conv', title: 'Conversions with the arrows',
      blocks: [
        { p: 'The cyan arrows on the outer scale (NAUT, STAT, KM, U.S. GAL, LITERS, FUEL LBS, METERS, FEET) are placed so that a conversion is a proportion in a single position.' },
        { ul: [
          'Put the value you have on the inner scale under the arrow of “its” unit.',
          'Read the inner scale under the arrow of the unit you want.',
          'Example: 85 NM under NAUT; under STAT, 98 SM. Place the point yourself.',
          'For °C / °F use the temperature strip: no need to turn the disc.'
        ] },
        { p: 'In this simulator the arrows are placed by ratio: on a real E6B their exact position varies by manufacturer.' }
      ] },
    { id: 'tas', title: 'TAS and density altitude',
      blocks: [
        { p: 'The speed on the airspeed indicator (CAS) is lower than the real speed through the air (TAS) when you are high or hot, because the air is thinner. The TAS window makes that correction.' },
        { ul: [
          'In the TAS window, turn the disc until pressure altitude (PA) sits over the outside air temperature (OAT, °C).',
          'TAS is on the outer scale over the CAS on the inner scale. With PA 6,000 and −5 °C, CAS 120 gives a TAS of about 129 kt.',
          'Without moving the disc, read density altitude in the DA window, next to the fixed index.',
          'High DA hurts performance: longer take-off, slower climb, engine and propeller with less air.'
        ] },
        { p: 'Pressure altitude comes from setting 1013 hPa (or 29.92 inHg) on the altimeter, or from correcting the elevation for the QNH difference.' }
      ] },
    { id: 'wind', title: 'The wind triangle: the wind-dot method',
      blocks: [
        { p: 'With wind the aircraft does not go where it points. The wind side solves the triangle: given the course (TC), TAS and wind, it gives the heading (TH) and ground speed (GS).' },
        { ul: [
          '1. Put the wind direction under the TRUE INDEX.',
          '2. Put the grommet on any convenient arc (e.g. 100 kt).',
          '3. Mark the wind dot: above the grommet, as many knots as the wind speed.',
          '4. Rotate the disc to put the course (TC) under the TRUE INDEX.',
          '5. Slide the card until the dot falls on the TAS arc.',
          '6. Read GS under the grommet, and the drift with the drift lines (or the drift scale).',
          '7. If the dot is right of centre, correct right: TH = TC + WCA. If it is left, subtract.'
        ] },
        { p: 'Example: TC 135, TAS 110, wind 210/25: WCA 13° right, TH 148°, GS 101 kt.' }
      ] },
    { id: 'findwind', title: 'Finding an unknown wind',
      blocks: [
        { p: 'The inverse problem: you know where you were going (TC), where you pointed (TH), the TAS and the measured GS. You miss the wind.' },
        { ul: [
          'Put the course (TC) under the TRUE INDEX and the grommet on the GS.',
          'Work out the drift: WCA = TH − TC. With TC 090 and TH 097 it is 7° right.',
          'Mark a dot where the 7° drift line crosses the TAS arc.',
          'Rotate the disc until the dot is on the centre line, above the grommet; the wind direction is under the TRUE INDEX.',
          'Wind speed is the distance from the dot to the grommet, measured on the arc scale.'
        ] },
        { p: 'Example: TC 090, TH 097, TAS 120, GS 108: wind about 143° at 18 kt.' }
      ] },
    { id: 'mistakes', title: 'Common mistakes',
      blocks: [
        { ul: [
          'Misplacing the decimal point: 5 NM, 50 NM and 500 NM use the same reading. Estimate first.',
          'Reading minutes as decimals of an hour: 1.5 h is 1:30, not 1:50.',
          'Using CAS or IAS instead of TAS on the wind side.',
          'Mixing up where the wind comes from and where it goes. On the E6B you set where it comes from.',
          'Correcting drift to the wrong side: wind from the right pushes you left, so you point right.',
          'Forgetting the reserve in fuel problems, or the number of engines.',
          'Mixing units: NM with SM, litres with gallons, kt with km/h.',
          'Sliding the card without checking that the dot lands exactly on the TAS arc.'
        ] }
      ] }
  ]
};
