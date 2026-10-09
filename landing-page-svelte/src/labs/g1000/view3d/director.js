// WebGL director of the G1000 course: one renderer and canvas, two scenes (C172 cockpit with live screen textures,
// exploded LRU architecture with animated data flows), camera cues, picking and a push-in toward a screen. The only
// module of the course that imports three.js; loaded with a dynamic import() by Scene3d.svelte. Named imports so
// Vite can tree-shake three.
import {
  Box3, BoxGeometry, BufferGeometry, CanvasTexture, Color, CylinderGeometry, DirectionalLight, EdgesGeometry, Group,
  HemisphereLight, Line, LineBasicMaterial, LineSegments, Mesh, MeshBasicMaterial, MeshStandardMaterial, PerspectiveCamera,
  PlaneGeometry, Raycaster, Scene, SphereGeometry, Sprite, SpriteMaterial, SRGBColorSpace, TorusGeometry, Vector2, Vector3,
  WebGLRenderer,
} from 'three';
import { buildC172Panel, SCREENS } from '../../shared/three/c172-panel.js';
import { LRUS, FLOWS } from '../content/lru.js';
import { frameBox, tweenFrame } from './camera.js';
import { lruAt, flowPoint } from './explode-math.js';

const THREE = { BoxGeometry, CylinderGeometry, Group, Mesh, MeshBasicMaterial, MeshStandardMaterial, PlaneGeometry, TorusGeometry };
const FOV = 40;
const LRU_COLORS = { gdu: 0x2c3a46, gia: 0x3d5a6c, ahrs: 0x6c4f8a, gmu: 0x6c4f8a, adc: 0x2f7a6a, pitot: 0x2f7a6a, gea: 0x8a6a2f, gtx: 0x4a6a2f, gma: 0x5a5a5a, ant: 0x7a7a7a };

/**
 * @param {HTMLCanvasElement} canvas
 * @param {{ debugFail?: boolean, reduced?: boolean, screens?: () => Partial<Record<'pfd'|'mfd', SVGSVGElement|null>> }} [opts]
 */
export async function createDirector(canvas, { debugFail = false, reduced = false, screens = () => ({}) } = {}) {
  let renderer;
  try {
    if (debugFail) throw new Error('forced');
    renderer = new WebGLRenderer({ canvas, antialias: true });
  } catch {
    throw new Error('webgl-unavailable');
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = SRGBColorSpace;
  const camera = new PerspectiveCamera(FOV, 16 / 9, 0.01, 50);

  // ---------- cockpit scene
  const cockpit = new Scene();
  cockpit.background = new Color(0x12161a);
  cockpit.add(new HemisphereLight(0xfff1dc, 0x2a2018, 2.2));
  const lamp = new DirectionalLight(0xffe2b8, 1.8); lamp.position.set(0.4, 1.2, 1.2); cockpit.add(lamp);
  const panel = buildC172Panel(THREE);
  cockpit.add(panel);
  /** Live textures for the two screens (SVG → image → canvas). */
  const tex = {};
  for (const [key, name] of Object.entries(SCREENS)) {
    const c = document.createElement('canvas'); c.width = 1024; c.height = 768;
    const t = new CanvasTexture(c); t.colorSpace = SRGBColorSpace;
    tex[key] = { canvas: c, texture: t, busy: false };
    const mesh = /** @type {any} */ (panel.getObjectByName(name));
    mesh.material = new MeshBasicMaterial({ map: t, toneMapped: false });
  }
  let lastTex = 0;
  function refreshScreens(now) {
    if (now - lastTex < 250) return;
    lastTex = now;
    const src = screens();
    for (const key of /** @type {const} */ (['pfd', 'mfd'])) {
      const svg = src[key];
      const slot = tex[key];
      if (!svg || slot.busy) continue;
      slot.busy = true;
      const xml = new XMLSerializer().serializeToString(svg);
      const url = URL.createObjectURL(new Blob([xml.includes('xmlns=') ? xml : xml.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"')], { type: 'image/svg+xml' }));
      const img = new Image();
      img.onload = () => { slot.canvas.getContext('2d')?.drawImage(img, 0, 0, 1024, 768); slot.texture.needsUpdate = true; URL.revokeObjectURL(url); slot.busy = false; };
      img.onerror = () => { URL.revokeObjectURL(url); slot.busy = false; };
      img.src = url;
    }
  }

  // ---------- exploded scene
  const explode = new Scene();
  explode.background = new Color(0x0e1418);
  explode.add(new HemisphereLight(0xe6f2ff, 0x1a2228, 1.5));
  const key = new DirectionalLight(0xffffff, 1.1); key.position.set(1, 2, 3); explode.add(key);
  const lruGroup = new Group();
  explode.add(lruGroup);
  /** @type {Record<string, any>} */
  const lruMesh = {};
  for (const l of LRUS) {
    const m = new Mesh(new BoxGeometry(...l.size), new MeshStandardMaterial({ color: LRU_COLORS[l.part.slice(4)] ?? 0x445566, roughness: 0.6, metalness: 0.2 }));
    m.name = l.id;
    m.userData.part = l.part;
    const edges = new LineSegments(new EdgesGeometry(m.geometry), new LineBasicMaterial({ color: 0x9fb3c2 }));
    m.add(edges);
    m.add(label(l.model, l.size[1] / 2 + 0.08));
    lruGroup.add(m);
    lruMesh[l.id] = m;
  }
  /** Flow lines and their travelling pulses. */
  const flows = FLOWS.map((f, k) => {
    const pts = f.path.map((id) => new Vector3(...(LRUS.find((l) => l.id === id)?.pos ?? [0, 0, 0])));
    const line = new Line(new BufferGeometry().setFromPoints(pts), new LineBasicMaterial({ color: 0x3ccbe8, transparent: true, opacity: 0.35 }));
    const pulses = [0, 1, 2].map(() => { const s = new Mesh(new SphereGeometry(0.025, 10, 8), new MeshBasicMaterial({ color: 0x3ccbe8 })); explode.add(s); return s; });
    explode.add(line);
    return { f, line, pulses, phase: k * 0.23 };
  });

  /** Canvas-texture sprite with a short text (LRU model name). */
  function label(text, y) {
    const c = document.createElement('canvas'); c.width = 256; c.height = 64;
    const ctx = c.getContext('2d');
    if (ctx) { ctx.fillStyle = '#e4eaef'; ctx.font = 'bold 30px B612, system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.fillText(text, 128, 42); }
    const sp = new Sprite(new SpriteMaterial({ map: new CanvasTexture(c), transparent: true, depthTest: false }));
    sp.scale.set(0.36, 0.09, 1);
    sp.position.y = y;
    return sp;
  }

  // ---------- highlight halo (pulsing cyan box around the cue target)
  const halo = new LineSegments(new EdgesGeometry(new BoxGeometry(1, 1, 1)), new LineBasicMaterial({ color: 0x3ccbe8, transparent: true }));
  halo.visible = false;

  // ---------- state
  let sceneId = /** @type {'cockpit'|'explode'} */ ('cockpit');
  let explodeT0 = 0;
  let focusFlow = /** @type {string|null} */ (null);
  let haloTarget = /** @type {any} */ (null);
  let from = { pos: /** @type {[number,number,number]} */ ([0, 0.1, 1.6]), target: /** @type {[number,number,number]} */ ([0, 0, 0]) };
  let to = from, tween0 = 0, tweenMs = 1, tweenDone = () => {};
  let raf = /** @type {number|null} */ (null);
  let frames = 0;
  const current = () => (sceneId === 'cockpit' ? cockpit : explode);

  function boxOf(obj) {
    obj.updateMatrixWorld(true);
    const b = new Box3().setFromObject(obj);
    return { min: /** @type {[number,number,number]} */ (b.min.toArray()), max: /** @type {[number,number,number]} */ (b.max.toArray()) };
  }
  /** Framing box of the FINAL exploded layout (the live meshes start packed at the origin). */
  function explodedBox(lrus) {
    const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
    for (const l of lrus) for (let i = 0; i < 3; i++) {
      min[i] = Math.min(min[i], l.pos[i] - l.size[i] / 2);
      max[i] = Math.max(max[i], l.pos[i] + l.size[i] / 2);
    }
    return { min: /** @type {[number,number,number]} */ (min), max: /** @type {[number,number,number]} */ (max) };
  }
  function flyTo(frame, ms = 900) {
    const t = tweenAt(performance.now());
    from = t; to = frame; tween0 = performance.now(); tweenMs = reduced ? 1 : ms;
    return new Promise((resolve) => { tweenDone(); tweenDone = resolve; });
  }
  function tweenAt(now) { return tweenFrame(from, to, (now - tween0) / tweenMs); }

  /** Frames a node of the active scene: cockpit node name, LRU id, flow id or 'all'. */
  function cue(focus) {
    const sc = current();
    focusFlow = null;
    haloTarget = null;
    let obj = null;
    let box = null;
    if (sceneId === 'explode') {
      const flow = FLOWS.find((f) => f.id === focus);
      if (flow) { focusFlow = flow.id; obj = lruGroup; }
      else obj = focus === 'all' ? lruGroup : lruMesh[focus] ?? lruGroup;
      box = explodedBox(obj === lruGroup ? LRUS : LRUS.filter((l) => l.id === focus));
    } else obj = focus === 'panel' ? panel : sc.getObjectByName(focus) ?? panel;
    if (obj !== lruGroup && obj !== panel) haloTarget = obj;
    sc.add(halo);
    halo.visible = !!haloTarget;
    return flyTo(frameBox(box ?? boxOf(obj), FOV, camera.aspect));
  }

  function setScene(id) {
    sceneId = id;
    if (id === 'explode') explodeT0 = performance.now();
    halo.visible = false;
  }

  /** Cockpit only: flies into a screen (before the 2D G1000 crossfades in). */
  function pushIn(screen = 'pfd') {
    if (sceneId !== 'cockpit') return Promise.resolve();
    const m = panel.getObjectByName(SCREENS[screen]);
    halo.visible = false;
    return m ? flyTo(frameBox(boxOf(m), FOV, camera.aspect), 700) : Promise.resolve();
  }

  const ray = new Raycaster(), ndc = new Vector2();
  /** Explode scene: LRU part under a client point, or null. */
  function pick(clientX, clientY) {
    if (sceneId !== 'explode') return null;
    const r = canvas.getBoundingClientRect();
    ndc.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(Object.values(lruMesh), false)[0];
    return hit ? hit.object.userData.part : null;
  }

  function frame(now) {
    const c = tweenAt(now);
    if ((now - tween0) / tweenMs >= 1) { tweenDone(); tweenDone = () => {}; }
    camera.position.set(...c.pos);
    camera.lookAt(new Vector3(...c.target));
    if (sceneId === 'explode') {
      const p = reduced ? 1 : Math.min(1, (now - explodeT0) / 2400);
      for (const l of LRUS) lruMesh[l.id].position.set(...lruAt(l, p));
      for (const fl of flows) {
        const on = !focusFlow || focusFlow === fl.f.id;
        /** @type {any} */ (fl.line.material).opacity = p < 1 ? 0 : on ? (focusFlow ? 1 : 0.45) : 0.08;
        fl.pulses.forEach((s, i) => {
          s.visible = p >= 1 && on;
          s.position.set(...flowPoint(fl.f.path, (now / 2600 + fl.phase + i / 3) % 1));
        });
      }
    } else refreshScreens(now);
    if (haloTarget && halo.visible) {
      const b = new Box3().setFromObject(haloTarget);
      b.getCenter(halo.position);
      const size = b.getSize(new Vector3());
      halo.scale.set(size.x + 0.02, size.y + 0.02, size.z + 0.02);
      /** @type {any} */ (halo.material).opacity = 0.55 + 0.45 * Math.sin(now / 220);
    }
    renderer.render(current(), camera);
    frames++;
    raf = requestAnimationFrame(frame);
  }

  return {
    setScene, cue, pushIn, pick,
    get frames() { return frames; },
    get scene() { return sceneId; },
    resize(w, h) {
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    },
    start() { if (raf == null) raf = requestAnimationFrame(frame); },
    stop() { if (raf != null) cancelAnimationFrame(raf); raf = null; },
    dispose() {
      if (raf != null) cancelAnimationFrame(raf);
      raf = null;
      tweenDone();
      for (const sc of [cockpit, explode]) sc.traverse((o) => { /** @type {any} */ (o).geometry?.dispose?.(); const m = /** @type {any} */ (o).material; (Array.isArray(m) ? m : m ? [m] : []).forEach((x) => { x.map?.dispose?.(); x.dispose?.(); }); });
      renderer.dispose();
    },
  };
}
