// E6B glossary. Each entry: id, aliases (`a`, matched in running text, first alias is the headline),
// name (`n`) and definition (`d`) in es/en. `glossHtml(text, lang)` escapes plain text, turns `code` spans
// into <code> and the first mention of every term into a tooltip button (same behaviour as the PFD trainer).

/** @typedef {{ id: string, a: string[], n: {es: string, en: string}, d: {es: string, en: string} }} Term */

/** @type {Term[]} */
export const GLOSSARY = [
  { id: 'e6b', a: ['E6B'], n: { es: 'E6B — Computador de vuelo', en: 'E6B — Flight computer' },
    d: { es: 'Computador de vuelo mecánico de dos caras: una regla de cálculo circular y una cara del viento. Se usa para tiempo, velocidad, distancia, combustible, TAS y triángulo del viento.',
         en: 'Two-sided mechanical flight computer: a circular slide rule and a wind face. Used for time, speed, distance, fuel, TAS and the wind triangle.' } },
  { id: 'cas', a: ['CAS'], n: { es: 'CAS — Velocidad calibrada', en: 'CAS — Calibrated airspeed' },
    d: { es: 'La IAS corregida por error de instalación del anemómetro. Es la entrada de la ventana de TAS.',
         en: 'IAS corrected for the airspeed indicator installation error. It is the input of the TAS window.' } },
  { id: 'ias', a: ['IAS'], n: { es: 'IAS — Velocidad indicada', en: 'IAS — Indicated airspeed' },
    d: { es: 'La velocidad que marca el anemómetro, sin corregir. En la práctica del E6B se confunde a menudo con la CAS.',
         en: 'The speed shown on the airspeed indicator, uncorrected. In E6B practice it is often treated as CAS.' } },
  { id: 'tas', a: ['TAS'], n: { es: 'TAS — Velocidad verdadera', en: 'TAS — True airspeed' },
    d: { es: 'La velocidad real del avión respecto al aire. Aumenta con la altitud y la temperatura para una misma CAS. Es la entrada del lado del viento.',
         en: 'The real speed of the aircraft through the air. It grows with altitude and temperature for the same CAS. It is the input of the wind side.' } },
  { id: 'gs', a: ['GS'], n: { es: 'GS — Velocidad respecto al suelo', en: 'GS — Ground speed' },
    d: { es: 'La velocidad real sobre el terreno: la TAS corregida por el viento. Con ella calculas el tiempo y el combustible.',
         en: 'The real speed over the ground: TAS corrected for wind. You use it for time and fuel.' } },
  { id: 'tc', a: ['TC', 'derrota verdadera', 'true course'], n: { es: 'TC — Derrota verdadera', en: 'TC — True course' },
    d: { es: 'El ángulo medido en la carta, respecto al norte verdadero, entre el origen y el destino. Es lo que quieres recorrer sobre el terreno.',
         en: 'The angle measured on the chart, from true north, between origin and destination. It is what you want to track over the ground.' } },
  { id: 'th', a: ['TH', 'rumbo verdadero', 'true heading'], n: { es: 'TH — Rumbo verdadero', en: 'TH — True heading' },
    d: { es: 'La dirección hacia donde apunta el morro respecto al norte verdadero. Es la TC corregida por el viento (TC + WCA).',
         en: 'The direction the nose points relative to true north. It is TC corrected for wind (TC + WCA).' } },
  { id: 'mc', a: ['MC', 'derrota magnética', 'magnetic course'], n: { es: 'MC — Derrota magnética', en: 'MC — Magnetic course' },
    d: { es: 'La derrota verdadera corregida por la variación: MC = TC − variación E (o + variación W).',
         en: 'True course corrected for variation: MC = TC − east variation (or + west variation).' } },
  { id: 'mh', a: ['MH', 'rumbo magnético', 'magnetic heading'], n: { es: 'MH — Rumbo magnético', en: 'MH — Magnetic heading' },
    d: { es: 'El rumbo verdadero corregido por la variación. Es el rumbo respecto al norte magnético.',
         en: 'True heading corrected for variation. It is the heading relative to magnetic north.' } },
  { id: 'ch', a: ['CH', 'rumbo de brújula', 'compass heading'], n: { es: 'CH — Rumbo de brújula', en: 'CH — Compass heading' },
    d: { es: 'El rumbo magnético corregido por el desvío de la brújula del avión: lo que realmente lees en la brújula.',
         en: 'Magnetic heading corrected for the aircraft compass deviation: what you actually read on the compass.' } },
  { id: 'wca', a: ['WCA', 'corrección de deriva', 'wind correction angle'], n: { es: 'WCA — Ángulo de corrección de viento', en: 'WCA — Wind correction angle' },
    d: { es: 'Los grados que debes apuntar a un lado de la derrota para compensar el viento. Positivo a la derecha: TH = TC + WCA.',
         en: 'The degrees you must point to one side of the course to offset the wind. Positive right: TH = TC + WCA.' } },
  { id: 'drift', a: ['deriva', 'drift'], n: { es: 'Deriva', en: 'Drift' },
    d: { es: 'El ángulo entre el rumbo del avión y su trayectoria real sobre el terreno, causado por el viento transversal.',
         en: 'The angle between the aircraft heading and its real path over the ground, caused by crosswind.' } },
  { id: 'oat', a: ['OAT'], n: { es: 'OAT — Temperatura exterior', en: 'OAT — Outside air temperature' },
    d: { es: 'La temperatura del aire fuera del avión en °C. Es la entrada de las ventanas de TAS y densidad.',
         en: 'The air temperature outside the aircraft in °C. It is the input of the TAS and density windows.' } },
  { id: 'pa', a: ['PA', 'altitud de presión', 'pressure altitude'], n: { es: 'PA — Altitud de presión', en: 'PA — Pressure altitude' },
    d: { es: 'La altitud que marca el altímetro con 1013 hPa (29,92 inHg) calado. Es la entrada de las ventanas de TAS y DA.',
         en: 'The altitude shown by the altimeter with 1013 hPa (29.92 inHg) set. It is the input of the TAS and DA windows.' } },
  { id: 'da', a: ['DA', 'altitud de densidad', 'density altitude'], n: { es: 'DA — Altitud de densidad', en: 'DA — Density altitude' },
    d: { es: 'La altitud de presión corregida por temperatura: la altitud ISA con la misma densidad del aire. Mide cómo “se siente” el aire de alto.',
         en: 'Pressure altitude corrected for temperature: the ISA altitude with the same air density. It measures how “high” the air feels.' } },
  { id: 'qnh', a: ['QNH'], n: { es: 'QNH', en: 'QNH' },
    d: { es: 'El ajuste del altímetro que hace que marque la elevación del aeródromo al aterrizar. Sirve para obtener la altitud de presión.',
         en: 'The altimeter setting that makes it read the aerodrome elevation on the ground. It is used to get pressure altitude.' } },
  { id: 'isa', a: ['ISA'], n: { es: 'ISA — Atmósfera estándar', en: 'ISA — International standard atmosphere' },
    d: { es: 'Atmósfera de referencia: 15 °C y 1013,25 hPa a nivel del mar, con 2 °C menos cada 1 000 ft.',
         en: 'Reference atmosphere: 15 °C and 1013.25 hPa at sea level, 2 °C lower every 1,000 ft.' } },
  { id: 'nm', a: ['NM', 'milla náutica', 'nautical mile'], n: { es: 'NM — Milla náutica', en: 'NM — Nautical mile' },
    d: { es: 'La unidad de distancia de la aviación: 1 852 m, igual a un minuto de arco de latitud.',
         en: 'The aviation distance unit: 1,852 m, equal to one minute of arc of latitude.' } },
  { id: 'sm', a: ['SM', 'milla terrestre', 'statute mile'], n: { es: 'SM — Milla terrestre', en: 'SM — Statute mile' },
    d: { es: 'La milla común de 1 609 m. 1 NM = 1,15 SM. Se usa en la visibilidad de EE. UU.',
         en: 'The common mile of 1,609 m. 1 NM = 1.15 SM. Used for US visibility.' } },
  { id: 'gph', a: ['GPH'], n: { es: 'GPH — Galones por hora', en: 'GPH — Gallons per hour' },
    d: { es: 'Unidad de caudal de combustible en galones US por hora.',
         en: 'Fuel flow unit in US gallons per hour.' } },
  { id: 'ete', a: ['ETE'], n: { es: 'ETE — Tiempo estimado en ruta', en: 'ETE — Estimated time en route' },
    d: { es: 'El tiempo que tardas en un tramo: distancia / velocidad respecto al suelo.',
         en: 'The time a leg takes: distance / ground speed.' } },
  { id: 'eta', a: ['ETA'], n: { es: 'ETA — Hora estimada de llegada', en: 'ETA — Estimated time of arrival' },
    d: { es: 'La hora a la que llegarás: salida más ETE.',
         en: 'The time you will arrive: departure plus ETE.' } },
  { id: 'fuelflow', a: ['caudal de combustible', 'fuel flow'], n: { es: 'Caudal de combustible', en: 'Fuel flow' },
    d: { es: 'El combustible que consume el motor por unidad de tiempo, normalmente galones por hora.',
         en: 'The fuel the engine burns per unit of time, normally gallons per hour.' } },
  { id: 'endurance', a: ['autonomía', 'endurance'], n: { es: 'Autonomía', en: 'Endurance' },
    d: { es: 'El tiempo que puedes volar con el combustible disponible: galones / caudal.',
         en: 'The time you can fly on the fuel available: gallons / flow.' } },
  { id: 'trueindex', a: ['TRUE INDEX'], n: { es: 'TRUE INDEX', en: 'TRUE INDEX' },
    d: { es: 'El índice ámbar en lo alto del marco del lado del viento. Lo que está bajo él es la dirección “hacia arriba” de la rosa.',
         en: 'The amber index at the top of the wind-side frame. What is under it is the “up” direction of the rose.' } },
  { id: 'grommet', a: ['ojal', 'grommet'], n: { es: 'Ojal', en: 'Grommet' },
    d: { es: 'El pequeño círculo central del disco azimutal. Representa al avión sobre el terreno.',
         en: 'The small centre circle of the azimuth disc. It stands for the aircraft over the ground.' } },
  { id: 'winddot', a: ['punto de viento', 'wind dot'], n: { es: 'Punto de viento', en: 'Wind dot' },
    d: { es: 'La marca de lápiz que representa el vector del viento (dirección y velocidad) sobre el disco azimutal.',
         en: 'The pencil mark representing the wind vector (direction and speed) on the azimuth disc.' } },
  { id: 'speedindex', a: ['índice de velocidad', 'speed index'], n: { es: 'Índice de velocidad (60)', en: 'Speed index (60)' },
    d: { es: 'El triángulo sobre el 60 de la escala interior. 60 minutos = una hora.',
         en: 'The triangle on the inner 60. 60 minutes = one hour.' } },
  { id: 'secondsindex', a: ['índice de segundos', 'seconds index'], n: { es: 'Índice de segundos (36)', en: 'Seconds index (36)' },
    d: { es: 'La marca sobre el 36 de la escala interior: 3 600 segundos = una hora.',
         en: 'The mark on the inner 36: 3,600 seconds = one hour.' } },
  { id: 'logscale', a: ['escala logarítmica', 'log scale'], n: { es: 'Escala logarítmica', en: 'Log scale' },
    d: { es: 'Escala donde la distancia entre números es proporcional al logaritmo. Multiplicar es sumar longitudes: la base de la regla de cálculo.',
         en: 'A scale where the distance between numbers is proportional to the logarithm. Multiplying is adding lengths: the basis of the slide rule.' } },
  { id: 'navlog', a: ['navlog', 'cuaderno de navegación'], n: { es: 'Navlog — Cuaderno de navegación', en: 'Navlog — Navigation log' },
    d: { es: 'La hoja donde apuntas cada tramo: TC, viento, TH, GS, ETE y combustible.',
         en: 'The sheet where you note each leg: TC, wind, TH, GS, ETE and fuel.' } },
  { id: 'crosswind', a: ['viento cruzado', 'crosswind'], n: { es: 'Viento cruzado', en: 'Crosswind' },
    d: { es: 'La componente del viento perpendicular a la derrota o la pista. Es la que causa la deriva.',
         en: 'The wind component perpendicular to the course or runway. It is what causes drift.' } },
  { id: 'headwind', a: ['viento de cara', 'headwind'], n: { es: 'Viento de cara', en: 'Headwind' },
    d: { es: 'La componente del viento contra el avance. Reduce la GS por debajo de la TAS.',
         en: 'The wind component against the direction of travel. It lowers GS below TAS.' } },
  { id: 'tailwind', a: ['viento de cola', 'tailwind'], n: { es: 'Viento de cola', en: 'Tailwind' },
    d: { es: 'La componente del viento a favor. Aumenta la GS por encima de la TAS.',
         en: 'The wind component along the direction of travel. It raises GS above TAS.' } },
  { id: 'variation', a: ['variación', 'variation'], n: { es: 'Variación magnética', en: 'Magnetic variation' },
    d: { es: 'La diferencia entre el norte verdadero y el magnético en un lugar. Se lee en las isógonas de la carta (E o W).',
         en: 'The difference between true and magnetic north at a place. Read from the chart isogonic lines (E or W).' } },
  { id: 'deviation', a: ['desvío', 'deviation'], n: { es: 'Desvío de brújula', en: 'Compass deviation' },
    d: { es: 'El error de la brújula causado por el propio avión. Viene en la tarjeta de desvíos junto a la brújula.',
         en: 'The compass error caused by the aircraft itself. It comes on the compass card next to the compass.' } },
  { id: 'kt', a: ['kt', 'nudo', 'knot'], n: { es: 'Nudo', en: 'Knot' },
    d: { es: 'Una milla náutica por hora. Es la unidad de velocidad de aviación.',
         en: 'One nautical mile per hour. It is the aviation speed unit.' } },
  { id: 'hoursring', a: ['anillo de horas', 'hours ring'], n: { es: 'Anillo de horas', en: 'Hours ring' },
    d: { es: 'La escala pequeña del E6B que muestra los minutos como h:mm.',
         en: 'The small E6B scale showing minutes as h:mm.' } }
];

const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const reEscape = (s) => s.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');

const ALIASES = GLOSSARY.flatMap((g) => g.a.map((a) => [a, g.id])).sort((x, y) => y[0].length - x[0].length);
const ALIAS_ID = new Map(ALIASES);
// No letter/digit before, no letter after: matches whole words only.
const TERM_RE = new RegExp(`(?<![\\p{L}\\p{N}])(${ALIASES.map(([a]) => reEscape(a)).join('|')})(?!\\p{L})`, 'gu');

export const TERM_BY_ID = new Map(GLOSSARY.map((g) => [g.id, g]));

/** Escapes text; `code` spans become <code>; first mention of each term becomes a tooltip button. */
export function glossHtml(text, lang) {
  void lang;
  const seen = new Set();
  return String(text).split('`').map((chunk, i) => {
    if (i % 2) return `<code>${esc(chunk)}</code>`;
    let out = '', last = 0;
    for (const m of chunk.matchAll(TERM_RE)) {
      const id = ALIAS_ID.get(m[1]);
      out += esc(chunk.slice(last, m.index));
      out += seen.has(id) ? esc(m[1]) : `<button type="button" class="term" data-term="${id}">${esc(m[1])}</button>`;
      seen.add(id);
      last = m.index + m[1].length;
    }
    return out + esc(chunk.slice(last));
  }).join('');
}
