<script>
  // "Muéstrame / Show me" bar: puts the instrument in the problem's starting state, then plays the demo steps one
  // at a time (caption + animation). Shared by exercises and practice.
  import { onMount } from 'svelte';
  import { animateTo, applyState, resetState } from '../lib/e6b.svelte.js';
  import { UI, tr } from '../i18n.js';

  /** @type {{ lang: 'es'|'en', steps: ({say:{es:string,en:string}} & Record<string, any>)[], setup?: object, onclose: () => void }} */
  let { lang, steps, setup = {}, onclose } = $props();

  const t = $derived(UI[lang]);
  let i = $state(0);
  let playing = $state(false);
  let run = 0;

  async function play(n) {
    const me = ++run;
    i = n;
    playing = true;
    const { say, ...patch } = steps[n];
    await animateTo(patch, 800);
    if (me === run) playing = false;
  }

  function replay() {
    resetState();
    applyState(setup);
    play(0);
  }

  onMount(() => { replay(); return () => { run++; }; });
</script>

<div class="demobar" role="region" aria-label={t.demoTitle}>
  <div class="tb-head">
    <span class="lvl">{t.demoTitle} · {t.demoStep(i + 1, steps.length)}</span>
  </div>
  <p class="demo-say" aria-live="polite">{tr(steps[i].say, lang)}</p>
  <div class="demo-actions">
    <button type="button" class="btn primary" disabled={i + 1 >= steps.length || playing} onclick={() => play(i + 1)}>{t.demoNext}</button>
    <button type="button" class="btn" onclick={replay}>{t.demoReplay}</button>
    <button type="button" class="btn ghost" onclick={onclose}>{t.demoClose}</button>
  </div>
</div>
