// "Mapa 3D" tab of the MCDU trainer. Small and three-free: it lazy-loads fpln3d/map.js the first time the tab is
// selected, feeds it every mcdu:plan snapshot (plus the one published before it loaded, window.__mcduPlan) and
// renders only while the tab is selected, the stage is on screen and the page is visible.
export function initPlanTab() {
  const $ = (id) => /** @type {HTMLElement} */ (document.getElementById(id));
  const root = $('map3d');
  if (!root) return;
  const stage = $('map3dStage'), canvas = /** @type {HTMLCanvasElement} */ ($('map3dCanvas')), labels = $('map3dLabels');
  const fly = /** @type {HTMLButtonElement} */ ($('map3dFly')), pause = /** @type {HTMLButtonElement} */ ($('map3dPause'));
  const debug = new URLSearchParams(location.search).get('debug3d');
  /** @type {any} */ let map = null;
  let loading = false, selected = false, onScreen = false;
  /** @type {any} */ let plan = /** @type {any} */ (window).__mcduPlan || null;

  const setStatus = (s) => {
    root.dataset.status = s;
    $('map3dLoading').hidden = s !== 'loading';
    $('map3dNoWebgl').hidden = s !== 'nowebgl';
    $('map3dError').hidden = s !== 'error';
    canvas.hidden = s === 'nowebgl' || s === 'error';
    showPlan();
  };
  const sync = () => { if (!map) return; if (selected && onScreen && !document.hidden) map.start(); else map.stop(); };
  function showPlan() {
    const n = (plan?.items || []).filter((x) => x.t === 'wpt').length, ready = root.dataset.status === 'ready';
    $('map3dEmpty').hidden = !ready || n >= 2;
    $('map3dNoCrz').hidden = !(n >= 2 && !plan?.crz);
    fly.disabled = pause.disabled = !ready || n < 2;
    if (map && plan) map.setPlan(plan);
  }
  function renderLabels(list) {
    labels.replaceChildren(...list.map((l) => {
      const s = document.createElement('span');
      s.className = `map3d-label ${l.kind || ''}`;
      s.textContent = l.text;
      s.style.transform = `translate(${Math.round(l.x)}px, ${Math.round(l.y)}px)`;
      return s;
    }));
  }
  function load() {
    loading = true;
    setStatus('loading');
    import('./map.js')
      .then((m) => m.createPlanMap(canvas, { onLabels: renderLabels, debugFail: debug === 'nowebgl' }))
      .then((m) => {
        map = m;
        const r = stage.getBoundingClientRect();
        m.resize(r.width, r.height);
        setStatus('ready');
        sync();
      })
      .catch((e) => setStatus(e?.message === 'webgl-unavailable' ? 'nowebgl' : 'error'));
  }

  document.addEventListener('mcdu:tab', (e) => {
    selected = /** @type {CustomEvent} */ (e).detail === 'map';
    if (selected && !map && !loading) load();
    sync();
  });
  document.addEventListener('mcdu:plan', (e) => { plan = /** @type {CustomEvent} */ (e).detail; showPlan(); });
  document.addEventListener('visibilitychange', sync);
  new ResizeObserver(([e]) => map?.resize(e.contentRect.width, e.contentRect.height)).observe(stage);
  new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; sync(); }).observe(stage);
  fly.onclick = () => map?.fly();
  pause.onclick = () => map?.pause();
  $('map3dReload').onclick = () => location.reload();
  if (debug !== null) /** @type {any} */ (window).__mcduMap = () => (map ? { frames: map.frames, ...map.debug } : null);
}
