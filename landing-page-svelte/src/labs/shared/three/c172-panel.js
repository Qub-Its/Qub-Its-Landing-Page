// Procedural C172 NAV III instrument panel for the G1000 course cockpit scene: two GDU 1040 bezels with knobs, keys
// and softkeys, the GMA 1347 audio panel, standby instruments, MASTER/AVIONICS switches, glareshield and yoke.
// Takes THREE as a parameter (Node checks, vanilla pages). Metres; panel face at z = 0, pilot on +z, up +y.

/** Names of the nodes camera cues can focus on (also checked by scripts/check-g1000-content.mjs). */
export const COCKPIT_NODES = ['panel', 'pfd', 'mfd', 'audio', 'standby', 'master', 'avionics', 'softkeysPfd', 'softkeysMfd',
  'fmsPfd', 'fmsMfd', 'comKnob', 'navKnob', 'hdgKnob', 'altKnob', 'crsKnob', 'dtoKey', 'yoke'];

/** Screen meshes that receive the live G1000 textures (PlaneGeometry, 4:3, facing +z). */
export const SCREENS = { pfd: 'pfdScreen', mfd: 'mfdScreen' };

export const GDU = { w: 0.3, h: 0.23, screenW: 0.25, screenH: 0.1875 };
const PFD_X = -0.2, MFD_X = 0.2, GDU_Y = 0.03;

/** @param {typeof import('three')} THREE */
export function buildC172Panel(THREE) {
  const g = new THREE.Group();
  g.name = 'c172Panel';
  const std = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: 0.75, metalness: 0.1, ...extra });
  const panelMat = std(0x2b3036), bezelMat = std(0x1b1e22, { roughness: 0.5 }), knobMat = std(0x3a3f45, { metalness: 0.3 }),
    keyMat = std(0x30353b), redMat = std(0xb3261e), whiteMat = std(0xe9edf0), dialMat = std(0x0e1114);
  const add = (parent, name, geo, mat, [x, y, z]) => {
    const m = new THREE.Mesh(geo, mat);
    m.name = name;
    m.position.set(x, y, z);
    parent.add(m);
    return m;
  };
  const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
  const knob = (r, d) => { const c = new THREE.CylinderGeometry(r, r, d, 20); c.rotateX(Math.PI / 2); return c; };

  add(g, 'panel', box(1.3, 0.5, 0.04), panelMat, [0, 0, -0.02]);
  add(g, 'glareshield', box(1.36, 0.04, 0.2), std(0x15181b), [0, 0.27, 0.06]);

  /** One GDU 1040 bezel: screen, 12 softkeys, left/right knob columns, keys. Returns its group. */
  const gdu = (name, x, screenName, softName, fmsName, extra) => {
    const b = new THREE.Group();
    b.name = name;
    b.position.set(x, GDU_Y, 0);
    g.add(b);
    add(b, `${name}Bezel`, box(GDU.w, GDU.h, 0.03), bezelMat, [0, 0, 0.015]);
    const screen = add(b, screenName, new THREE.PlaneGeometry(GDU.screenW, GDU.screenH), new THREE.MeshBasicMaterial({ color: 0x05080a }), [0, 0.012, 0.0305]);
    screen.userData.screen = true;
    const soft = new THREE.Group();
    soft.name = softName;
    b.add(soft);
    for (let i = 0; i < 12; i++) add(soft, `${softName}${i}`, box(0.016, 0.007, 0.006), keyMat, [-0.11 + i * 0.02, -0.092, 0.033]);
    // Left column: NAV (dual), HDG, ALT (dual). Right column: COM (dual), CRS/BARO, RANGE, FMS (dual) + keys.
    const L = -0.135, R = 0.135;
    for (const [n, y, r] of [['nav', 0.07, 0.011], ['hdg', 0.0, 0.009], ['alt', -0.07, 0.011]]) add(b, `${name}_${n}`, knob(r, 0.014), knobMat, [L, y, 0.037]);
    for (const [n, y, r] of [['com', 0.07, 0.011], ['crs', 0.015, 0.009], ['range', -0.035, 0.009], ['fms', -0.085, 0.011]]) add(b, `${name}_${n}`, knob(r, 0.014), knobMat, [R, y, 0.037]);
    ['dto', 'menu', 'fpl', 'proc', 'clr', 'ent'].forEach((k, i) => add(b, `${name}_${k}Key`, box(0.012, 0.008, 0.006), keyMat, [R - 0.007 + (i % 2) * 0.014, -0.005 - Math.floor(i / 2) * 0.011 - 0.012, 0.033]));
    /** Re-name the cue nodes of this bezel. */
    b.getObjectByName(`${name}_fms`).name = fmsName;
    extra(b);
    return b;
  };
  gdu('pfd', PFD_X, SCREENS.pfd, 'softkeysPfd', 'fmsPfd', (b) => {
    b.getObjectByName('pfd_nav').name = 'navKnob';
    b.getObjectByName('pfd_hdg').name = 'hdgKnob';
    b.getObjectByName('pfd_alt').name = 'altKnob';
    b.getObjectByName('pfd_com').name = 'comKnob';
    b.getObjectByName('pfd_crs').name = 'crsKnob';
    b.getObjectByName('pfd_dtoKey').name = 'dtoKey';
  });
  gdu('mfd', MFD_X, SCREENS.mfd, 'softkeysMfd', 'fmsMfd', () => {});

  const audio = new THREE.Group();
  audio.name = 'audio';
  audio.position.set(0, GDU_Y, 0);
  g.add(audio);
  add(audio, 'audioBody', box(0.06, GDU.h, 0.03), bezelMat, [0, 0, 0.015]);
  for (let i = 0; i < 8; i++) add(audio, `audioKey${i}`, box(0.024, 0.01, 0.006), keyMat, [-0.013 + (i % 2) * 0.026, 0.085 - Math.floor(i / 2) * 0.022, 0.033]);
  add(audio, 'displayBackup', box(0.04, 0.014, 0.008), redMat, [0, -0.09, 0.034]);

  const standby = new THREE.Group();
  standby.name = 'standby';
  standby.position.set(-0.47, 0.03, 0);
  g.add(standby);
  [0.075, 0, -0.075].forEach((y, i) => {
    add(standby, `standbyDial${i}`, knob(0.032, 0.02), dialMat, [0, y, 0.01]);
    add(standby, `standbyRim${i}`, new THREE.TorusGeometry(0.033, 0.004, 8, 24), knobMat, [0, y, 0.021]);
  });

  add(g, 'master', box(0.022, 0.04, 0.02), redMat, [-0.56, -0.17, 0.01]);
  add(g, 'avionics', box(0.022, 0.04, 0.02), whiteMat, [-0.52, -0.17, 0.01]);

  const yoke = new THREE.Group();
  yoke.name = 'yoke';
  yoke.position.set(-0.2, -0.22, 0.32);
  g.add(yoke);
  const shaft = knob(0.015, 0.3); add(yoke, 'yokeShaft', shaft, knobMat, [0, 0, -0.15]);
  const grip = new THREE.TorusGeometry(0.11, 0.014, 8, 24, Math.PI); grip.rotateZ(Math.PI);
  add(yoke, 'yokeGrip', grip, std(0x222629), [0, 0.02, 0]);
  return g;
}
