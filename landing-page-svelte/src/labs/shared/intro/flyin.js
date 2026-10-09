// WebGL scene for the labs' cockpit fly-in intro. The only intro module that imports three.js; loaded with a
// dynamic import() by intro.js so three stays in its lazy chunk. Named imports so Vite can tree-shake three.
import {
  BackSide, BoxGeometry, Color, ConeGeometry, CylinderGeometry, DirectionalLight, ExtrudeGeometry, Fog, GridHelper, Group, HemisphereLight, Mesh, MeshBasicMaterial, MeshStandardMaterial, PerspectiveCamera, Scene, Shape, Vector2, Vector3, WebGLRenderer,
} from 'three';
import { buildA320 } from '../three/aircraft.js';
import { buildCockpit, SCREENS } from '../three/cockpit.js';
import { keyframes, cameraAt, DURATION } from './path.js';

const THREE = { BackSide, BoxGeometry, ConeGeometry, CylinderGeometry, ExtrudeGeometry, Group, Mesh, MeshBasicMaterial, MeshStandardMaterial, Shape, Vector2 };
const LIT = 0x45df80;

/**
 * @param {HTMLCanvasElement} canvas
 * @param {{target?: 'pfd'|'mcdu', debugFail?: boolean}} [opts]
 */
export async function createFlyin(canvas, { target = 'pfd', debugFail = false } = {}) {
  let renderer;
  try {
    if (debugFail) throw new Error('forced');
    renderer = new WebGLRenderer({ canvas, antialias: true });
  } catch {
    throw new Error('webgl-unavailable');
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  const scene = new Scene();
  scene.background = new Color(0x3d86c6);
  scene.fog = new Fog(0x9fc3e0, 200, 1400);
  scene.add(new HemisphereLight(0xe6f2ff, 0x6b4a2a, 1.3));
  const sun = new DirectionalLight(0xffffff, 1.6); sun.position.set(40, 80, 30); scene.add(sun);
  const grid = new GridHelper(2000, 40, 0xc9a26b, 0xa77d4a); grid.position.y = -60; scene.add(grid);

  const plane = buildA320(THREE);
  plane.add(buildCockpit(THREE));
  scene.add(plane);
  plane.updateMatrixWorld(true);
  const screen = /** @type {import('three').Mesh} */ (plane.getObjectByName(SCREENS[target] ?? SCREENS.pfd));
  const frames = keyframes(target, screen.getWorldPosition(new Vector3()).toArray(), screen.getWorldDirection(new Vector3()).toArray());
  const windowMesh = plane.getObjectByName('cockpit');
  const mat = /** @type {import('three').MeshBasicMaterial} */ (screen.material);
  const dark = mat.color.clone(), lit = new Color(LIT);

  const cam = new PerspectiveCamera(50, 1, 0.05, 3000);
  let count = 0, raf = 0, last = 0, /** @type {(() => void)|null} */ finish = null;
  const pose = (t) => {
    last = t;
    const { pos, look } = cameraAt(frames, t);
    cam.position.fromArray(pos);
    cam.lookAt(look[0], look[1], look[2]);
    if (windowMesh) windowMesh.visible = pos[2] < -16.4;
    mat.color.lerpColors(dark, lit, Math.min(1, Math.max(0, (t - 0.85) / 0.15)));
    renderer.render(scene, cam);
    count++;
  };
  const stopLoop = () => { cancelAnimationFrame(raf); raf = 0; const f = finish; finish = null; f?.(); };
  pose(0);

  return {
    play() {
      stopLoop();
      return new Promise((resolve) => {
        finish = resolve;
        const t0 = performance.now();
        const loop = (now) => {
          const t = Math.min(1, (now - t0) / (DURATION * 1000));
          pose(t);
          if (t >= 1) stopLoop(); else raf = requestAnimationFrame(loop);
        };
        raf = requestAnimationFrame(loop);
      });
    },
    skip: stopLoop,
    resize(w, h) {
      renderer.setSize(w, h, false);
      cam.aspect = w / Math.max(1, h);
      cam.updateProjectionMatrix();
      if (!raf) pose(last);
    },
    dispose() {
      stopLoop();
      scene.traverse((o) => {
        const m = /** @type {any} */ (o);
        m.geometry?.dispose?.();
        for (const x of [].concat(m.material ?? [])) x.dispose?.();
      });
      renderer.dispose();
    },
    get frames() { return count; },
  };
}
