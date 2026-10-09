// Procedural low-poly A320 for the labs' 3D views (PFD exterior view now; MCDU 3D F-PLN / intro later).
// Takes the THREE namespace as a parameter so vanilla pages and Node checks can use it without bundler tricks.
// Metres, nose toward −z, right wing +x, up +y, centre of gravity at the origin. Fixed clean configuration.

/** @param {typeof import('three')} THREE */
export function buildA320(THREE) {
  const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: 0.6, metalness: 0.1, ...extra });
  const white = mat(0xeef2f5), grey = mat(0xaab4bd), dark = mat(0x1d252c, { roughness: 0.3 }), accent = mat(0x3ccbe8);
  const g = new THREE.Group();
  g.name = 'A320';
  const add = (name, geo, material, [x, y, z] = [0, 0, 0]) => {
    const m = new THREE.Mesh(geo, material);
    m.name = name;
    m.position.set(x, y, z);
    g.add(m);
    return m;
  };
  // Flat planform in the shape's (x, y) plane, y = forward. Extruded `t` thick, then laid flat (extrusion → +y).
  const plate = (pts, t) => {
    const shape = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y)));
    const geo = new THREE.ExtrudeGeometry(shape, { depth: t, bevelEnabled: false });
    geo.rotateX(-Math.PI / 2); // shape y → world −z (forward), extrusion z → world +y
    return geo;
  };

  // Fuselage: 30 m barrel + 4.4 m nose cone + 3.2 m tail cone = 37.6 m, radius 2 m.
  const barrel = new THREE.CylinderGeometry(2, 2, 30, 16); barrel.rotateX(Math.PI / 2);
  add('fuselage', barrel, white, [0, 0, 0]);
  // Open-ended: the base disc would sit at z = −15 facing aft and wall off the flight deck in the cockpit intro.
  const nose = new THREE.ConeGeometry(2, 4.4, 16, 1, true); nose.rotateX(-Math.PI / 2);
  add('noseCone', nose, white, [0, 0, -17.2]);
  const tail = new THREE.ConeGeometry(2, 3.2, 16); tail.rotateX(Math.PI / 2);
  add('tailCone', tail, white, [0, 0.4, 16.6]);
  add('cockpit', new THREE.BoxGeometry(2.6, 0.7, 1.4), dark, [0, 1.1, -15.6]);

  // Wings: root chord 7 m at the fuselage side, 25° sweep, tip 17.9 m out (span 35.8 m), low-mounted.
  const wing = (side) => plate([[0, 2], [0, -5], [side * 16, -7.6], [side * 16, -6]].map(([x, y]) => [x + side * 1.9, y]), 0.5);
  add('wingL', wing(-1), grey, [0, -1.2, 0]);
  add('wingR', wing(1), grey, [0, -1.2, 0]);

  // Horizontal stabilisers: span ≈ 12.4 m.
  const stab = (side) => plate([[0, -13], [0, -17], [side * 4.4, -18.6], [side * 4.4, -17.2]].map(([x, y]) => [x + side * 1.8, y]), 0.3);
  add('stabL', stab(-1), grey, [0, 0.6, 0]);
  add('stabR', stab(1), grey, [0, 0.6, 0]);

  // Fin: planform drawn in (forward, up), extruded sideways (rotateY maps shape x → world z, extrusion → +x).
  const finShape = new THREE.Shape([[-13, 1.5], [-18.6, 1.5], [-19.2, 8.4], [-17.4, 8.4]].map(([u, v]) => new THREE.Vector2(u, v)));
  const finGeo = new THREE.ExtrudeGeometry(finShape, { depth: 0.3, bevelEnabled: false });
  finGeo.rotateY(Math.PI / 2); // shape (u, v, w) → world (w, v, −u): u = −z, so aft points land at +z; extrusion → +x
  finGeo.translate(-0.15, 0, 0);
  add('fin', finGeo, accent);

  // Engines under the wings.
  const nacelle = new THREE.CylinderGeometry(1.1, 0.9, 4.4, 14); nacelle.rotateX(Math.PI / 2);
  add('engineL', nacelle, grey, [-5.75, -2.6, -4]);
  add('engineR', nacelle.clone(), grey, [5.75, -2.6, -4]);
  return g;
}
