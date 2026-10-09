<script>
  // Left-hand stage: the live 2D G1000 or a 3D scene (cockpit / exploded). The 3D chunk loads the first time a 3D
  // view is needed and then stays mounted (stopped while hidden). Leaving the cockpit for the G1000 pushes the camera
  // into the screen before the crossfade.
  import G1000 from './gdu/G1000.svelte';
  import Scene3d from './Scene3d.svelte';

  /**
   * @type {{ lang: 'es'|'en', view: 'g1000'|'cockpit'|'explode', cue: string, cueLabel?: {es: string, en: string}|null,
   *   explain: boolean, highlight: string|null, onpart: (id: string) => void }}
   */
  let { lang, view, cue, cueLabel = null, explain, highlight, onpart } = $props();

  let shown = $state(/** @type {'g1000'|'cockpit'|'explode'} */ ('g1000'));
  let loaded3d = $state(false);
  let scene = $state(/** @type {'cockpit'|'explode'} */ ('cockpit'));
  /** @type {any} */
  let s3d = $state();
  let seq = 0;

  $effect(() => {
    const target = view;
    const me = ++seq;
    if (target !== 'g1000') { loaded3d = true; scene = target; shown = target; return; }
    if (shown === 'cockpit' && s3d) {
      s3d.pushIn(highlight?.startsWith('mfd.') ? 'mfd' : 'pfd').then(() => { if (me === seq) shown = 'g1000'; });
    } else shown = 'g1000';
  });
</script>

<div class="stage" data-view={shown}>
  <div class="stage-2d" class:off={shown !== 'g1000'}>
    <G1000 {lang} {explain} {highlight} {onpart} />
  </div>
  {#if loaded3d}
    <div class="stage-3d" class:off={shown === 'g1000'}>
      <Scene3d bind:this={s3d} {lang} active={shown !== 'g1000'} {scene} {cue} label={cueLabel}
        pickable={scene === 'explode'} onpick={onpart} />
    </div>
  {/if}
</div>
