<script>
  // MASTER, AVIONICS and starter switches plus the instructor-pilot mode. Switches explain themselves in explain mode.
  import { g, send } from '../../lib/g1000.svelte.js';
  import { UI } from '../../i18n.js';

  /** @type {{ lang: 'es'|'en', explain: boolean, highlight: string|null, onpart: (id: string) => void }} */
  let { lang, explain, highlight, onpart } = $props();
  const t = $derived(UI[lang]);

  const SW = /** @type {const} */ ([['master', 'swMaster', 'sw.master'], ['avionics', 'swAvionics', 'sw.avionics'], ['engine', 'swEngine', 'sw.engine']]);
  function flip(id, part) {
    if (explain) { onpart(part); return; }
    send({ type: 'switch', id, on: !g.power[id] });
  }
</script>

<div class="switches" role="group" aria-label={t.switches}>
  {#each SW as [id, key, part]}
    <button type="button" class="sw" class:hl={highlight === part} data-part={part} aria-pressed={g.power[id]} onclick={() => flip(id, part)}>
      <span class="sw-lever" class:on={g.power[id]}></span>{t[key]}
    </button>
  {/each}
  {#if !g.ac.onGround}
    <span class="pilot" title={t.instructor}>
      <span class="pilot-tag">{t.instructor}</span>
      <button type="button" class="chip" aria-pressed={g.pilot.mode === 'auto'} onclick={() => send({ type: 'pilot', mode: 'auto' })}>{t.pilotAuto}</button>
      <button type="button" class="chip" aria-pressed={g.pilot.mode === 'hdg'} onclick={() => send({ type: 'pilot', mode: 'hdg' })}>{t.pilotHdg}</button>
    </span>
  {/if}
</div>
