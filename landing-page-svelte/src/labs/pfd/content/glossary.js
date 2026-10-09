// PFD glossary. Each entry: id, aliases (`a`, matched in running text, first alias is the headline),
// name (`n`) and definition (`d`) in es/en. `glossHtml(text, lang)` escapes plain text, turns `code` spans
// into <code> and the first mention of every term into a tooltip button (same behaviour as the MCDU trainer).

/** @typedef {{ id: string, a: string[], n: {es: string, en: string}, d: {es: string, en: string} }} Term */

/** @type {Term[]} */
export const GLOSSARY = [
  { id: 'pfd', a: ['PFD'], n: { es: 'Primary Flight Display', en: 'Primary Flight Display' },
    d: { es: 'La pantalla principal de vuelo: actitud, velocidad, altitud, rumbo, velocidad vertical y modos del piloto automático en un solo lugar.',
         en: 'The main flight display: attitude, speed, altitude, heading, vertical speed and the autoflight modes in one place.' } },
  { id: 'fma', a: ['FMA'], n: { es: 'Flight Mode Annunciator', en: 'Flight Mode Annunciator' },
    d: { es: 'Franja superior del PFD con 5 columnas que dice qué hacen el A/THR, el piloto automático y el director de vuelo (modos activos en verde, armados en cian).',
         en: 'The top strip of the PFD, 5 columns telling what the A/THR, autopilot and flight director are doing (active modes green, armed modes cyan).' } },
  { id: 'fcu', a: ['FCU'], n: { es: 'Flight Control Unit', en: 'Flight Control Unit' },
    d: { es: 'Panel sobre el parabrisas donde el piloto selecciona velocidad, rumbo, altitud y velocidad vertical, y conecta AP, A/THR, LOC y APPR.',
         en: 'The panel under the glareshield where the pilot sets speed, heading, altitude and vertical speed and engages AP, A/THR, LOC and APPR.' } },
  { id: 'ap', a: ['AP', 'AP1', 'AP2'], n: { es: 'AP — Piloto automático', en: 'AP — Autopilot' },
    d: { es: 'Sistema que mueve los mandos por ti para seguir los modos del FMA. El A320 tiene AP1 y AP2; al ser desconectado suena una alarma.',
         en: 'The system that moves the controls for you to follow the FMA modes. The A320 has AP1 and AP2; a disconnect sounds an aural warning.' } },
  { id: 'athr', a: ['A/THR', 'ATHR'], n: { es: 'A/THR — Autothrust', en: 'A/THR — Autothrust' },
    d: { es: 'Gestiona el empuje: mantiene una velocidad (SPEED/MACH) o un empuje fijo (THR CLB, THR IDLE). Se muestra en blanco cuando está activo y en cian cuando está solo armado.',
         en: 'Manages thrust: holds a speed (SPEED/MACH) or a fixed thrust (THR CLB, THR IDLE). Shown white when active and cyan when only armed.' } },
  { id: 'fd', a: ['FD', 'director de vuelo', 'flight director'], n: { es: 'FD — Director de vuelo', en: 'FD — Flight Director' },
    d: { es: 'Barras verdes sobre el horizonte que indican hacia dónde llevar el avión para seguir los modos del FMA. Con AP desconectado, tú las sigues con el sidestick.',
         en: 'Green bars over the horizon showing where to fly to follow the FMA modes. With the AP off, you follow them with the sidestick.' } },
  { id: 'ias', a: ['IAS'], n: { es: 'IAS — Velocidad indicada', en: 'IAS — Indicated airspeed' },
    d: { es: 'Velocidad que lee el avión a partir de la presión dinámica. Es la que importa para sustentación, pérdida y límites estructurales; la cinta izquierda muestra IAS.',
         en: 'Speed the aircraft derives from dynamic pressure. It drives lift, stall and structural limits; the left tape shows IAS.' } },
  { id: 'mach', a: ['Mach'], n: { es: 'Número de Mach', en: 'Mach number' },
    d: { es: 'Velocidad respecto al sonido. El PFD lo muestra bajo la cinta desde M .50; en crucero alto se vuela por Mach, no por IAS.',
         en: 'Speed relative to the speed of sound. The PFD shows it under the tape from M .50; at high cruise you fly Mach, not IAS.' } },
  { id: 'vls', a: ['VLS'], n: { es: 'VLS — Velocidad mínima seleccionable', en: 'VLS — Lowest Selectable Speed' },
    d: { es: 'Franja ámbar bajo la velocidad: el mínimo con margen sobre la pérdida (del orden de 1,13 a 1,23 veces VS1g según la configuración). El A/THR y el AP no bajarán de ahí.',
         en: 'Amber strip under the speed: the minimum with a margin over the stall (roughly 1.13 to 1.23 times VS1g depending on configuration). A/THR and AP will not go below it.' } },
  { id: 'vaprot', a: ['Vα prot', 'Valpha prot', 'α prot'], n: { es: 'Vα prot — Inicio de protección de alfa', en: 'Vα prot — Alpha protection speed' },
    d: { es: 'Inicio de la banda ámbar y negra. Por debajo, el avión limita el ángulo de ataque: el sidestick manda alfa y el AP se desconecta.',
         en: 'Top of the amber-and-black band. Below it the aircraft limits angle of attack: the sidestick commands alpha and the AP disconnects.' } },
  { id: 'vamax', a: ['Vα max', 'Valpha max', 'Vαmax'], n: { es: 'Vα max — Alfa máximo', en: 'Vα max — Maximum alpha' },
    d: { es: 'Franja roja inferior: el máximo ángulo de ataque que el avión permite. Con el sidestick atrás a tope se llega aquí, sin entrar en pérdida.',
         en: 'Red strip at the bottom: the maximum angle of attack the aircraft allows. Full back stick gets you here, without stalling.' } },
  { id: 'vmax', a: ['VMAX'], n: { es: 'VMAX — Velocidad máxima operativa', en: 'VMAX — Maximum operating speed' },
    d: { es: 'Banda roja y negra arriba. Es el menor de VMO/MMO, VFE (flaps) y VLE (tren) para la configuración actual. Se mueve cuando cambias flaps.',
         en: 'Red-and-black band at the top. The lowest of VMO/MMO, VFE (flaps) and VLE (gear) for the current configuration. It moves when you change flaps.' } },
  { id: 'vmo', a: ['VMO'], n: { es: 'VMO — Velocidad máxima operativa', en: 'VMO — Maximum operating speed' },
    d: { es: 'Límite de IAS en configuración limpia: 350 kt en el A320.', en: 'IAS limit in clean configuration: 350 kt on the A320.' } },
  { id: 'mmo', a: ['MMO'], n: { es: 'MMO — Mach máximo operativo', en: 'MMO — Maximum operating Mach' },
    d: { es: 'Límite de Mach en altura: M .82 en el A320. A gran altitud manda sobre VMO.', en: 'Mach limit at altitude: M .82 on the A320. At high altitude it governs instead of VMO.' } },
  { id: 'vfe', a: ['VFE'], n: { es: 'VFE — Velocidad máxima con flaps', en: 'VFE — Maximum flap extended speed' },
    d: { es: 'Velocidad máxima con una configuración de flaps/slats dada. Excederla puede dañar las superficies hipersustentadoras.',
         en: 'Maximum speed with a given flap/slat setting. Exceeding it can damage the high-lift devices.' } },
  { id: 'greendot', a: ['green dot', 'punto verde'], n: { es: 'Green dot — Punto verde', en: 'Green dot' },
    d: { es: 'Velocidad de mejor relación sustentación/resistencia en configuración limpia. Es una referencia de espera y de motor fuera. Solo aparece sin flaps.',
         en: 'Speed for best lift-to-drag ratio in clean configuration. A reference for holding and engine-out. Shown only with flaps up.' } },
  { id: 'sspeed', a: ['velocidad S', 'S speed'], n: { es: 'Velocidad S', en: 'S speed' },
    d: { es: 'Letra S en la cinta: velocidad mínima para retraer los slats (pasar de CONF 1 a limpio).',
         en: 'The letter S on the tape: minimum speed to retract the slats (from CONF 1 to clean).' } },
  { id: 'fspeed', a: ['velocidad F', 'F speed'], n: { es: 'Velocidad F', en: 'F speed' },
    d: { es: 'Letra F en la cinta: velocidad mínima para retraer los flaps al siguiente paso (por ejemplo de CONF 2 a CONF 1).',
         en: 'The letter F on the tape: minimum speed to retract flaps to the next step (for example CONF 2 to CONF 1).' } },
  { id: 'v1', a: ['V1', 'VR', 'V2'], n: { es: 'V1 / VR / V2', en: 'V1 / VR / V2' },
    d: { es: 'V1: decisión de despegue (después ya no se aborta). VR: rotación. V2: velocidad de ascenso seguro con un motor inoperativo. El PFD marca V1 con un 1 cian en la cinta.',
         en: 'V1: takeoff decision speed (no abort past it). VR: rotation. V2: safe climb speed with one engine out. The PFD marks V1 with a cyan 1 on the tape.' } },
  { id: 'trend', a: ['flecha de tendencia', 'trend arrow'], n: { es: 'Flecha de tendencia', en: 'Trend arrow' },
    d: { es: 'Flecha amarilla que parte de la referencia de velocidad: su punta es la velocidad que tendrás en 10 s si no cambias nada. Aparece con aceleración notable.',
         en: 'Yellow arrow from the speed reference: its tip is the speed you will have in 10 s if nothing changes. Shown with noticeable acceleration.' } },
  { id: 'aoa', a: ['AoA', 'ángulo de ataque', 'angle of attack'], n: { es: 'AoA — Ángulo de ataque', en: 'AoA — Angle of attack' },
    d: { es: 'Ángulo entre el ala y el viento relativo. Pitch = trayectoria + AoA: a menos velocidad, más AoA para sostener el avión.',
         en: 'Angle between the wing and the relative wind. Pitch = flight path + AoA: the slower you fly, the more AoA you need.' } },
  { id: 'fpa', a: ['FPA'], n: { es: 'FPA — Ángulo de trayectoria', en: 'FPA — Flight path angle' },
    d: { es: 'Inclinación de la trayectoria respecto al horizonte (no del morro). Con 0° vuelas nivelado aunque el morro esté arriba.',
         en: 'Inclination of the flight path relative to the horizon (not of the nose). At 0° you are level even with the nose raised.' } },
  { id: 'fpv', a: ['FPV'], n: { es: 'FPV — Vector de trayectoria', en: 'FPV — Flight path vector' },
    d: { es: 'El “pajarito” verde que marca hacia dónde vas realmente. En el A320 real aparece al seleccionar el modo TRK FPA; en este entrenador no se dibuja.',
         en: 'The green “bird” showing where you are really going. On the real A320 it appears when TRK FPA is selected; it is not drawn in this trainer.' } },
  { id: 'pitch', a: ['Pitch', 'Cabeceo'], n: { es: 'Pitch — Cabeceo', en: 'Pitch' },
    d: { es: 'Ángulo del morro sobre el horizonte, medido por la escala de la esfera de actitud.', en: 'Angle of the nose above the horizon, read on the attitude sphere ladder.' } },
  { id: 'bank', a: ['Bank', 'Alabeo'], n: { es: 'Bank — Alabeo', en: 'Bank' },
    d: { es: 'Inclinación lateral del avión. La escala superior de la esfera marca 10, 20, 30 y 45° y el índice se desplaza con el alabeo.',
         en: 'Sideways tilt of the aircraft. The scale at the top of the sphere marks 10, 20, 30 and 45° and the index moves with bank.' } },
  { id: 'bankprot', a: ['bank angle protection', 'protección de alabeo'], n: { es: 'Protección de alabeo', en: 'Bank angle protection' },
    d: { es: 'En ley normal el avión no deja pasar de 67° de alabeo y, por encima de 33°, vuelve a 33° si sueltas el sidestick.',
         en: 'In normal law the aircraft will not exceed 67° of bank and, above 33°, rolls back to 33° when you release the stick.' } },
  { id: 'normallaw', a: ['ley normal', 'normal law'], n: { es: 'Ley normal', en: 'Normal law' },
    d: { es: 'Modo de mandos de vuelo en el que el ordenador mantiene la trayectoria y aplica las protecciones (alfa, alabeo, cabeceo, factor de carga, velocidad alta).',
         en: 'The flight-control mode in which the computers hold the flight path and apply the protections (alpha, bank, pitch, load factor, high speed).' } },
  { id: 'sidestick', a: ['sidestick'], n: { es: 'Sidestick', en: 'Sidestick' },
    d: { es: 'Mando lateral del A320. Pide un régimen de alabeo y un cambio de trayectoria; neutro mantiene lo que tienes.',
         en: 'The A320 side controller. It commands a roll rate and a flight path change; neutral holds what you have.' } },
  { id: 'hdg', a: ['HDG'], n: { es: 'HDG — Rumbo', en: 'HDG — Heading' },
    d: { es: 'Rumbo magnético hacia donde apunta el morro. El modo HDG del FMA sigue el rumbo seleccionado en el FCU (cian).',
         en: 'Magnetic heading the nose points to. The HDG mode on the FMA follows the heading selected on the FCU (cyan).' } },
  { id: 'trk', a: ['Track', 'TRK', 'Derrota'], n: { es: 'Derrota (track)', en: 'Track' },
    d: { es: 'Dirección real sobre el suelo. El rombo verde sobre la cinta de rumbo la marca; con viento difiere del rumbo.',
         en: 'Actual direction over the ground. The green diamond on the heading tape marks it; with wind it differs from heading.' } },
  { id: 'vs', a: ['V/S'], n: { es: 'V/S — Velocidad vertical', en: 'V/S — Vertical speed' },
    d: { es: 'Pies por minuto que subes o bajas. El modo V/S del FMA la mantiene al valor del FCU; la aguja verde de la derecha la muestra.',
         en: 'Feet per minute you climb or descend. The FMA V/S mode holds the value set on the FCU; the green needle on the right shows it.' } },
  { id: 'fl', a: ['FL'], n: { es: 'FL — Nivel de vuelo', en: 'FL — Flight level' },
    d: { es: 'Altitud en cientos de pies con el altímetro en 1013 hPa (STD). FL100 = 10 000 ft.', en: 'Altitude in hundreds of feet with the altimeter at 1013 hPa (STD). FL100 = 10,000 ft.' } },
  { id: 'qnh', a: ['QNH'], n: { es: 'QNH', en: 'QNH' },
    d: { es: 'Ajuste de presión que hace que el altímetro indique la altitud sobre el nivel del mar. Se usa por debajo de la altitud de transición.',
         en: 'Pressure setting that makes the altimeter read altitude above sea level. Used below the transition altitude.' } },
  { id: 'std', a: ['STD'], n: { es: 'STD — Ajuste estándar', en: 'STD — Standard setting' },
    d: { es: 'Altímetro en 1013 hPa. Se usa por encima de la altitud de transición y la cinta muestra niveles de vuelo.',
         en: 'Altimeter at 1013 hPa. Used above the transition altitude, and the tape shows flight levels.' } },
  { id: 'ra', a: ['RA', 'radioaltímetro', 'radio altimeter'], n: { es: 'RA — Radioaltímetro', en: 'RA — Radio altimeter' },
    d: { es: 'Altura real sobre el terreno, solo por debajo de 2500 ft. Es verde y se vuelve ámbar bajo la altura de decisión.',
         en: 'Actual height above the ground, only below 2,500 ft. Green, turning amber below the decision height.' } },
  { id: 'dh', a: ['DH', 'MDA'], n: { es: 'DH / MDA', en: 'DH / MDA' },
    d: { es: 'Altura de decisión (DH, con RA) o altitud mínima de descenso (MDA, con altímetro) para una aproximación: si no tienes referencias visuales, motor y al aire.',
         en: 'Decision height (DH, by RA) or minimum descent altitude (MDA, by altimeter) for an approach: without visual references, go around.' } },
  { id: 'toga', a: ['TOGA'], n: { es: 'TOGA — Take-off / Go-around', en: 'TOGA — Take-off / Go-around' },
    d: { es: 'Posición de las palancas con el máximo empuje de despegue o de motor y al aire.', en: 'Thrust lever position for maximum take-off or go-around thrust.' } },
  { id: 'flx', a: ['FLX', 'MCT'], n: { es: 'FLX / MCT', en: 'FLX / MCT' },
    d: { es: 'FLX: empuje de despegue reducido usando una temperatura asumida. MCT: empuje máximo continuo; es la misma muesca de las palancas.',
         en: 'FLX: reduced take-off thrust using an assumed temperature. MCT: maximum continuous thrust; same lever detent.' } },
  { id: 'srs', a: ['SRS'], n: { es: 'SRS — Speed Reference System', en: 'SRS — Speed Reference System' },
    d: { es: 'Modo vertical de despegue y motor y al aire: ajusta el cabeceo para mantener V2 + 10 (o la velocidad actual si es mayor) en ascenso inicial.',
         en: 'Take-off and go-around vertical mode: pitches to hold V2 + 10 (or current speed if higher) in the initial climb.' } },
  { id: 'opclb', a: ['OP CLB'], n: { es: 'OP CLB — Ascenso abierto', en: 'OP CLB — Open climb' },
    d: { es: 'Ascenso con empuje de ascenso (THR CLB) y la velocidad del FCU controlada con cabeceo, ignorando restricciones de altitud, hasta la altitud del FCU.',
         en: 'Climb at climb thrust (THR CLB) with the FCU speed controlled by pitch, ignoring altitude constraints, up to the FCU altitude.' } },
  { id: 'clb', a: ['CLB', 'DES'], n: { es: 'CLB / DES', en: 'CLB / DES' },
    d: { es: 'Modos gestionados de ascenso y descenso que siguen el plan de vuelo y sus restricciones. Sus versiones abiertas son OP CLB y OP DES.',
         en: 'Managed climb and descent modes following the flight plan and its constraints. Their open versions are OP CLB and OP DES.' } },
  { id: 'altstar', a: ['ALT*', 'ALT'], n: { es: 'ALT* / ALT — Captura y mantenimiento', en: 'ALT* / ALT — Capture and hold' },
    d: { es: 'ALT* es la captura (transición suave hacia la altitud del FCU); cuando se estabiliza pasa a ALT, que la mantiene.',
         en: 'ALT* is the capture (smooth transition to the FCU altitude); once stable it becomes ALT, which holds it.' } },
  { id: 'nav', a: ['NAV'], n: { es: 'NAV — Navegación gestionada', en: 'NAV — Managed navigation' },
    d: { es: 'Modo lateral que sigue el plan de vuelo del FMGC. En este entrenador sigue un rumbo ficticio fijo.',
         en: 'Lateral mode following the FMGC flight plan. In this trainer it follows a fixed fictional heading.' } },
  { id: 'ils', a: ['ILS'], n: { es: 'ILS — Sistema de aterrizaje por instrumentos', en: 'ILS — Instrument Landing System' },
    d: { es: 'Ayuda de precisión con dos haces: localizador (lateral) y senda de planeo (vertical). Su ident y frecuencia aparecen abajo a la izquierda.',
         en: 'Precision aid with two beams: localizer (lateral) and glide slope (vertical). Its ident and frequency show bottom-left.' } },
  { id: 'loc', a: ['LOC', 'LOC*'], n: { es: 'LOC — Localizador', en: 'LOC — Localizer' },
    d: { es: 'Haz lateral del ILS. LOC* es la captura y LOC el seguimiento del eje de pista. En el PFD, el rombo magenta bajo la esfera muestra la desviación.',
         en: 'Lateral beam of the ILS. LOC* is the capture and LOC the tracking. On the PFD the magenta diamond under the sphere shows deviation.' } },
  { id: 'gs', a: ['G/S', 'G/S*'], n: { es: 'G/S — Senda de planeo', en: 'G/S — Glide slope' },
    d: { es: 'Haz vertical del ILS (≈ 3°). G/S* captura y G/S sigue. El rombo magenta a la derecha de la esfera muestra si estás por encima o debajo.',
         en: 'Vertical beam of the ILS (≈ 3°). G/S* captures and G/S tracks. The magenta diamond right of the sphere shows above or below.' } },
  { id: 'cat', a: ['CAT 1', 'CAT 3 DUAL', 'CAT 3 SINGLE'], n: { es: 'CAT 1 / CAT 3', en: 'CAT 1 / CAT 3' },
    d: { es: 'Capacidad de aproximación del sistema, mostrada en la columna 4 del FMA. CAT 3 DUAL: aterrizaje automático con redundancia doble.',
         en: 'Approach capability of the system, shown in FMA column 4. CAT 3 DUAL: automatic landing with dual redundancy.' } },
  { id: 'managed', a: ['gestionado', 'managed'], n: { es: 'Gestionado', en: 'Managed' },
    d: { es: 'El avión sigue el objetivo del FMGC (plan de vuelo). Se activa empujando la perilla del FCU; las ventanas muestran guiones y los objetivos son magenta.',
         en: 'The aircraft follows the FMGC target (flight plan). Engaged by pushing the FCU knob; windows show dashes and targets are magenta.' } },
  { id: 'selected', a: ['seleccionado', 'selected'], n: { es: 'Seleccionado', en: 'Selected' },
    d: { es: 'El avión sigue el valor que fijas tú en el FCU. Se activa tirando de la perilla; los objetivos se dibujan en cian.',
         en: 'The aircraft follows the value you set on the FCU. Engaged by pulling the knob; targets are drawn cyan.' } },
  { id: 'barber', a: ['barber pole'], n: { es: 'Barber pole', en: 'Barber pole' },
    d: { es: 'Banda de rayas oblicuas (ámbar/negro o rojo/negro) en los bordes de la cinta de velocidad: zona que no debes entrar.',
         en: 'Band of diagonal stripes (amber/black or red/black) at the speed tape edges: a zone you should not enter.' } }
];

const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const reEscape = (s) => s.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');

const ALIASES = GLOSSARY.flatMap((g) => g.a.map((a) => [a, g.id])).sort((x, y) => y[0].length - x[0].length);
const ALIAS_ID = new Map(ALIASES);
// No letter/digit before, no letter after: FL100 and AP1 still match, FLEX does not match FL.
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
