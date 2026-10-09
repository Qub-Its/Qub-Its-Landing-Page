// Checks for the G1000 course 3D: camera framing, exploded-scene maths, procedural cockpit panel, LRU data.
// Run from landing-page-svelte/:  node scripts/check-g1000-3d.mjs
import assert from 'node:assert/strict';
import { frameBox, tweenFrame, ease } from '../src/labs/g1000/view3d/camera.js';
import { lruAt, flowPoint, packed } from '../src/labs/g1000/view3d/explode-math.js';
import { LRUS, FLOWS, EXPLODE_NODES } from '../src/labs/g1000/content/lru.js';
import { COCKPIT_NODES, SCREENS, buildC172Panel } from '../src/labs/shared/three/c172-panel.js';

let passed = 0, failed = 0;
function check(name, fn) {
  try { fn(); passed++; console.log(`  ok   ${name}`); }
  catch (e) { failed++; console.log(`  FAIL ${name}\n       ${e.message}`); }
}
const near = (a, b, eps = 1e-9, msg = '') => assert.ok(Math.abs(a - b) <= eps, `${msg} ${a} ≉ ${b}`);

console.log('G1000 3D checks');

check('frameBox: camera in front (+z) of the box, looking at its centre, bigger box → farther', () => {
  const small = frameBox({ min: [-0.1, -0.1, 0], max: [0.1, 0.1, 0.02] });
  const big = frameBox({ min: [-0.6, -0.3, 0], max: [0.6, 0.3, 0.02] });
  near(small.target[0], 0); near(small.target[1], 0);
  assert.ok(small.pos[2] > 0.1 && big.pos[2] > small.pos[2] * 2);
});
check('tweenFrame: endpoints and clamping', () => {
  const a = { pos: [0, 0, 1], target: [0, 0, 0] }, b = { pos: [1, 1, 2], target: [1, 0, 0] };
  assert.deepEqual(tweenFrame(a, b, 0).pos, [0, 0, 1]); assert.deepEqual(tweenFrame(a, b, 1).pos, [1, 1, 2]);
  assert.deepEqual(tweenFrame(a, b, 7).pos, [1, 1, 2]); near(ease(0.5), 0.5);
});
check('lruAt: packed at 0, exploded at 1', () => {
  for (const l of LRUS) {
    lruAt(l, 0).forEach((v, i) => near(v, packed(l)[i], 1e-9, `${l.id} p0`));
    lruAt(l, 1).forEach((v, i) => near(v, l.pos[i], 1e-9, `${l.id} p1`));
  }
});
check('flowPoint: starts and ends on the path LRUs', () => {
  for (const f of FLOWS) {
    const first = LRUS.find((l) => l.id === f.path[0]).pos, last = LRUS.find((l) => l.id === f.path.at(-1)).pos;
    flowPoint(f.path, 0).forEach((v, i) => near(v, first[i]));
    flowPoint(f.path, 1).forEach((v, i) => near(v, last[i]));
  }
});
check('LRU data: unique ids, flows reference LRUs, explode nodes', () => {
  assert.equal(new Set(LRUS.map((l) => l.id)).size, LRUS.length);
  for (const f of FLOWS) for (const id of f.path) assert.ok(LRUS.some((l) => l.id === id), `${f.id}: ${id}`);
  assert.ok(EXPLODE_NODES.includes('all') && EXPLODE_NODES.includes('airData'));
});

const THREE = await import('three');
check('c172 panel: every cue node and both screens exist', () => {
  const g = buildC172Panel(THREE);
  for (const n of COCKPIT_NODES) assert.ok(g.getObjectByName(n), `missing ${n}`);
  for (const n of Object.values(SCREENS)) assert.ok(g.getObjectByName(n)?.userData.screen, `screen ${n}`);
});
check('c172 panel: PFD left of MFD, screens 4:3 facing the pilot, about 1.3 m wide', () => {
  const g = buildC172Panel(THREE); g.updateMatrixWorld(true);
  const p = new THREE.Vector3(), m = new THREE.Vector3();
  g.getObjectByName(SCREENS.pfd).getWorldPosition(p); g.getObjectByName(SCREENS.mfd).getWorldPosition(m);
  assert.ok(p.x < 0 && m.x > 0 && p.z > 0);
  const s = g.getObjectByName(SCREENS.pfd).geometry.parameters; near(s.width / s.height, 4 / 3, 1e-6);
  const size = new THREE.Box3().setFromObject(g.getObjectByName('panel')).getSize(new THREE.Vector3());
  near(size.x, 1.3, 1e-6);
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
