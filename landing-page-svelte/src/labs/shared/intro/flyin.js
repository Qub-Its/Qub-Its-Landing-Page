// WebGL scene for the labs' cockpit fly-in intro. The only intro module that imports three.js; loaded with a
// dynamic import() by intro.js so three stays in its lazy chunk. Named imports so Vite can tree-shake three.
import {
  BackSide, BoxGeometry, CanvasTexture, Color, ConeGeometry, CylinderGeometry, DirectionalLight, ExtrudeGeometry, Fog, GridHelper, Group, HemisphereLight, Mesh, MeshBasicMaterial, MeshStandardMaterial, PerspectiveCamera, PlaneGeometry, SRGBColorSpace, Scene, Shape, ShapeGeometry, Vector2, Vector3, WebGLRenderer,
} from 'three';
import { buildA320 } from '../three/aircraft.js';
import { buildCockpit, SCREENS } from '../three/cockpit.js';
import { keyframes, cameraAt, veilAt, fovFor, DURATION } from './path.js';

const THREE = { BackSide, BoxGeometry, ConeGeometry, CylinderGeometry, ExtrudeGeometry, Group, Mesh, MeshBasicMaterial, MeshStandardMaterial, Shape, ShapeGeometry, Vector2 };
const DIM = 0x14303d; // the other displays: powered on, nothing to read

// Stylised content for the target screen, so the last frame matches the page the overlay fades to.
function screenTexture(target) {
  const c = document.createElement('canvas');
  const W = 256, H = target === 'mcdu' ? 214 : 256;
  c.width = W; c.height = H;
  const g = c.getContext('2d');
  g.fillStyle = '#05080a'; g.fillRect(0, 0, W, H);
  if (target === 'mcdu') {
    g.font = 'bold 22px monospace'; g.textBaseline = 'top';
    g.fillStyle = '#e8eef2'; g.textAlign = 'center'; g.fillText('MCDU MENU', W / 2, 12);
    g.textAlign = 'left';
    [['<FMGC', '#45df80'], ['<ATSU', '#e8eef2'], ['<AIDS', '#e8eef2'], ['<CFDS', '#e8eef2']]
      .forEach(([s, col], i) => { g.fillStyle = col; g.fillText(s, 10, 48 + i * 30); });
    g.font = 'bold 15px monospace'; g.fillStyle = '#e8eef2'; g.textAlign = 'center';
    g.fillText('SELECT DESIRED SYSTEM', W / 2, H - 28);
  } else {
    g.fillStyle = '#2f8fd8'; g.fillRect(64, 44, 128, 84);
    g.fillStyle = '#8a5a2b'; g.fillRect(64, 128, 128, 84);
    g.fillStyle = '#ffffff'; g.fillRect(64, 127, 128, 2);
    for (const y of [96, 112, 144, 160]) g.fillRect(112, y, 32, 2);
    g.fillStyle = '#f3e24c'; g.fillRect(84, 126, 30, 6); g.fillRect(142, 126, 30, 6); g.fillRect(125, 125, 6, 8);
    g.fillStyle = '#5b6670'; g.fillRect(14, 44, 38, 168); g.fillRect(204, 44, 38, 168);
    g.fillStyle = '#f3e24c'; g.fillRect(14, 124, 38, 3); g.fillRect(204, 124, 38, 3);
    g.fillStyle = '#45df80'; g.font = 'bold 15px monospace'; g.textAlign = 'center'; g.textBaseline = 'top';
    ['SPEED', 'ALT', 'NAV'].forEach((s, i) => g.fillText(s, 52 + i * 76, 12));
    g.fillStyle = '#5b6670'; g.fillRect(64, 222, 128, 22);
  }
  const tex = new CanvasTexture(c);
  tex.colorSpace = SRGBColorSpace;
  return tex;
}

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
  const dark = mat.color.clone(), lit = new Color(0xffffff);
  mat.map = screenTexture(target); mat.needsUpdate = true;
  mat.color.copy(dark);
  plane.traverse((o) => { if (o.userData.screen && o !== screen) /** @type {any} */ (o).material.color.setHex(DIM); });

  const cam = new PerspectiveCamera(50, 1, 0.05, 3000);
  // Dark veil just in front of the lens: hides the cut from the windshield to the captain's seat.
  const veilMat = new MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0, depthTest: false, depthWrite: false });
  const veil = new Mesh(new PlaneGeometry(2, 2), veilMat);
  veil.position.z = -0.06; veil.renderOrder = 999;
  cam.add(veil); scene.add(cam);
  let count = 0, raf = 0, last = 0, /** @type {(() => void)|null} */ finish = null;
  const pose = (t) => {
    last = t;
    const { pos, look } = cameraAt(frames, t);
    cam.position.fromArray(pos);
    cam.lookAt(look[0], look[1], look[2]);
    if (windowMesh) windowMesh.visible = pos[2] < -16.4;
    mat.color.lerpColors(dark, lit, Math.min(1, Math.max(0, (t - 0.8) / 0.15)));
    veilMat.opacity = veilAt(t);
    veil.visible = veilMat.opacity > 0;
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
        // Time starts at the first frame, not at the call: a tab opened in the background gets no frames until it
        // is shown, and a slow first frame (shader compile) must not skip the beginning.
        let t0 = -1;
        const loop = (now) => {
          if (t0 < 0) t0 = now;
          const t = Math.min(1, (now - t0) / (DURATION * 1000));
          // A render error ends the intro instead of leaving the overlay up on a frozen frame.
          try { pose(t); } catch (e) { console.warn('[intro]', e); stopLoop(); return; }
          if (t >= 1) stopLoop(); else raf = requestAnimationFrame(loop);
        };
        raf = requestAnimationFrame(loop);
      });
    },
    skip: stopLoop,
    resize(w, h) {
      renderer.setSize(w, h, false);
      cam.aspect = w / Math.max(1, h);
      cam.fov = fovFor(cam.aspect);
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
      mat.map?.dispose();
      renderer.forceContextLoss(); // release the context now: replays would otherwise pile them up until GC
      renderer.dispose();
    },
    get frames() { return count; },
  };
}
