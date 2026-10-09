<script>
  // "Muéstrame / Show me" for a task: resets to the task setup, then plays each demo step: control events one by
  // one (the pressed control flashes), sim fast-forward for waits, part taps. Shows the caption of the step.
  import { onMount } from 'svelte';
  import { g, send, reset, fastForward, ui } from '../../lib/g1000.svelte.js';
  import { UI, tr } from '../../i18n.js';

  /** @type {{ lang: 'es'|'en', task: any, onpart: (id: string) => void, onclose: () => void }} */
  let { lang, task, onpart, onclose } = $props();
  const t = $derived(UI[lang]);
  let i = $state(0);
  let playing = $state(false);
  let run = 0;
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  /** Flash id of the control an event presses (see Bezel/AudioPanel). */
  function flashOf(ev) {
    if (ev.type === 'knob' || ev.type === 'push') return `knob:${ev.gdu}:${ev.id}`;
    if (ev.type === 'key') return `key:${ev.gdu}:${ev.id}`;
    if (ev.type === 'soft') return `soft:${ev.gdu}:${ev.n}`;
    if (ev.type === 'audio') return `audio:${ev.id}`;
    return null;
  }

  async function play(n) {
    const me = ++run;
    i = n;
    playing = true;
    const d = task.demo[n];
    for (const e of d.events ?? []) {
      if (me !== run) return;
      const ev = typeof e === 'function' ? e(g) : e;
      ui.flash = flashOf(ev);
      await sleep(ev.type === 'char' ? 120 : 380);
      if (me !== run) { ui.flash = null; return; }
      send(ev);
      ui.flash = null;
    }
    if (d.wait) for (let k = 0; k < 12 && me === run; k++) { fastForward(d.wait / 12); await sleep(100); }
    if (d.part && me === run) onpart(d.part);
    if (me === run) playing = false;
  }

  function replay() {
    reset(task.setup.scenario, task.setup.apply);
    play(0);
  }

  onMount(() => { replay(); return () => { run++; ui.flash = null; }; });
</script>

<div class="demobar" role="region" aria-label={t.demoTitle}>
  <div class="tb-head"><span class="lvl">{t.demoTitle} · {t.demoStep(i + 1, task.demo.length)}</span></div>
  <p class="demo-say" aria-live="polite">{tr(task.demo[i].say, lang)}</p>
  <div class="demo-actions">
    <button type="button" class="btn primary" disabled={i + 1 >= task.demo.length || playing} onclick={() => play(i + 1)}>{t.demoNext}</button>
    <button type="button" class="btn" onclick={replay}>{t.demoReplay}</button>
    <button type="button" class="btn ghost" onclick={onclose}>{t.demoClose}</button>
  </div>
</div>
