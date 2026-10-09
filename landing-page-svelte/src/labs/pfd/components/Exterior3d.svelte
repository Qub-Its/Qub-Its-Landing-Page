<script>
  // 3D exterior view window: lazy-loads the three.js scene on first mount, renders only while open, on screen and
  // with the tab visible. Labels are HTML (no 3D text). ?debug3d exposes a frame counter; ?debug3d=nowebgl forces
  // the no-WebGL path.
  import { onMount, untrack } from 'svelte';
  import { flight } from '../lib/flight.svelte.js';
  import { poseFrom } from '../view3d/pose.js';
  import { UI } from '../i18n.js';

  /** @type {{ lang: 'es'|'en', open: boolean, camera: 'side'|'rear'|'q34', oncamera: (id: 'side'|'rear'|'q34') => void, onclose: () => void }} */
  let { lang, open, camera, oncamera, onclose } = $props();

  const t = $derived(UI[lang]);
  const aoa = $derived(poseFrom(flight).aoa);
  const CAMS = /** @type {const} */ (['side', 'rear', 'q34']);
  const camLabel = { side: 'camSide', rear: 'camRear', q34: 'camQ34' };

  let canvas = $state(/** @type {HTMLCanvasElement|undefined} */ (undefined));
  let stage = $state(/** @type {HTMLDivElement|undefined} */ (undefined));
  let status = $state(/** @type {'loading'|'ready'|'nowebgl'|'error'} */ ('loading'));
  /** @type {Awaited<ReturnType<typeof import('../view3d/exterior.js').createExteriorView>> | null} */
  let view = null;
  let onScreen = true;
  let gone = false;
  const debug = new URLSearchParams(location.search).get('debug3d');

  // Loads the scene chunk and creates the view. Re-run on reopen after an error (e.g. chunk fetch failed).
  function load() {
    status = 'loading';
    import('../view3d/exterior.js')
      .then((m) => m.createExteriorView(/** @type {HTMLCanvasElement} */ (canvas), () => flight, { camera, debugFail: debug === 'nowebgl' }))
      .then((v) => {
        if (gone) { v.dispose(); return; }
        view = v;
        const r = stage?.getBoundingClientRect();
        if (r) v.resize(r.width, r.height);
        v.setCamera(camera);
        status = 'ready';
        sync();
      })
      .catch((e) => { status = e?.message === 'webgl-unavailable' ? 'nowebgl' : 'error'; });
  }

  function sync() {
    if (!view) return;
    if (open && onScreen && !document.hidden) view.start();
    else view.stop();
  }

  $effect(() => { open; sync(); });
  // Read `camera` before touching `view`: view is null until the lazy scene loads, and `view?.setCamera(camera)` would
  // short-circuit without reading the prop, so the effect would never subscribe to camera changes.
  $effect(() => { const id = camera; view?.setCamera(id); });
  // Retry only on a closed → open transition, never in a loop. Covers scene-creation errors; a failed chunk fetch is
  // cached by the browser's module map until reload, hence the reload button in the error message.
  let wasOpen = untrack(() => open); // initial value on purpose: the effect tracks transitions
  $effect(() => {
    const o = open;
    if (o && !wasOpen && untrack(() => status) === 'error') load();
    wasOpen = o;
  });

  onMount(() => {
    load();
    const ro = new ResizeObserver(([e]) => view?.resize(e.contentRect.width, e.contentRect.height));
    const io = new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; sync(); });
    if (stage) { ro.observe(stage); io.observe(stage); }
    document.addEventListener('visibilitychange', sync);
    if (debug !== null) {
      /** @type {any} */ (window).__pfd3dFrames = () => view?.frames ?? 0;
      /** @type {any} */ (window).__pfd3dCam = () => view?.cameraPosition ?? null;
    }
    return () => {
      gone = true;
      ro.disconnect(); io.disconnect();
      document.removeEventListener('visibilitychange', sync);
      view?.dispose(); view = null;
    };
  });
</script>

<section class="ext3d" hidden={!open} data-status={status} aria-label={t.ext3dTitle}>
  <div class="ext3d-head">
    <span class="ext3d-title">{t.ext3dTitle}</span>
    <div class="ext3d-cams" role="group" aria-label={t.ext3dTitle}>
      {#each CAMS as id}
        <button type="button" class="ext3d-cam" data-cam={id} aria-pressed={camera === id} onclick={() => oncamera(id)}>{t[camLabel[id]]}</button>
      {/each}
    </div>
    <button type="button" class="ext3d-close" aria-label={t.close} onclick={onclose}>×</button>
  </div>
  <div class="ext3d-stage" bind:this={stage}>
    <canvas bind:this={canvas} hidden={status === 'nowebgl' || status === 'error'}></canvas>
    {#if status === 'ready'}
      <div class="ext3d-legend" aria-live="off">
        <span><i class="sw axis"></i>{t.ext3dAxis}</span>
        <span><i class="sw fpv"></i>{t.ext3dFpv}</span>
        <span><i class="sw aoa"></i>AoA {aoa.toFixed(1)}°</span>
      </div>
    {:else}
      <div class="ext3d-msg">
        <p>{status === 'loading' ? t.ext3dLoading : status === 'nowebgl' ? t.ext3dNoWebgl : t.ext3dError}</p>
        {#if status === 'error'}<button type="button" class="ext3d-reload" onclick={() => location.reload()}>{t.ext3dReload}</button>{/if}
      </div>
    {/if}
  </div>
</section>

<style>
  .ext3d { background: var(--panel); border: 1px solid var(--line); border-radius: 8px; overflow: hidden; display: flex; flex-direction: column; }
  .ext3d[hidden] { display: none; }
  .ext3d-head { display: flex; align-items: center; gap: 8px; padding: 6px 8px 6px 12px; border-bottom: 1px solid var(--line); background: var(--panel-2); }
  .ext3d-title { font-family: var(--f-ui); font-size: 11px; letter-spacing: .12em; text-transform: uppercase; color: var(--muted); margin-right: auto; }
  .ext3d-cams { display: flex; gap: 4px; }
  .ext3d-cam { font-family: var(--f-ui); font-size: 11px; letter-spacing: .06em; text-transform: uppercase; background: none; border: 1px solid var(--line); border-radius: 4px; color: var(--muted); padding: 4px 8px; cursor: pointer; }
  .ext3d-cam[aria-pressed="true"] { background: var(--cyan); border-color: var(--cyan); color: #06222a; }
  .ext3d-close { background: none; border: 0; color: var(--muted); font-size: 20px; line-height: 1; padding: 0 6px; cursor: pointer; }
  .ext3d-stage { position: relative; height: 240px; background: #3d86c6; }
  .ext3d-stage canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }
  .ext3d-legend { position: absolute; left: 8px; bottom: 8px; display: flex; flex-wrap: wrap; gap: 4px 12px; font-size: 12px; color: #fff; background: #0b0f12a6; border-radius: 4px; padding: 4px 8px; pointer-events: none; }
  .ext3d-legend span { display: inline-flex; align-items: center; gap: 6px; }
  .sw { display: inline-block; width: 14px; height: 3px; border-radius: 2px; }
  .sw.axis { background: #fff; } .sw.fpv { background: var(--green); } .sw.aoa { background: var(--amber); }
  .ext3d-msg { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; padding: 16px; text-align: center; color: #fff; background: var(--panel); }
  .ext3d-msg p { margin: 0; }
  .ext3d-reload { font-family: var(--f-ui); font-size: 12px; letter-spacing: .06em; text-transform: uppercase; background: var(--panel-2); border: 1px solid var(--line); border-radius: 4px; color: var(--fg); padding: 6px 12px; cursor: pointer; }
  @media (max-width: 980px) { .ext3d-stage { height: 200px; } }
</style>
