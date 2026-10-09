// G1000 glossary. Each entry: id, aliases (`a`, matched in running text, first alias is the headline),
// name (`n`) and definition (`d`) in es/en. `glossHtml(text, lang)` escapes plain text, turns `code` spans
// into <code> and the first mention of every term into a tooltip button (same behaviour as the other trainers).

/** @typedef {{ id: string, a: string[], n: {es: string, en: string}, d: {es: string, en: string} }} Term */
const T = (id, a, nes, nen, des, den) => ({ id, a, n: { es: nes, en: nen }, d: { es: des, en: den } });

/** @type {Term[]} */
export const GLOSSARY = [
  T('pfd', ['PFD'], 'PFD — Pantalla primaria de vuelo', 'PFD — Primary flight display', 'La pantalla izquierda: actitud, velocidad, altitud, HSI, radios y transponder.', 'The left display: attitude, airspeed, altitude, HSI, radios and transponder.'),
  T('mfd', ['MFD'], 'MFD — Pantalla multifunción', 'MFD — Multi-function display', 'La pantalla derecha: mapa, páginas de datos, plan de vuelo y motor (EIS).', 'The right display: map, data pages, flight plan and engine (EIS).'),
  T('lru', ['LRU'], 'LRU — Unidad reemplazable en línea', 'LRU — Line-replaceable unit', 'Cada caja del G1000 que se cambia entera en mantenimiento.', 'Each G1000 box that is swapped whole in maintenance.'),
  T('ahrs', ['AHRS'], 'AHRS — Referencia de actitud y rumbo', 'AHRS — Attitude and heading reference system', 'Giróscopos y acelerómetros de estado sólido que dan actitud y rumbo.', 'Solid-state gyros and accelerometers that give attitude and heading.'),
  T('adc', ['ADC'], 'ADC — Computadora de datos de aire', 'ADC — Air data computer', 'Convierte pitot, estática y temperatura en velocidad, altitud y VSI.', 'Turns pitot, static and temperature into airspeed, altitude and VSI.'),
  T('eis', ['EIS'], 'EIS — Indicación de motor', 'EIS — Engine indication system', 'Franja del MFD con los indicadores de motor y sistemas.', 'MFD strip with engine and systems gauges.'),
  T('waas', ['WAAS'], 'WAAS — Sistema de aumentación de área amplia', 'WAAS — Wide area augmentation system', 'SBAS de EE. UU.: correcciones de GPS por satélite que permiten aproximaciones LPV.', 'US SBAS: satellite-broadcast GPS corrections that allow LPV approaches.'),
  T('sbas', ['SBAS'], 'SBAS — Aumentación basada en satélites', 'SBAS — Satellite-based augmentation', 'Nombre genérico de WAAS, EGNOS, MSAS…', 'Generic name for WAAS, EGNOS, MSAS…'),
  T('lpv', ['LPV'], 'LPV — Prestación de localizador con guía vertical', 'LPV — Localizer performance with vertical guidance', 'Aproximación GPS con WAAS y guía vertical parecida a un ILS.', 'GPS approach with WAAS and ILS-like vertical guidance.'),
  T('lnav', ['LNAV'], 'LNAV — Navegación lateral', 'LNAV — Lateral navigation', 'Aproximación GPS solo con guía lateral.', 'GPS approach with lateral guidance only.'),
  T('vnav', ['VNAV'], 'VNAV — Navegación vertical', 'VNAV — Vertical navigation', 'Perfil de descenso calculado hacia altitudes de los waypoints.', 'Computed descent profile toward waypoint altitudes.'),
  T('raim', ['RAIM'], 'RAIM — Monitoreo autónomo de integridad', 'RAIM — Receiver autonomous integrity monitoring', 'El receptor detecta un satélite erróneo comparando redundancias.', 'The receiver detects a faulty satellite by cross-checking redundancy.'),
  T('hsi', ['HSI'], 'HSI — Indicador de situación horizontal', 'HSI — Horizontal situation indicator', 'Rosa de rumbos con CDI integrado.', 'Compass rose with an integrated CDI.'),
  T('cdi', ['CDI'], 'CDI — Indicador de desviación de curso', 'CDI — Course deviation indicator', 'La aguja que muestra cuán lejos estás del curso.', 'The needle showing how far you are from the course.'),
  T('obs', ['OBS'], 'OBS — Selector de curso', 'OBS — Omni bearing selector', 'En GPS: elegir el curso hacia un waypoint y suspender la secuencia.', 'With GPS: pick the course to a waypoint and suspend sequencing.'),
  T('dtk', ['DTK'], 'DTK — Derrota deseada', 'DTK — Desired track', 'El rumbo sobre el suelo del tramo activo.', 'The ground track of the active leg.'),
  T('xtk', ['XTK'], 'XTK — Desviación lateral', 'XTK — Cross-track error', 'Distancia perpendicular al curso, en NM.', 'Perpendicular distance from the course, in NM.'),
  T('vor', ['VOR'], 'VOR — Radiofaro omnidireccional VHF', 'VOR — VHF omnidirectional range', 'Estación en tierra que define radiales; 108.00–117.95 MHz.', 'Ground station defining radials; 108.00–117.95 MHz.'),
  T('radial', ['radial'], 'Radial', 'Radial', 'Rumbo magnético DESDE un VOR.', 'Magnetic bearing FROM a VOR.'),
  T('dto', ['Direct-To', 'D→'], 'Direct-To (D→)', 'Direct-To (D→)', 'Navegar en línea recta desde tu posición a un punto.', 'Navigate in a straight line from your position to a point.'),
  T('fpl', ['FPL', 'plan de vuelo', 'flight plan'], 'FPL — Plan de vuelo', 'FPL — Flight plan', 'La lista de puntos que el GPS secuencia.', 'The list of waypoints the GPS sequences.'),
  T('fms', ['FMS'], 'Knob FMS', 'FMS knob', 'Knob doble de cada pantalla para páginas, cursor y escritura.', 'Dual knob on each display for pages, cursor and data entry.'),
  T('softkey', ['softkey', 'softkeys'], 'Softkey', 'Softkey', 'Tecla bajo la pantalla cuya función cambia según la etiqueta.', 'Key under the screen whose function follows its label.'),
  T('nrst', ['NRST'], 'NRST — Más cercanos', 'NRST — Nearest', 'Lista de aeródromos más cercanos a tu posición.', 'List of the airports nearest your position.'),
  T('xpdr', ['XPDR', 'transponder'], 'Transponder (XPDR)', 'Transponder (XPDR)', 'Responde al radar con tu código y, en ALT, tu altitud.', 'Replies to radar with your code and, in ALT, your altitude.'),
  T('ident', ['IDENT'], 'IDENT', 'IDENT', 'Hace destacar tu blanco en la pantalla del controlador.', 'Makes your target stand out on the controller’s screen.'),
  T('qnh', ['QNH'], 'QNH — Ajuste altimétrico', 'QNH — Altimeter setting', 'Presión que hace que el altímetro marque altitud sobre el nivel del mar.', 'Pressure that makes the altimeter read altitude above sea level.'),
  T('ias', ['IAS'], 'IAS — Velocidad indicada', 'IAS — Indicated airspeed', 'La velocidad que lee el ADC del pitot.', 'The airspeed the ADC reads from the pitot.'),
  T('tas', ['TAS'], 'TAS — Velocidad verdadera', 'TAS — True airspeed', 'La velocidad real respecto al aire.', 'The real speed through the air.'),
  T('gs', ['GS'], 'GS — Velocidad respecto al suelo', 'GS — Ground speed', 'TAS corregida por el viento.', 'TAS corrected for wind.'),
  T('vsi', ['VSI'], 'VSI — Velocidad vertical', 'VSI — Vertical speed indicator', 'Régimen de ascenso o descenso en ft/min.', 'Climb or descent rate in ft/min.'),
  T('vne', ['VNE'], 'VNE — Velocidad a no exceder', 'VNE — Never-exceed speed', 'Línea roja de la cinta de velocidad.', 'Red line of the airspeed tape.'),
  T('reversionary', ['reversionario', 'reversionary'], 'Modo reversionario', 'Reversionary mode', 'Si una pantalla falla, la otra muestra PFD + EIS.', 'If one display fails, the other shows PFD + EIS.'),
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
