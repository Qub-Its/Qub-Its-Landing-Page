// WebGL scene for the PFD trainer's 3D exterior view. The only module that imports three.js; loaded with a
// dynamic import() by Exterior3d.svelte so three lands in its own chunk. Pure view of the flight state.
// Named imports (not `import * as`) so Vite can tree-shake three; THREE below is the subset this view and
// buildA320 use.
import {
  ArrowHelper, BoxGeometry, BufferAttribute, BufferGeometry, Color, ConeGeometry, CylinderGeometry, DirectionalLight, ExtrudeGeometry, Fog, GridHelper, Group, HemisphereLight, Line, LineBasicMaterial, Mesh, MeshLambertMaterial, MeshStandardMaterial, PerspectiveCamera, PlaneGeometry, Scene, Shape, Vector2, Vector3, WebGLRenderer,
} from 'three';
import { buildA320 } from '../../shared/three/aircraft.js';
import { poseFrom, rotate } from './pose.js';

const THREE = { ArrowHelper, BoxGeometry, BufferAttribute, BufferGeometry, Color, ConeGeometry, CylinderGeometry, DirectionalLight, ExtrudeGeometry, Fog, GridHelper, Group, HemisphereLight, Line, LineBasicMaterial, Mesh, MeshLambertMaterial, MeshStandardMaterial, PerspectiveCamera, PlaneGeometry, Scene, Shape, Vector2, Vector3, WebGLRenderer };

const GROUND_Y = -120, CELL = 50, KT = 0.5144;
const ARC_N = 24, ARC_R = 34;

/**
 * @param {HTMLCanvasElement} canvas
 * @param {() => import('../lib/schema.js').FlightState} getState
 * @param {{camera?: 'side'|'rear'|'q34', debugFail?: boolean}} [opts]
 */
export async function createExteriorView(canvas, getState, { camera = 'side', debugFail = false } = {}) {
  let renderer;
  try {
    if (debugFail) throw new Error('forced');
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  } catch {
    throw new Error('webgl-unavailable');
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x3d86c6);
  scene.fog = new THREE.Fog(0x9fc3e0, 600, 2200);
  scene.add(new THREE.HemisphereLight(0xe6f2ff, 0x6b4a2a, 1.3));
  const sun = new THREE.DirectionalLight(0xffffff, 1.6); sun.position.set(40, 80, 30); scene.add(sun);

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(6000, 6000), new THREE.MeshLambertMaterial({ color: 0x8b5a2b }));
  ground.rotation.x = -Math.PI / 2; ground.position.y = GROUND_Y; scene.add(ground);
  const grid = new THREE.GridHelper(3000, 3000 / CELL, 0xc9a26b, 0xa77d4a);
  grid.position.y = GROUND_Y + 0.05; scene.add(grid);

  const body = new THREE.Group(); body.rotation.order = 'YXZ'; scene.add(body);
  body.add(buildA320(THREE));
  // Body axis (white) and AoA arc (amber), both in the body frame.
  const axis = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, -19), new THREE.Vector3(0, 0, -48)]),
    new THREE.LineBasicMaterial({ color: 0xffffff }));
  body.add(axis);
  const arcPos = new Float32Array(ARC_N * 3);
  const arcGeo = new THREE.BufferGeometry(); arcGeo.setAttribute('position', new THREE.BufferAttribute(arcPos, 3));
  const arc = new THREE.Line(arcGeo, new THREE.LineBasicMaterial({ color: 0xf3a533 }));
  body.add(arc);
  const fpvArrow = new THREE.ArrowHelper(new THREE.Vector3(0, 0, -1), new THREE.Vector3(0, 0, 0), 48, 0x45df80, 6, 3.5);
  scene.add(fpvArrow);

  const cam = new THREE.PerspectiveCamera(38, 1, 1, 5000);
  const placeCamera = (hdgRad) => {
    const f = new THREE.Vector3(Math.sin(hdgRad), 0, -Math.cos(hdgRad)), r = new THREE.Vector3(Math.cos(hdgRad), 0, Math.sin(hdgRad));
    const up = new THREE.Vector3(0, 1, 0), p = new THREE.Vector3();
    // side: right of the aircraft looking left, so the nose points right on screen.
    if (camera === 'side') p.addScaledVector(r, 62).addScaledVector(f, -6).addScaledVector(up, 3);
    else if (camera === 'rear') p.addScaledVector(f, -58).addScaledVector(up, 9);
    else p.addScaledVector(f, -46).addScaledVector(r, -40).addScaledVector(up, 18);
    cam.position.copy(p); cam.lookAt(0, 0, 0);
  };

  let raf = 0, last = 0, frames = 0, dx = 0, dz = 0;
  const v = new THREE.Vector3();
  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = last ? Math.min((now - last) / 1000, 0.1) : 0; last = now;
    const s = getState(), p = poseFrom(s);
    body.rotation.set(p.pitch, p.yaw, p.roll);
    fpvArrow.setDirection(v.set(...p.fpv));
    // AoA arc: from the body nose axis to the FPV, in the body's vertical plane.
    const fb = rotate(rotate(rotate(p.fpv, { yaw: -p.yaw, pitch: 0, roll: 0 }), { yaw: 0, pitch: -p.pitch, roll: 0 }), { yaw: 0, pitch: 0, roll: -p.roll });
    const a = Math.atan2(fb[1], -fb[2]);
    for (let i = 0; i < ARC_N; i++) {
      const t = (a * i) / (ARC_N - 1);
      arcPos.set([0, ARC_R * Math.sin(t), -ARC_R * Math.cos(t)], i * 3);
    }
    arcGeo.attributes.position.needsUpdate = true;
    // Ground grid scrolls under the aircraft along the track (IAS as a speed proxy: decorative, not to scale).
    const speed = (Number.isFinite(s.ias) ? s.ias : 0) * KT * Math.cos(p.fpa * Math.PI / 180);
    dx = (dx + p.fpv[0] * speed * dt) % CELL; dz = (dz + p.fpv[2] * speed * dt) % CELL;
    grid.position.x = -dx; grid.position.z = -dz;
    placeCamera(-p.yaw);
    renderer.render(scene, cam);
    frames++;
  }

  return {
    setCamera(id) { camera = id; },
    resize(w, h) {
      if (w < 1 || h < 1) return;
      renderer.setSize(w, h, false);
      cam.aspect = w / h; cam.updateProjectionMatrix();
    },
    start() { if (!raf) { last = 0; raf = requestAnimationFrame(frame); } },
    stop() { cancelAnimationFrame(raf); raf = 0; },
    dispose() {
      this.stop();
      scene.traverse((o) => { o.geometry?.dispose?.(); const m = o.material; (Array.isArray(m) ? m : m ? [m] : []).forEach((x) => x.dispose()); });
      renderer.dispose();
    },
    get frames() { return frames; },
  };
}
