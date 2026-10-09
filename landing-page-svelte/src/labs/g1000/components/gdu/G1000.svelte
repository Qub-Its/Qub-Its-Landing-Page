<script>
  // The whole 2D G1000: PFD bezel, audio panel, MFD bezel, switches and the touch knob pad. Desktop shows all three
  // side by side; ≤ 980px shows one at a time with PFD / MFD / Audio tabs.
  import Bezel from './Bezel.svelte';
  import Pfd from './Pfd.svelte';
  import Mfd from './Mfd.svelte';
  import AudioPanel from './AudioPanel.svelte';
  import Switches from './Switches.svelte';
  import KnobPad from './KnobPad.svelte';
  import { g } from '../../lib/g1000.svelte.js';
  import { UI } from '../../i18n.js';

  /** @type {{ lang: 'es'|'en', explain: boolean, highlight: string|null, onpart: (id: string) => void, hidden?: boolean }} */
  let { lang, explain, highlight, onpart, hidden = false } = $props();
  const t = $derived(UI[lang]);

  let tab = $state(/** @type {'pfd'|'mfd'|'audio'} */ ('pfd'));
  let knob = $state(/** @type {null|{gdu: 'pfd'|'mfd', id: string}} */ (null));
  // Follow the highlighted part to its unit on small screens.
  $effect(() => {
    if (!highlight) return;
    if (highlight.startsWith('mfd.')) tab = 'mfd';
    else if (highlight.startsWith('audio.')) tab = 'audio';
    else if (highlight.startsWith('pfd.')) tab = 'pfd';
  });
</script>

<div class="g1000" {hidden}>
  <div class="unit-tabs" role="tablist">
    {#each [['pfd', t.tabPfd], ['mfd', t.tabMfd], ['audio', t.tabAudio]] as [id, label]}
      <button type="button" role="tab" class="chip" aria-selected={tab === id} onclick={() => (tab = /** @type {any} */ (id))}>{label}</button>
    {/each}
  </div>
  <div class="units" data-tab={tab}>
    <div class="unit unit-pfd">
      <Bezel gdu="pfd" {explain} {highlight} {onpart} onknob={(k) => (knob = k)}>
        <Pfd s={g} {highlight} {onpart} menuLabels={t.menuItems} />
      </Bezel>
    </div>
    <div class="unit unit-audio"><AudioPanel {explain} {highlight} {onpart} /></div>
    <div class="unit unit-mfd">
      <Bezel gdu="mfd" {explain} {highlight} {onpart} onknob={(k) => (knob = k)}>
        <Mfd s={g} {highlight} {onpart} menuLabels={t.menuItems} />
      </Bezel>
    </div>
  </div>
  <Switches {lang} {explain} {highlight} {onpart} />
  {#if knob}<KnobPad {lang} {knob} onclose={() => (knob = null)} />{/if}
</div>
