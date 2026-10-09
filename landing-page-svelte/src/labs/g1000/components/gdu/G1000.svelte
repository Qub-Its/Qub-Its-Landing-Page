<script>
  // The whole 2D G1000: PFD bezel, audio panel, MFD bezel, switches and the touch knob pad. Desktop shows all three
  // side by side or one enlarged (All / PFD / MFD / Audio, remembered); ≤ 980px always shows one at a time.
  // Double-clicking a unit's frame isolates it; "Enlarge" turns the whole course column into a full-window view.
  import { untrack } from 'svelte';
  import Bezel from './Bezel.svelte';
  import Pfd from './Pfd.svelte';
  import Mfd from './Mfd.svelte';
  import AudioPanel from './AudioPanel.svelte';
  import Switches from './Switches.svelte';
  import KnobPad from './KnobPad.svelte';
  import { g } from '../../lib/g1000.svelte.js';
  import { UI } from '../../i18n.js';
  import { loadView, saveView } from '../../lib/course.js';

  /**
   * @type {{ lang: 'es'|'en', explain: boolean, highlight: string|null, onpart: (id: string) => void, hidden?: boolean,
   *   zoomed?: boolean, onzoom?: (on: boolean) => void }}
   */
  let { lang, explain, highlight, onpart, hidden = false, zoomed = false, onzoom = () => {} } = $props();
  const t = $derived(UI[lang]);

  // tab: the view the student chose; follow: the unit the current task points at (shown on phones when tab is 'all').
  let tab = $state(loadView());
  let follow = $state(/** @type {'pfd'|'mfd'|'audio'} */ ('pfd'));
  let knob = $state(/** @type {null|{gdu: 'pfd'|'mfd', id: string}} */ (null));
  // Follow the highlighted part to its unit (always on phones; on desktop only while one unit is enlarged).
  $effect(() => {
    if (!highlight) return;
    const u = highlight.startsWith('mfd.') ? 'mfd' : highlight.startsWith('audio.') ? 'audio' : highlight.startsWith('pfd.') ? 'pfd' : null;
    if (!u) return;
    follow = u;
    if (untrack(() => tab) !== 'all') tab = u;
  });
  /** @param {'all'|'pfd'|'mfd'|'audio'} v */
  function pick(v) { tab = v; if (v !== 'all') follow = v; saveView(v); }
  /** Double-click on a unit's frame (not on a control or the screen) toggles that unit alone ↔ all. */
  function frameDbl(e, /** @type {'pfd'|'mfd'|'audio'} */ u) {
    const el = /** @type {Element} */ (e.target);
    const svg = el.parentElement;
    if (!svg?.matches('svg.gdu, svg.audio') || el !== svg.querySelector(':scope > rect')) return;
    pick(tab === u ? 'all' : u);
  }
</script>

<div class="g1000" {hidden}>
  <div class="unit-bar">
    <div class="unit-tabs" role="tablist" aria-label={t.viewLabel}>
      {#each [['all', t.tabAll], ['pfd', t.tabPfd], ['mfd', t.tabMfd], ['audio', t.tabAudio]] as [id, label]}
        <button type="button" role="tab" class="chip" class:tab-all={id === 'all'}
          aria-selected={tab === id} data-on={tab === 'all' && follow === id ? '' : null}
          onclick={() => pick(/** @type {any} */ (id))}>{label}</button>
      {/each}
    </div>
    <button type="button" class="btn zoom-btn" aria-pressed={zoomed} onclick={() => onzoom(!zoomed)}>{zoomed ? t.zoomOut : t.zoomIn}</button>
  </div>
  <div class="units" data-tab={tab} data-m={tab === 'all' ? follow : tab}>
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="unit unit-pfd" ondblclick={(e) => frameDbl(e, 'pfd')}>
      <Bezel gdu="pfd" {explain} {highlight} {onpart} onknob={(k) => (knob = k)}>
        <Pfd s={g} {highlight} {onpart} menuLabels={t.menuItems} />
      </Bezel>
    </div>
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="unit unit-audio" ondblclick={(e) => frameDbl(e, 'audio')}><AudioPanel {explain} {highlight} {onpart} /></div>
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="unit unit-mfd" ondblclick={(e) => frameDbl(e, 'mfd')}>
      <Bezel gdu="mfd" {explain} {highlight} {onpart} onknob={(k) => (knob = k)}>
        <Mfd s={g} {highlight} {onpart} menuLabels={t.menuItems} />
      </Bezel>
    </div>
  </div>
  <Switches {lang} {explain} {highlight} {onpart} />
  {#if knob}<KnobPad {lang} {knob} onclose={() => (knob = null)} />{/if}
</div>
