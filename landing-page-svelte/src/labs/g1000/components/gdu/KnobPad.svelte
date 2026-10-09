<script>
  // Touch helper: after tapping a knob's outer ring, a small pad with ▲/▼ for each ring and PUSH appears.
  import { send } from '../../lib/g1000.svelte.js';
  import { KNOBS } from './layout.js';
  import { UI } from '../../i18n.js';

  /** @type {{ lang: 'es'|'en', knob: {gdu: 'pfd'|'mfd', id: string}, onclose: () => void }} */
  let { lang, knob, onclose } = $props();
  const t = $derived(UI[lang]);
  const k = $derived(KNOBS[knob.id]);
  const turn = (ring, d) => send({ type: 'knob', gdu: knob.gdu, id: knob.id, ring, d });
</script>

<div class="knobpad" role="dialog" aria-label={`${t.knobPad} ${k.label}`}>
  <span class="kp-title">{knob.gdu.toUpperCase()} · {k.label}</span>
  {#if k.dual}
    <span class="kp-row"><span>{t.outer}</span><button type="button" class="btn" onclick={() => turn('outer', -1)}>▼</button><button type="button" class="btn" onclick={() => turn('outer', 1)}>▲</button></span>
  {/if}
  <span class="kp-row"><span>{k.dual ? t.inner : k.label}</span><button type="button" class="btn" onclick={() => turn('inner', -1)}>▼</button><button type="button" class="btn" onclick={() => turn('inner', 1)}>▲</button></span>
  <span class="kp-row"><button type="button" class="btn" onclick={() => send({ type: 'push', gdu: knob.gdu, id: knob.id })}>{t.push}</button>
    <button type="button" class="btn ghost" onclick={onclose}>{t.close}</button></span>
</div>
