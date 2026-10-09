<script>
  // 3D stage: lazy-loads the director (three.js chunk) on first mount, renders only while `active`, on screen and
  // with the tab visible. Explode scene: tapping picks an LRU (onpick). Falls back to an SVG diagram without WebGL
  // (?debug3d=nowebgl forces it); ?debug3d exposes window.__g1000_3d().
  import { onMount, untrack } from 'svelte';
  import Fallback3d from './Fallback3d.svelte';
  import { UI, tr } from '../i18n.js';

  /**
   * @type {{ lang: 'es'|'en', active: boolean, scene: 'cockpit'|'explode', cue: string, label?: {es: string, en: string}|null,
   *   pickable?: boolean, onpick?: (part: string) => void }}
   */
  let { lang, active, scene, cue, label = null, pickable = false, onpick = () => {} } = $props();
  const t = $derived(UI[lang]);

  let canvas = $state(/** @type {HTMLCanvasElement|undefined} */ (undefined));
  let stage = $state(/** @type {HTMLDivElement|undefined} */ (undefined));
  let status = $state(/** @type {'loading'|'ready'|'nowebgl'|'error'} */ ('loading'));
  /** @type {Awaited<ReturnType<typeof import('../view3d/director.js').createDirector>> | null} */
  let view = null;
  let onScreen = true, gone = false;
  const debug = new URLSearchParams(location.search).get('debug3d');
  const reduced = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const screens = () => ({
    pfd: /** @type {SVGSVGElement|null} */ (document.querySelector('#gdu-pfd > svg')),
    mfd: /** @type {SVGSVGElement|null} */ (document.querySelector('#gdu-mfd > svg')),
  });

  function load() {
    status = 'loading';
    import('../view3d/director.js')
      .then((m) => m.createDirector(/** @type {HTMLCanvasElement} */ (canvas), { debugFail: debug === 'nowebgl', reduced, screens }))
      .then((v) => {
        if (gone) { v.dispose(); return; }
        view = v;
        const r = stage?.getBoundingClientRect();
        if (r) v.resize(r.width, r.height);
        v.setScene(untrack(() => scene));
        v.cue(untrack(() => cue));
        status = 'ready';
        sync();
      })
      .catch((e) => { status = e?.message === 'webgl-unavailable' ? 'nowebgl' : 'error'; });
  }
  function sync() {
    if (!view) return;
    if (active && onScreen && !document.hidden) view.start(); else view.stop();
  }

  let wasActive = false;
  $effect(() => {
    const a = active;
    sync();
    // Coming back from the 2D G1000: pushIn moved the camera, so frame the cue again.
    if (a && !wasActive) untrack(() => view?.cue(cue));
    wasActive = a;
  });
  $effect(() => { const sc = scene; if (view && view.scene !== sc) { view.setScene(sc); view.cue(untrack(() => cue)); } });
  $effect(() => { const c = cue; view?.cue(c); });

  /** Called by Stage before crossfading to the 2D G1000. */
  export function pushIn(screen = 'pfd') { return view ? view.pushIn(screen) : Promise.resolve(); }

  /** @param {PointerEvent} e */
  function tap(e) {
    if (!pickable || !view) return;
    const part = view.pick(e.clientX, e.clientY);
    if (part) onpick(part);
  }

  onMount(() => {
    load();
    const ro = new ResizeObserver(([e]) => view?.resize(e.contentRect.width, e.contentRect.height));
    const io = new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; sync(); });
    if (stage) { ro.observe(stage); io.observe(stage); }
    document.addEventListener('visibilitychange', sync);
    if (debug !== null) /** @type {any} */ (window).__g1000_3d = () => ({ status, scene: view?.scene ?? null, frames: view?.frames ?? 0 });
    return () => {
      gone = true;
      ro.disconnect(); io.disconnect();
      document.removeEventListener('visibilitychange', sync);
      view?.dispose(); view = null;
    };
  });
</script>

<div class="scene3d" bind:this={stage} data-status={status}>
  <canvas bind:this={canvas} hidden={status === 'nowebgl' || status === 'error'} onpointerup={tap} style:cursor={pickable ? 'pointer' : 'default'}></canvas>
  {#if status === 'nowebgl' || status === 'error'}
    <Fallback3d {lang} {scene} {cue} {pickable} {onpick} />
    <p class="s3d-note">{status === 'nowebgl' ? t.nowebgl : t.error3d}
      {#if status === 'error'}<button type="button" class="linkbtn" onclick={() => location.reload()}>{t.reload}</button>{/if}</p>
  {:else if status === 'loading'}
    <p class="s3d-msg">{t.loading3d}</p>
  {/if}
  {#if label}<span class="s3d-label">{tr(label, lang)}</span>{/if}
  {#if pickable && status === 'ready'}<span class="s3d-hint">{t.pick3d}</span>{/if}
</div>
