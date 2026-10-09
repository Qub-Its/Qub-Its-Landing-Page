// WebGL scene for the MCDU trainer's 3D flight plan map. The only module of the tab that imports three.js (named
// imports so the lazy chunk tree-shakes). 1 world unit = 1 NM horizontally; altitude exaggerated ×20.
import {
  BoxGeometry, BufferGeometry, Color, ConeGeometry, CylinderGeometry, DirectionalLight, ExtrudeGeometry, Fog,
  GridHelper, Group, HemisphereLight, Line, LineBasicMaterial, LineCurve3, LineDashedMaterial, Mesh,
  MeshBasicMaterial, MeshLambertMaterial, MeshStandardMaterial, PerspectiveCamera, PlaneGeometry, RingGeometry,
  Scene, Shape, SphereGeometry, TubeGeometry, Vector2, Vector3, WebGLRenderer, CurvePath, DoubleSide,
} from 'three';
import { buildA320 } from '../../shared/three/aircraft.js';
import { buildRoute, pointAt, runwayHeading } from './route.js';

const THREE = { Group, Mesh, MeshStandardMaterial, Shape, Vector2, ExtrudeGeometry, CylinderGeometry, ConeGeometry, BoxGeometry };
const FT_PER_NM = 6076, VEX = 20, RWY_X = 4, PLANE_NM = 6, FLY_S = 20;
const GREEN = 0x45df80, YELLOW = 0xf3e24c, CYAN = 0x3ccbe8, GREY = 0x97a5b1;
const toY = (ft) => (ft / FT_PER_NM) * VEX;

export async function createPlanMap(canvas, { onLabels, debugFail = false } = {}) {
  let renderer;
  try {
    if (debugFail) throw new Error('forced');
    renderer = new WebGLRenderer({ canvas, antialias: true });
  } catch {
    throw new Error('webgl-unavailable');
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  const scene = new Scene();
  scene.background = new Color(0x11171c);
  scene.fog = new Fog(0x11171c, 800, 4000);
  scene.add(new HemisphereLight(0xdfefff, 0x1d252c, 1.4));
  const sun = new DirectionalLight(0xffffff, 1.4); sun.position.set(-300, 600, 400); scene.add(sun);
  const ground = new Mesh(new PlaneGeometry(1, 1), new MeshLambertMaterial({ color: 0x1d252c }));
  ground.rotation.x = -Math.PI / 2; scene.add(ground);
  let grid = null;

  const routeGroup = new Group(); scene.add(routeGroup);
  const plane = new Group(); plane.rotation.order = 'YXZ'; scene.add(plane);
  const model = buildA320(THREE); model.scale.setScalar(PLANE_NM / 37.6); plane.add(model);
  plane.visible = false;

  const cam = new PerspectiveCamera(40, 1, 1, 20000);
  const size = { w: 1, h: 1 };
  let route = null, color = null, bboxKey = '', flyT = 0, flying = false;
  let raf = 0, last = 0, frames = 0, renders = 0, rebuilds = 0;
  const draw = () => { renderer.render(scene, cam); renders++; };

  const disposeGroup = (g) => { for (const o of [...g.children]) { g.remove(o); o.traverse((c) => { c.geometry?.dispose?.(); const m = c.material; (Array.isArray(m) ? m : m ? [m] : []).forEach((x) => x.dispose()); }); } };
  const v3 = (p) => new Vector3(p.x, toY(p.altFt), p.z);

  function rebuild() {
    rebuilds++;
    disposeGroup(routeGroup);
    if (!route || route.points.length < 1) return;
    const span = Math.max(50, ...route.points.map((p) => Math.max(Math.abs(p.x), Math.abs(p.z))));
    const tubeR = Math.max(0.6, span * 0.004), lineColor = color === 'yellow' ? YELLOW : GREEN;
    for (const seg of route.segments) {
      if (seg.disco) {
        const g = new BufferGeometry().setFromPoints(seg.pts.map(v3));
        const l = new Line(g, new LineDashedMaterial({ color: GREY, dashSize: span * 0.02, gapSize: span * 0.015 }));
        l.computeLineDistances(); routeGroup.add(l);
      } else {
        const path = new CurvePath();
        for (let i = 1; i < seg.pts.length; i++) path.add(new LineCurve3(v3(seg.pts[i - 1]), v3(seg.pts[i])));
        routeGroup.add(new Mesh(new TubeGeometry(path, 16 * seg.pts.length, tubeR, 6, false), new MeshBasicMaterial({ color: lineColor })));
      }
    }
    // ground shadow and drop lines
    routeGroup.add(new Line(new BufferGeometry().setFromPoints(route.points.map((p) => new Vector3(p.x, 0.05, p.z))), new LineBasicMaterial({ color: 0x34414c })));
    for (const p of route.points) {
      routeGroup.add(new Line(new BufferGeometry().setFromPoints([new Vector3(p.x, 0, p.z), v3(p)]), new LineBasicMaterial({ color: GREY, transparent: true, opacity: 0.5 })));
    }
    // airports: ring + runways (×4 length), selected runway cyan
    const snap = lastSnap;
    for (const p of route.points.filter((q) => q.kind === 'orig' || q.kind === 'dest')) {
      const ring = new Mesh(new RingGeometry(span * 0.012, span * 0.016, 32), new MeshBasicMaterial({ color: 0xffffff, side: DoubleSide }));
      ring.rotation.x = -Math.PI / 2; ring.position.set(p.x, 0.1, p.z); routeGroup.add(ring);
      const sel = p.kind === 'orig' ? snap?.depRwy : snap?.arrRwy;
      for (const [id, lenM] of snap?.airports?.[p.id]?.rwys || []) {
        const len = (lenM / 1852) * RWY_X;
        const bar = new Mesh(new BoxGeometry(Math.max(0.25, span * 0.0025), 0.1, len), new MeshBasicMaterial({ color: id === sel ? CYAN : GREY }));
        bar.position.set(p.x, 0.15, p.z); bar.rotation.y = -runwayHeading(id) * Math.PI / 180; routeGroup.add(bar);
      }
    }
    for (const m of [route.toc, route.tod]) if (m) {
      const s = new Mesh(new SphereGeometry(tubeR * 1.8, 12, 8), new MeshBasicMaterial({ color: 0xffffff }));
      s.position.copy(v3(m)); routeGroup.add(s);
    }
    // ground + grid sized to the route
    const g = span * 2.2; ground.scale.set(g, g, 1);
    if (grid) { scene.remove(grid); grid.geometry.dispose(); grid.material.dispose(); }
    grid = new GridHelper(g, Math.max(2, Math.round(g / 50)), 0x2a3640, 0x232d35); grid.position.y = 0.02; scene.add(grid);
  }

  // Camera beside the route (perpendicular to origin→destination), raised ~28°, so the vertical profile reads as a
  // side view and the route fills the width.
  function fit() {
    if (!route || !route.points.length) return;
    const pts = route.points, a = pts[0], b = pts[pts.length - 1];
    const xs = pts.map((p) => p.x), zs = pts.map((p) => p.z);
    const cx = (Math.min(...xs) + Math.max(...xs)) / 2, cz = (Math.min(...zs) + Math.max(...zs)) / 2;
    let dx = b.x - a.x, dz = b.z - a.z;
    const len = Math.hypot(dx, dz);
    if (len < 1e-6) { dx = 1; dz = 0; } else { dx /= len; dz /= len; }
    const px = -dz, pz = dx; // perpendicular, to the right of the route direction
    const along = Math.max(...pts.map((p) => Math.abs((p.x - cx) * dx + (p.z - cz) * dz)));
    const across = Math.max(...pts.map((p) => Math.abs((p.x - cx) * px + (p.z - cz) * pz)));
    const vfov = (cam.fov * Math.PI) / 180, hfov = 2 * Math.atan(Math.tan(vfov / 2) * cam.aspect);
    const top = toY(Math.max(route.crzFt || 0, ...pts.map((p) => p.altFt)));
    const dist = Math.max(40, (along * 1.15) / Math.tan(hfov / 2), ((top + across) * 1.3) / Math.tan(vfov / 2));
    const el = (28 * Math.PI) / 180;
    cam.position.set(cx + px * dist * Math.cos(el), top / 2 + dist * Math.sin(el), cz + pz * dist * Math.cos(el));
    cam.lookAt(cx, top / 2, cz);
    cam.far = dist * 8; cam.updateProjectionMatrix();
  }

  function emitLabels() {
    if (!onLabels) return;
    if (!route) { onLabels([]); return; }
    cam.updateMatrixWorld();
    const out = [], v = new Vector3();
    // Skip a label that would overlap one already placed (airports first, then waypoints, then T/C, T/D).
    const add = (id, text, p, kind) => {
      v.set(p.x, toY(p.altFt), p.z).project(cam);
      if (v.z > 1 || Math.abs(v.x) > 1.1 || Math.abs(v.y) > 1.1) return;
      const x = ((v.x + 1) / 2) * size.w, y = ((1 - v.y) / 2) * size.h;
      if (out.some((o) => Math.abs(o.x - x) < 7 * Math.max(o.text.length, text.length) && Math.abs(o.y - y) < 14)) return;
      out.push({ id, text, kind, x, y });
    };
    const pts = route.points;
    for (const p of pts.filter((q) => q.kind === 'orig' || q.kind === 'dest')) add(p.id, p.id, p, p.kind);
    for (const p of pts.filter((q) => q.kind !== 'orig' && q.kind !== 'dest')) add(p.id, p.id, p, p.kind);
    if (route.toc) add('TOC', 'T/C', route.toc, 'toc');
    if (route.tod) add('TOD', 'T/D', route.tod, 'tod');
    onLabels(out);
  }

  function placePlane() {
    if (!route || route.points.length < 2) { plane.visible = false; return; }
    const p = pointAt(route, flyT), ahead = pointAt(route, Math.min(1, flyT + 0.002));
    plane.visible = true;
    plane.position.set(p.x, toY(p.altFt) + 0.4, p.z);
    const dH = Math.hypot(ahead.x - p.x, ahead.z - p.z), dV = toY(ahead.altFt) - toY(p.altFt);
    plane.rotation.set(dH > 1e-6 ? Math.atan2(dV, dH) : 0, -p.headingDeg * Math.PI / 180, 0);
  }

  let lastSnap = null, pending = null, appliedKey = '';
  function apply() {
    if (!pending) return;
    const snap = pending;
    pending = null;
    const key = JSON.stringify(snap);
    if (key === appliedKey) return;
    appliedKey = key;
    lastSnap = snap;
    route = buildRoute(snap);
    color = route.points.length >= 2 ? (snap?.tmpy ? 'yellow' : 'green') : null;
    rebuild();
    const fitKey = route.points.map((p) => `${p.x.toFixed(1)},${p.z.toFixed(1)}`).join('|') + '|' + route.crzFt;
    if (fitKey !== bboxKey) { bboxKey = fitKey; flyT = 0; flying = false; fit(); }
    placePlane();
    emitLabels();
  }
  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = last ? Math.min((now - last) / 1000, 0.1) : 0; last = now;
    if (flying) { flyT = Math.min(1, flyT + dt / FLY_S); if (flyT >= 1) flying = false; placePlane(); }
    draw();
    frames++;
  }

  return {
    // Plans arrive on every MCDU key press: keep the latest and apply it only while running (or on start()),
    // and skip snapshots identical to the one already drawn.
    setPlan(snap) { pending = snap; if (raf) apply(); },
    fly() { if (!route || route.points.length < 2) return; if (flyT >= 1) flyT = 0; flying = true; },
    pause() { flying = false; },
    resize(w, h) {
      if (w < 1 || h < 1) return;
      size.w = w; size.h = h;
      renderer.setSize(w, h, false);
      cam.aspect = w / h; fit(); emitLabels();
    },
    start() { if (!raf) { apply(); last = 0; raf = requestAnimationFrame(frame); } },
    stop() { cancelAnimationFrame(raf); raf = 0; },
    dispose() {
      this.stop();
      disposeGroup(routeGroup);
      scene.traverse((o) => { o.geometry?.dispose?.(); const m = o.material; (Array.isArray(m) ? m : m ? [m] : []).forEach((x) => x.dispose()); });
      renderer.dispose();
    },
    get frames() { return frames; },
    get debug() {
      return { points: route?.points.length ?? 0, color, flying, t: flyT, renders, rebuilds, plane: plane.position.toArray().map((n) => Math.round(n * 10) / 10) };
    },
  };
}
