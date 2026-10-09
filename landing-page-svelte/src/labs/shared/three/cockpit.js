// Procedural A320 flight deck for the labs' cockpit intro. Same conventions as buildA320 (metres, nose −z,
// right +x, up +y) so it is added to the aircraft group as is. Takes THREE as a parameter (Node checks, vanilla pages).

export const SCREENS = { pfd: 'pfdL', mcdu: 'mcduL' };

/** @param {typeof import('three')} THREE */
export function buildCockpit(THREE) {
  const g = new THREE.Group();
  g.name = 'flightDeck';
  const std = (color) => new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: 0.8, metalness: 0.05 });
  const panelMat = std(0x3a434b), darkMat = std(0x1d252c);
  const add = (name, geo, material, [x, y, z], rotX = 0) => {
    const m = new THREE.Mesh(geo, material);
    m.name = name; m.position.set(x, y, z); m.rotation.x = rotX;
    g.add(m);
    return m;
  };
  // Interior shell seen from inside (BackSide) so the cabin is closed once the camera is in the fuselage.
  const shell = new THREE.CylinderGeometry(1.9, 1.9, 3.1, 16, 1, true); shell.rotateX(Math.PI / 2);
  add('shell', shell, new THREE.MeshStandardMaterial({ color: 0x2a3138, side: THREE.BackSide, roughness: 0.9 }), [0, 0, -14.05]);
  add('panel', new THREE.BoxGeometry(1.8, 0.5, 0.12), panelMat, [0, 0.55, -15.25]);
  add('glareshield', new THREE.BoxGeometry(1.9, 0.12, 0.35), darkMat, [0, 0.86, -15.12]);
  add('pedestal', new THREE.BoxGeometry(0.5, 0.5, 0.8), panelMat, [0, 0.05, -14.75]);
  // Displays: thin boxes on the panel face (z −15.19), each with its own material so one can light up alone.
  const screen = (name, w, h, pos, rotX = 0) => {
    const m = add(name, new THREE.BoxGeometry(w, h, 0.01), new THREE.MeshBasicMaterial({ color: 0x0b1015 }), pos, rotX);
    m.userData.screen = true;
    return m;
  };
  const Z = -15.185;
  screen('pfdL', 0.2, 0.2, [-0.72, 0.58, Z]);
  screen('ndL', 0.2, 0.2, [-0.48, 0.58, Z]);
  screen('ewd', 0.2, 0.2, [0, 0.66, Z]);
  screen('sd', 0.2, 0.2, [0, 0.43, Z]);
  screen('ndR', 0.2, 0.2, [0.48, 0.58, Z]);
  screen('pfdR', 0.2, 0.2, [0.72, 0.58, Z]);
  // MCDUs on the pedestal top, tilted back towards the pilots (normal ≈ (0, 0.84, 0.54)).
  screen('mcduL', 0.12, 0.1, [-0.12, 0.31, -14.95], -1.0);
  screen('mcduR', 0.12, 0.1, [0.12, 0.31, -14.95], -1.0);
  return g;
}
